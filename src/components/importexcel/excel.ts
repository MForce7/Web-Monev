import * as XLSX from "xlsx";
import { BULAN, KODE_PUSAT } from "./konstanta.ts";
import type { HasilBaca, Isian, Kolom, Tautan } from "./tipe.ts";

// Teks sel dengan baris baru dipertahankan, spasi berlebih dirapikan
const bersih = (v: unknown) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

// Untuk mencocokkan judul kolom: huruf kecil, satu spasi
const kunci = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();

// Seluruh sheet jadi array 2 dimensi; link yang disembunyikan di balik teks ikut dibawa
function sheetKeGrid(ws: XLSX.WorkSheet): string[][] {
  const ref = ws["!ref"];
  if (!ref) return [];
  const r = XLSX.utils.decode_range(ref);
  const grid: string[][] = [];
  for (let R = r.s.r; R <= r.e.r; R++) {
    const row: string[] = [];
    for (let C = r.s.c; C <= r.e.c; C++) {
      const sel = ws[XLSX.utils.encode_cell({ r: R, c: C })] as XLSX.CellObject | undefined;
      let t = sel ? bersih(sel.w ?? sel.v) : "";
      const link = sel?.l?.Target;
      if (link && !t.includes(link)) t = t ? `${t}\n${link}` : link;
      row.push(t);
    }
    grid.push(row);
  }
  return grid;
}

// Pola judul kolom di Excel (judul bisa ada di 1 atau 2 baris header)
const POLA: [Kolom, RegExp][] = [
  ["no", /^no\.?$/],
  ["ketua", /^nama ketua/],
  ["judulAktivitas", /^judul aktivitas/],
  ["target", /^target output/],
  ["statusPelaksanaan", /^status pelaksanaan/],
  ["persenPelaksanaan", /^persentase progres/],
  ["uraian", /^uraian kemajuan/],
  ["kendala", /^kendala/],
  ["mitigasi", /^mitigasi/],
  ["dataDukungAktivitas", /^data dukung progres aktivitas/],
  ["jenisOutput", /^jenis output/],
  ["judulOutput", /^judul output/],
  ["statusOutput", /^status$/],
  ["progresOutput", /^progres capaian$/],
  ["dataDukungOutput", /^data dukung progres output/],
];

const ambilLink = (t: string): Tautan[] =>
  (t.match(/https?:\/\/[^\s)]+/g) ?? []).map((url, i) => ({ label: `Tautan ${i + 1}`, url }));

// "50%", "0,5", 0.5, "75% ,2. 45%" -> angka 0-100 (ambil angka pertama)
function kePersen(t: string): number | null {
  const m = t.match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(",", "."));
  return t.includes("%") || n > 1 ? Math.min(100, Math.round(n)) : Math.round(n * 100);
}

function kodePusat(nama: string): string {
  const hit = KODE_PUSAT.find(([re]) => re.test(nama));
  if (hit) return hit[1];
  // cadangan: inisial kata setelah "PUSAT RISET", mis. "PUSAT RISET FOTONIKA" -> "PRF"
  const kata = nama.replace(/^pusat riset/i, "").trim().split(/\s+/).filter(Boolean);
  return "PR" + kata.map((k) => k[0]?.toUpperCase() ?? "").join("");
}

// Bulan dari tulisan "Laporan Bulan: September" (di baris-baris atas header)
function cariBulan(baris: string[][]): string | null {
  for (const row of baris) {
    for (let ci = 0; ci < row.length; ci++) {
      const m = row[ci].match(/laporan bulan\s*:?\s*(\S*)/i);
      if (!m) continue;
      const calon = m[1] || row.slice(ci + 1).find(Boolean) || "";
      const ketemu = BULAN.find((b) => b.toLowerCase() === calon.toLowerCase());
      if (ketemu) return ketemu;
    }
  }
  return null;
}

// Kolom wajib yang sama dengan pemeriksa di tabel Pemantauan
function periksa(r: Omit<Isian, "validasi" | "belumSesuai">): Pick<Isian, "validasi" | "belumSesuai"> {
  const isian: [string, boolean][] = [
    ["Uraian Kemajuan Aktivitas", !!r.uraian],
    ["Kendala Ditemui", !!r.kendala],
    ["Mitigasi / Rencana Tindak Lanjut", !!r.mitigasi],
    ["Data Dukung Progres", r.dataDukungAktivitas.length > 0],
    ["Jenis Output", !!r.jenisOutput],
    ["Judul Output", !!r.judulOutput],
    ["Status", !!r.statusOutput],
    ["Presentase Progress (%)", r.progresOutput !== null],
    ["Output Data Dukung", r.dataDukungOutput.length > 0],
  ];
  const kosong = isian.filter(([, ada]) => !ada).map(([k]) => k);
  if (kosong.length === isian.length) return { validasi: "Kosong", belumSesuai: ["Semua kolom kosong"] };
  return kosong.length ? { validasi: "Cek", belumSesuai: kosong } : { validasi: "Siap", belumSesuai: [] };
}

