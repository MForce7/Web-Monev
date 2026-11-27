import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";
import BilahEkspor from "./BilahEkspor.tsx";
import { bersihkanNama, teksLink, unduhExcel, unduhPdfTabel, type Grup } from "../../lib/eksporTabel.ts";
import type {
  BarisLogbookRekap,
  MenuLogbookRekap,
} from "../../lib/supabaseRekapitulasi";

/* ---------- Kolom ---------- */
const NOMOR = "No";
const NAMA_KETUA = "Nama Ketua Tim";
const kemajuan = ["Uraian Kemajuan Aktivitas", "Kendala Ditemui", "Mitigasi / Rencana Tindak Lanjut", "Data Dukung Progres"];
const output = ["Jenis Output", "Judul Output", "Status", "Presentase Progress (%)", "Output Data Dukung"];
const kolom = [...kemajuan, ...output];

const th = "border-b border-r border-white/25 px-3 py-2 text-center text-[11px] font-bold text-white last:border-r-0";
const td =
  "border-b border-r border-[#dbe6f7] px-3 py-2 text-center text-xs leading-snug text-[#1b3560] last:border-r-0 [overflow-wrap:break-word]";

/* ---------- Ekspor (PDF dan Excel) ---------- */
const KOLOM_EKSPOR = [NOMOR, NAMA_KETUA, "Bulan", ...kolom];
const GRUP_EKSPOR: Grup = {
  tetap: 3,
  items: [
    { label: "Kemajuan Aktivitas / Kegiatan", span: kemajuan.length },
    { label: "Output Presentase Progres", span: output.length },
  ],
};
const RATA_TENGAH = [0, 2, 6, 7, 9, 10, 11];
const LEBAR_PDF = [8, 28, 16, 40, 30, 36, 22, 18, 34, 16, 16, 26]; // mm
const LEBAR_XLSX = [6, 28, 16, 40, 30, 36, 28, 20, 36, 16, 14, 30]; // karakter

const barisEkspor = (data: BarisLogbookRekap[], denganUrl: boolean) =>
  data.map((d, i) => [
    i + 1,
    d.ketua ?? "",
    d.bulan,
    d.aktivitas?.uraian ?? "",
    d.aktivitas?.kendala ?? "",
    d.aktivitas?.mitigasi ?? "",
    teksLink(d.aktivitas?.dataDukung, denganUrl),
    d.output?.jenis ?? "",
    d.output?.judul ?? "",
    d.output?.status ?? "",
    `${d.output?.progres ?? 0}%`,
    teksLink(d.output?.dataDukung, denganUrl),
  ]);

/* ---------- Ambil data ---------- */
// Nilai kosong atau diawali "Semua" dianggap belum memilih (tidak memfilter)
const pilih = (v?: string | null): v is string => !!v && !v.startsWith("Semua");

const rentangBulan: Record<string, string[]> = {
  "Triwulan 1": ["Januari", "Februari", "Maret"],
  "Triwulan 2": ["April", "Mei", "Juni"],
  "Triwulan 3": ["Juli", "Agustus", "September"],
  "Triwulan 4": ["Oktober", "November", "Desember"],
  "Semester 1": ["Januari", "Februari", "Maret", "April", "Mei", "Juni"],
  "Semester 2": ["Juli", "Agustus", "September", "Oktober", "November", "Desember"],
};

function ambilData(
  semua: BarisLogbookRekap[],
  menu?: MenuLogbookRekap,
  pusatRiset?: string | null,
  bulan?: string | null,
): BarisLogbookRekap[] {
  const bulanDipilih = bulan ? rentangBulan[bulan] ?? [bulan] : null;

  return semua
    .filter((baris) => !menu || baris.menu === menu)
    .filter((baris) => !pilih(pusatRiset) || baris.pusatRiset === pusatRiset)
    .filter((baris) => !bulanDipilih || bulanDipilih.includes(baris.bulan));
}

type LinkDukung = { label: string; url: string };

