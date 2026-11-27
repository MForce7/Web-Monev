import type { BarisPantau, StatusPantau } from "./types";
import { BULAN, daftar } from "./types";
import { unduhExcel, type Sel as SelEkspor } from "../../../lib/eksporTabel.ts";
import { warnaStatus } from "./tampilanStatus";

/* ---------- Unduh Excel: tab "Ringkasan" (status per bulan) + tab "Rincian" (yang belum sesuai) ---------- */
export async function unduhExcelPemantauan(pusatRiset: string, data: BarisPantau[]) {
  const total: Record<StatusPantau, number> = { Lengkap: 0, "Belum Lengkap": 0, Kosong: 0 };
  data.forEach((d) =>
    BULAN.forEach((b) => {
      const s = d.bulan?.[b]?.status;
      if (s) total[s]++;
    })
  );
  const ringkasan = `Ketua tim: ${data.length}    Lengkap: ${total.Lengkap}    Belum lengkap: ${total["Belum Lengkap"]}    Kosong: ${total.Kosong}`;

  const rincian: SelEkspor[][] = [];
  data.forEach((d) =>
    BULAN.forEach((b) => {
      const s = d.bulan?.[b];
      if (s?.status && s.status !== "Lengkap") {
        rincian.push([
          d.nama,
          d.judul ?? "",
          d.pusatRiset ?? "",
          b,
          s.status,
          daftar(s.belumSesuai).map((x) => `• ${x}`).join("\n"),
        ]);
      }
    })
  );

  await unduhExcel(`Rekap-Pemantauan-${pusatRiset.replace(/[^\w]+/g, "-")}`, [
    {
      nama: "Ringkasan",
      judul: "Rekap Pemantauan Pengisian Logbook",
      subjudul: pusatRiset,
      ringkasan,
      kolom: ["No", "Nama Ketua Tim", "Judul Aktivitas", "Pusat Riset", ...BULAN],
      baris: data.map((d, i) => [
        i + 1,
        d.nama,
        d.judul ?? "",
        d.pusatRiset ?? "",
        ...BULAN.map((b) => d.bulan?.[b]?.status ?? "-"),
      ]),
      rataTengah: [0, 3, ...BULAN.map((_, i) => i + 4)],
      lebarKolom: [6, 34, 40, 22, ...BULAN.map(() => 15)],
      warnaSel: (nilai, kol) => (kol >= 4 ? warnaStatus(nilai) : undefined),
    },
    ...(rincian.length
      ? [
          {
            nama: "Rincian",
            judul: "Rincian yang belum sesuai",
            subjudul: pusatRiset,
            kolom: ["Nama Ketua Tim", "Judul Aktivitas", "Pusat Riset", "Bulan", "Status", "Belum diisi di logbook"],
            baris: rincian,
            rataTengah: [2, 3, 4],
            lebarKolom: [34, 40, 22, 14, 16, 60],
            warnaSel: (nilai: SelEkspor, kol: number) => (kol === 4 ? warnaStatus(nilai) : undefined),
          },
        ]
      : []),
  ]);
}