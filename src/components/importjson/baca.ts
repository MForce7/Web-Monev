import * as XLSX from "xlsx";
import type { HasilBaca, Isian, Tautan } from "./tipe.ts";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const STATUS = ["Perencanaan", "Persiapan", "Pelaksanaan", "Selesai", "Dimanfaatkan"];

const teks = (v: unknown) => String(v ?? "").trim();
const norm = (v: unknown) => teks(v).toLowerCase().replace(/\s+/g, " ");
const isi = (v: string) => v !== "" && v !== "-";

const namaBulan = (s: string) => {
  const t = s.trim().toLowerCase();
  if (t.startsWith("nop")) return "November"; // "Nopember" di file
  return BULAN.find((b) => b.toLowerCase() === t);
};

/** "Pusat Riset Teknologi Roket" -> "PRTR" */
const kodeDari = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .map((k) => k[0])
    .join("")
    .toUpperCase();

/** 0.1 -> 10, 70 -> 70, "40 %" -> 40, teks bebas -> null */
function persen(v: unknown): number | null {
  let n: number;
  if (typeof v === "number") n = v;
  else {
    const t = teks(v).replace("%", "").replace(",", ".").trim();
    if (!/^\d+(\.\d+)?$/.test(t)) return null;
    n = parseFloat(t);
  }
  if (n <= 1) n *= 100;
  return n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : null;
}

/** Ambil semua URL dari sel, teks biasa tanpa URL diabaikan */
function tautan(s: string): Tautan[] {
  return (s.match(/https?:\/\/[^\s;,]+/gi) ?? []).map((url) => {
    let label = url;
    try {
      label = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* pakai url apa adanya */
    }
    return { label, url };
  });
}

function bacaSheet(ws: XLSX.WorkSheet, idAwal: number): Isian[] {
  const m = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: true });
  const hr = m.findIndex((r) => r.some((c) => norm(c) === "nama ketua tim"));
  if (hr < 0) return [];

  const h = m[hr].map(norm);
  const kol = (f: (s: string) => boolean) => h.findIndex(f);
  const c = {
    no: kol((s) => s === "no"),
    ketua: kol((s) => s === "nama ketua tim"),
    unit: kol((s) => s.startsWith("unit kerja")),
    judul: kol((s) => s === "judul aktivitas"),
    target: kol((s) => s === "target output"),
    status: kol((s) => s === "status pelaksanaan"),
    persen: kol((s) => s.startsWith("persentase")),
    uraian: kol((s) => s.startsWith("uraian")),
    kendala: kol((s) => s.startsWith("kendala")),
    mitigasi: kol((s) => s.startsWith("mitigasi")),
    dd: kol((s) => s.startsWith("data dukung progres aktivitas")),
    jenis: kol((s) => s === "jenis output"),
    judulOut: kol((s) => s === "judul output"),
    statusOut: kol((s) => s === "status"),
    progOut: kol((s) => s.startsWith("progres capaian")),
    ddOut: kol((s) => s.startsWith("data dukung progres output")),
  };
  const ambil = (r: unknown[], i: number) => (i < 0 ? "" : teks(r[i]));

  const hasil: Isian[] = [];
  let pusatSeksi = "";

  for (const r of m.slice(hr + 1)) {
    const ketua = ambil(r, c.ketua);
    if (!ketua) {
      // baris judul seksi, mis. "PUSAT RISET ANTARIKSA"
      const judulSeksi = teks(r[0]);
      if (judulSeksi && Number.isNaN(Number(judulSeksi))) pusatSeksi = judulSeksi.toUpperCase();
      continue;
    }

    const pusat = (ambil(r, c.unit) || pusatSeksi).toUpperCase();
    const status = ambil(r, c.status);
    const mentahPersen = ambil(r, c.persen);
    const nilaiPersen = c.persen < 0 ? null : persen(r[c.persen]);
    const mentahOut = ambil(r, c.progOut);
    const nilaiOut = c.progOut < 0 ? null : persen(r[c.progOut]);

    const d: Isian = {
      id: idAwal + hasil.length,
      pusat,
      kode: kodeDari(pusat.replace(/^PUSAT RISET\s*/, "PUSAT RISET ")),
      no: ambil(r, c.no).replace(/\.0+$/, ""),
      ketua,
      judulAktivitas: ambil(r, c.judul),
      target: ambil(r, c.target),
      statusPelaksanaan: status,
      persenPelaksanaan: nilaiPersen !== null ? `${nilaiPersen}%` : mentahPersen,
      uraian: ambil(r, c.uraian),
      kendala: ambil(r, c.kendala),
      mitigasi: ambil(r, c.mitigasi),
      dataDukungAktivitas: tautan(ambil(r, c.dd)),
      jenisOutput: ambil(r, c.jenis),
      judulOutput: ambil(r, c.judulOut),
      statusOutput: ambil(r, c.statusOut),
      progresOutput: nilaiOut,
      dataDukungOutput: tautan(ambil(r, c.ddOut)),
      validasi: "Kosong",
      belumSesuai: [],
    };

    // Kosong = belum ada isian progres sama sekali (status yang terisi otomatis tidak dihitung)
    const adaIsi = [mentahPersen, d.uraian, d.kendala, d.mitigasi, ambil(r, c.dd), d.jenisOutput, d.judulOutput, d.statusOutput, mentahOut, ambil(r, c.ddOut)].some(isi);
    if (adaIsi) {
      const masalah: string[] = [];
      if (!d.judulAktivitas) masalah.push("Judul Aktivitas");

      const statusValid = STATUS.find((s) => s.toLowerCase() === status.toLowerCase());
      if (statusValid) d.statusPelaksanaan = statusValid;
      else masalah.push("Status Pelaksanaan");

      if (nilaiPersen === null) masalah.push("Persentase Progres");
      if (isi(mentahOut) && nilaiOut === null) masalah.push("Progres Capaian");

      d.belumSesuai = masalah;
      d.validasi = masalah.length ? "Cek" : "Siap";
    }
    hasil.push(d);
  }
  return hasil;
}

export async function bacaExcel(file: File): Promise<HasilBaca> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const perBulan: Record<string, Isian[]> = {};
  let id = 1;

  for (const nama of wb.SheetNames) {
    const mm = nama.match(/^aktivitas\s+bulan\s+(.+)$/i);
    const bulan = mm && namaBulan(mm[1]);
    if (!bulan) continue;
    const rows = bacaSheet(wb.Sheets[nama], id);
    if (rows.length) {
      perBulan[bulan] = rows;
      id += rows.length;
    }
  }

  const bulanAda = BULAN.filter((b) => perBulan[b]);
  if (!bulanAda.length) {
    throw new Error('Tidak ada sheet "Aktivitas Bulan ..." di file ini. Pastikan memakai template laporan bulanan.');
  }

  // bulan default = bulan terakhir yang sudah ada isiannya
  const berisi = bulanAda.filter((b) => perBulan[b].some((r) => r.validasi !== "Kosong"));
  const bulanDefault = (berisi.length ? berisi : bulanAda).slice(-1)[0];

  return { sheet: `Aktivitas Bulan ${bulanDefault}`, bulanDefault, bulanAda, perBulan };
}

/** Bentuk payload untuk dikirim ke API / database logbook */
export function bentukLogbook(bulan: string, rows: Isian[]) {
  return {
    bulan,
    kegiatan: rows.map(({ id, validasi, belumSesuai, ...sisa }) => sisa),
  };
}