/* ---------- Komponen kecil ---------- */
function DaftarLink({ links }: { links?: LinkDukung[] }) {
  if (!links || links.length === 0) return <span className="text-slate-400">–</span>;
  return (
    <ul className="space-y-1">
      {links.map((l, i) => (
        <li key={i}>
          <a href={l.url} target="_blank" rel="noreferrer" className="text-[#2a5aa8] hover:underline">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Td({ children, kiri }: { children?: ReactNode; kiri?: boolean }) {
  return <td className={`${td} ${kiri ? "text-left" : ""}`}>{children}</td>;
}

function TombolPanah({ arah, onClick }: { arah: "kiri" | "kanan"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arah === "kanan" ? "Geser ke kanan" : "Geser ke kiri"}
      className={`absolute top-16 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-[#2a5aa8] shadow-[0_2px_8px_rgba(27,63,120,0.3)] transition hover:bg-[#eaf0fa] ${
        arah === "kanan" ? "right-1.5" : "left-1.5"
      }`}
    >
      {arah === "kanan" ? "›" : "‹"}
    </button>
  );
}

/* ---------- Tabel ---------- */
type Props = {
  data: BarisLogbookRekap[];
  menu?: MenuLogbookRekap;
  pusatRiset?: string | null;
  bulan?: string | null; // Januari ... Desember
};

export default function Tabel({
  data: semua,
  menu,
  pusatRiset,
  bulan,
}: Props) {
  const data = ambilData(semua, menu, pusatRiset, bulan);
  const jumlahBaris = Math.max(data.length, JUMLAH_BARIS_KOSONG);

  const ref = useRef<HTMLDivElement>(null);
  const [bisaKiri, setBisaKiri] = useState(false);
  const [bisaKanan, setBisaKanan] = useState(false);

  const cek = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setBisaKiri(el.scrollLeft > 4);
    setBisaKanan(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    cek();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(cek);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cek]);

  const geser = (arah: 1 | -1) => ref.current?.scrollBy({ left: arah * 320, behavior: "smooth" });

  /* ----- unduh PDF / Excel sesuai filter yang sedang aktif ----- */
  const subjudul = [
    pilih(menu) ? menu : "Semua menu",
    pilih(pusatRiset) ? pusatRiset : "Semua pusat riset",
    pilih(bulan) ? bulan : "Semua bulan",
  ].join("  ·  ");
  const namaFile = `Rekap-Logbook-${bersihkanNama(subjudul)}`;
  const JUDUL = "Rekap Logbook";

  const unduhPdf = () =>
    unduhPdfTabel({
      judul: JUDUL,
      subjudul,
      ringkasan: `Jumlah data: ${data.length}`,
      namaFile,
      kolom: KOLOM_EKSPOR,
      grup: GRUP_EKSPOR,
      baris: barisEkspor(data, false),
      rataTengah: RATA_TENGAH,
      lebarKolom: LEBAR_PDF,
    });

  const unduhXlsx = () =>
    unduhExcel(namaFile, [
      {
        nama: "Rekap Logbook",
        judul: JUDUL,
        subjudul,
        ringkasan: `Jumlah data: ${data.length}`,
        kolom: KOLOM_EKSPOR,
        grup: GRUP_EKSPOR,
        baris: barisEkspor(data, true),
        rataTengah: RATA_TENGAH,
        lebarKolom: LEBAR_XLSX,
      },
    ]);

  return (
    // Pembungkus luar membawa bayangan + sudut bulat; bagian dalam dipotong dengan clip-path
    <div className="w-full min-w-0 rounded-2xl shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
      <div className="isolate w-full overflow-hidden rounded-2xl border border-[#dbe6f7] [clip-path:inset(0_round_1rem)]">
        {/* Bilah atas: judul + tombol unduh PDF dan Excel */}
        <BilahEkspor judul="Rekap logbook" subjudul={subjudul} onPdf={unduhPdf} onExcel={unduhXlsx} />

        {/* Petunjuk: hanya muncul kalau tabel memang bisa digeser */}
        {(bisaKiri || bisaKanan) && (
          <p className="flex items-center justify-center gap-2 border-b border-[#dbe6f7] bg-[#f5f8fd] px-3 py-1.5 text-center text-[11px] font-semibold text-[#2a5aa8] sm:text-xs">
            {bisaKiri && <span aria-hidden>←</span>}
            Geser tabel ke samping untuk melihat kolom lainnya
            {bisaKanan && (
              <span aria-hidden className="animate-pulse">
                →
              </span>
            )}
          </p>
        )}

        <div className="relative">
          {/* Area geser: supaya kolom paling kanan (Output Data Dukung) tidak terpotong */}
          <div
            ref={ref}
            onScroll={cek}
            className="overflow-x-auto overscroll-x-contain [scrollbar-color:#2a5aa8_#eaf0fa] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#eaf0fa] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a5aa8]"
          >
            <table className="w-full min-w-[1276px] border-separate border-spacing-0 bg-white">
              <colgroup>
                <col className="w-[44px] sm:w-[56px]" />
                <col className="w-[140px] sm:w-[180px]" />
                <col className="w-[90px]" />
                {kolom.map((label) => (
                  <col key={label} style={label === "Presentase Progress (%)" ? { width: 90 } : undefined} />
                ))}
              </colgroup>

              {/* SATU gradasi mengalir di seluruh baris judul, sama dengan header sidebar */}
              <thead style={{ background: GRAD_CARD }}>
                <tr>
                  <th rowSpan={2} className={`${th} bg-[#1b3f78]`}>
                    {NOMOR}
                  </th>
                  <th rowSpan={2} className={`${th} bg-[#1b3f78] text-left`}>
                    {NAMA_KETUA}
                  </th>
                  <th rowSpan={2} className={`${th} bg-[#1b3f78]`}>
                    Bulan
                  </th>
                  <th colSpan={kemajuan.length} className={`${th} uppercase`}>
                    Kemajuan Aktivitas / Kegiatan
                  </th>
                  <th colSpan={output.length} className={`${th} uppercase`}>
                    Output Presentase Progres
                  </th>
                </tr>
                <tr>
                  {kolom.map((label) => (
                    <th key={label} className={`${th} bg-white/10`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: jumlahBaris }).map((_, i) => {
                  const d = data[i];
                  return (
                    <tr
                      key={d ? `${d.bulan}-${i}` : `kosong-${i}`}
                      className={`h-[47px] transition-colors hover:bg-[#eaf0fa] [&:last-child>td]:border-b-0 ${
                        i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"
                      }`}
                    >
                      <Td>{d ? i + 1 : null}</Td>
                      <td className={`${td} bg-inherit text-left font-medium`}>{d?.ketua}</td>
                      <Td>{d?.bulan}</Td>
                      <Td kiri>{d?.aktivitas?.uraian}</Td>
                      <Td kiri>{d?.aktivitas?.kendala}</Td>
                      <Td kiri>{d?.aktivitas?.mitigasi}</Td>
                      <Td>{d && <DaftarLink links={d.aktivitas?.dataDukung} />}</Td>
                      <Td>{d?.output?.jenis}</Td>
                      <Td kiri>{d?.output?.judul}</Td>
                      <Td>{d?.output?.status}</Td>
                      <Td>{d ? `${d.output?.progres ?? 0}%` : null}</Td>
                      <Td>{d && <DaftarLink links={d.output?.dataDukung} />}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* bayangan tepi + tombol panah */}
          {bisaKanan && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-[#1b3f78]/15 to-transparent" />
              <TombolPanah arah="kanan" onClick={() => geser(1)} />
            </>
          )}
          {bisaKiri && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-6 bg-gradient-to-r from-[#1b3f78]/15 to-transparent" />
              <TombolPanah arah="kiri" onClick={() => geser(-1)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}