export async function bacaExcel(file: File): Promise<HasilBaca> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });

  for (const nama of wb.SheetNames) {
    const grid = sheetKeGrid(wb.Sheets[nama]);
    const hr = grid.findIndex((row) => row.some((c) => /^nama ketua/.test(kunci(c))));
    if (hr < 0) continue; // bukan sheet laporan, coba sheet berikutnya

    // Peta kolom dari 1-2 baris header
    const peta: Partial<Record<Kolom, number>> = {};
    let barisHeaderTerakhir = hr;
    for (let rr = hr; rr <= hr + 1 && rr < grid.length; rr++) {
      grid[rr].forEach((c, ci) => {
        const k = kunci(c);
        POLA.forEach(([kol, re]) => {
          if (peta[kol] === undefined && re.test(k)) {
            peta[kol] = ci;
            barisHeaderTerakhir = Math.max(barisHeaderTerakhir, rr);
          }
        });
      });
    }
    const ambil = (row: string[], kol: Kolom) => (peta[kol] === undefined ? "" : row[peta[kol]!] ?? "");

    const bulan = cariBulan(grid.slice(0, hr));

    // Baris data: baris pita "PUSAT RISET ..." mengganti pusat riset aktif
    const rows: Isian[] = [];
    let pusat = "";
    for (const row of grid.slice(barisHeaderTerakhir + 1)) {
      const pertama = row.find(Boolean) ?? "";
      if (!pertama) continue;
      const ketua = ambil(row, "ketua");
      if (/^pusat riset/i.test(pertama) && !ketua) {
        pusat = pertama;
        continue;
      }
      if (!ketua) continue;

      const dasar = {
        id: rows.length,
        pusat,
        kode: kodePusat(pusat),
        no: ambil(row, "no"),
        ketua,
        judulAktivitas: ambil(row, "judulAktivitas"),
        target: ambil(row, "target"),
        statusPelaksanaan: ambil(row, "statusPelaksanaan"),
        persenPelaksanaan: ambil(row, "persenPelaksanaan"),
        uraian: ambil(row, "uraian"),
        kendala: ambil(row, "kendala"),
        mitigasi: ambil(row, "mitigasi"),
        dataDukungAktivitas: ambilLink(ambil(row, "dataDukungAktivitas")),
        jenisOutput: ambil(row, "jenisOutput"),
        judulOutput: ambil(row, "judulOutput"),
        statusOutput: ambil(row, "statusOutput"),
        progresOutput: kePersen(ambil(row, "progresOutput")),
        dataDukungOutput: ambilLink(ambil(row, "dataDukungOutput")),
      };
      rows.push({ ...dasar, ...periksa(dasar) });
    }

    if (rows.length === 0) throw new Error("Header ditemukan, tapi belum ada baris data di bawahnya.");

    // Bentuk HasilBaca per bulan; bila bulan tidak terbaca, nama sheet dipakai sebagai kunci
    const kunciBulan = bulan ?? nama;
    return { sheet: nama, bulanDefault: kunciBulan, bulanAda: [kunciBulan], perBulan: { [kunciBulan]: rows } };
  }

  throw new Error("Kolom 'Nama Ketua Tim' tidak ditemukan. Pastikan file memakai template laporan bulanan.");
}

export function unduhTemplate() {
  const header = [
    "No", "Nama Ketua Tim", "Unit Kerja (Pusat Riset/Direktorat)", "Satuan Kerja (Organisasi Riset/Deputi)",
    "Judul Aktivitas", "Target Output", "Status Pelaksanaan", "Persentase Progres Pelaksanaan",
    "Uraian Kemajuan Aktivitas", "Kendala Yang Ditemui Dalam Pelaksanaan",
    "Mitigasi/Rencana Tindak Lanjut Atas Permasalahan", "Data Dukung Progres Aktivitas",
    "Jenis Output", "Judul Output", "Status", "Progres Capaian", "Data Dukung Progres Output",
  ];
  const ws = XLSX.utils.aoa_to_sheet([
    ["Laporan progres aktivitas dan output"],
    [`Laporan Bulan: ${BULAN[new Date().getMonth()]}`],
    [],
    header,
    ["PUSAT RISET ANTARIKSA"],
    [1, "Nama Ketua Tim, gelar"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Aktivitas Bulan");
  XLSX.writeFile(wb, "Template-Logbook-Bulanan.xlsx");
}

// Bentuk yang sama dengan "logbook" di rekapOutput.json: menu -> pusat riset -> baris
export function bentukLogbook(menu: string, bulan: string, data: Isian[]) {
  const logbook: Record<string, Record<string, object[]>> = {};
  data.forEach((d) => {
    ((logbook[menu] ||= {})[d.kode] ||= []).push({
      bulan,
      ketua: d.ketua,
      aktivitas: { uraian: d.uraian, kendala: d.kendala, mitigasi: d.mitigasi, dataDukung: d.dataDukungAktivitas },
      output: {
        jenis: d.jenisOutput,
        judul: d.judulOutput,
        status: d.statusOutput,
        progres: d.progresOutput ?? 0,
        dataDukung: d.dataDukungOutput,
      },
      // field tambahan dari Excel (belum ada di rekapOutput.json)
      judulAktivitas: d.judulAktivitas,
      targetOutput: d.target,
      statusPelaksanaan: d.statusPelaksanaan,
      persenPelaksanaan: d.persenPelaksanaan,
    });
  });
  return { logbook };
}