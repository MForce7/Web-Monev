import * as XLSX from "xlsx";

import type {
  RekapPendanaanRecord,
  SkemaPendanaan,
} from "./supabaseRekapPendanaan";

export type RekapPendanaanInput = Omit<RekapPendanaanRecord, "id">;

const NAMA_SHEET = "Rekap Pendanaan";
const HEADER_DANA = /^dana tahun (\d+) \(rp\)$/;
const HEADER_WAJIB = ["skema", "ketua periset", "judul", "pusat riset"];

const kecil = (teks: unknown) =>
  String(teks ?? "").trim().toLowerCase().replace(/\s+/g, " ");

function nilai(row: unknown[], indeks: number | undefined): string {
  return indeks === undefined ? "" : String(row[indeks] ?? "").trim();
}

function angkaOpsional(teks: string, label: string, baris: number): number | null {
  if (!teks) return null;

  if (teks.includes("-") || (/^\s*\(.*\)\s*$/.test(teks))) {
    throw new Error(`Baris ${baris}: nilai ${label} tidak boleh negatif.`);
  }

  const digits = teks.replace(/\D/g, "");
  const number = Number(digits);

  if (!digits || !Number.isSafeInteger(number)) {
    throw new Error(`Baris ${baris}: nilai ${label} bukan angka yang valid.`);
  }

  return number;
}

function parseSkema(teks: string, baris: number): SkemaPendanaan {
  const skema = teks.trim().toUpperCase();

  if (skema !== "PRIS" && skema !== "RIIM") {
    throw new Error(`Baris ${baris}: Skema harus PRIS atau RIIM.`);
  }

  return skema;
}

export async function parseFileRekapPendanaan(
  file: File,
): Promise<RekapPendanaanInput[]> {
  const ekstensi = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  let workbook: XLSX.WorkBook;

  if (ekstensi === ".csv") {
    workbook = XLSX.read(await file.text(), { type: "string" });
  } else if (ekstensi === ".xlsx" || ekstensi === ".xls") {
    workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  } else {
    throw new Error("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv.");
  }

  const namaSheet = workbook.SheetNames[0];
  if (!namaSheet) throw new Error("File tidak memiliki sheet/data.");

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[namaSheet], {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length < 2) {
    throw new Error("File tidak memiliki baris data.");
  }

  const headers = rows[0].map(kecil);
  const indeks = new Map<string, number>();

  headers.forEach((header, index) => {
    if (header && !indeks.has(header)) indeks.set(header, index);
  });

  const headerHilang = HEADER_WAJIB.filter((header) => !indeks.has(header));
  if (headerHilang.length > 0) {
    throw new Error(`Header wajib tidak ditemukan: ${headerHilang.join(", ")}.`);
  }

  const indeksDana = headers
    .map((header, index) => {
      const cocok = HEADER_DANA.exec(header);
      if (!cocok) return null;

      const tahun = Number(cocok[1]);
      if (!Number.isInteger(tahun) || tahun < 1 || tahun > 100) {
        throw new Error(`Nomor kolom dana tahun '${cocok[1]}' tidak valid.`);
      }

      return { tahun, index };
    })
    .filter((item): item is { tahun: number; index: number } => item !== null)
    .sort((a, b) => a.tahun - b.tahun);

  if (
    new Set(indeksDana.map((item) => item.tahun)).size !== indeksDana.length
  ) {
    throw new Error("Header Dana Tahun tidak boleh duplikat.");
  }

  const hasil: RekapPendanaanInput[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    if (row.every((cell) => !String(cell ?? "").trim())) continue;

    const noBaris = i + 1;
    const ketua = nilai(row, indeks.get("ketua periset"));
    const judul = nilai(row, indeks.get("judul"));
    const pusatRiset = nilai(row, indeks.get("pusat riset"));

    if (!ketua || !judul || !pusatRiset) {
      throw new Error(
        `Baris ${noBaris}: Ketua Periset, Judul, dan Pusat Riset wajib diisi.`,
      );
    }

    const jangkaTeks = nilai(row, indeks.get("jangka (bln)"));
    const jangkaBulan = angkaOpsional(jangkaTeks, "Jangka (Bln)", noBaris);
    const jumlahTahun = Math.max(3, ...indeksDana.map((item) => item.tahun));
    const dana: (number | null)[] = Array.from(
      { length: jumlahTahun },
      () => null,
    );

    indeksDana.forEach(({ tahun, index }) => {
      dana[tahun - 1] = angkaOpsional(
        nilai(row, index),
        `Dana Tahun ${tahun}`,
        noBaris,
      );
    });

    hasil.push({
      skema: parseSkema(nilai(row, indeks.get("skema")), noBaris),
      jenis: nilai(row, indeks.get("jenis / gelombang")),
      ketua,
      judul,
      pusatRiset,
      jangkaBulan,
      dana,
      nomorSK: nilai(row, indeks.get("nomor sk")),
      tanggalSK: nilai(row, indeks.get("tanggal sk")),
      status: nilai(row, indeks.get("status")),
      keterangan: nilai(row, indeks.get("keterangan")),
      link: nilai(row, indeks.get("tautan folder / dokumen")),
      linkLabel: nilai(row, indeks.get("nama tautan")),
    });
  }

  if (hasil.length === 0) {
    throw new Error("Tidak ada baris rekap pendanaan yang dapat diimpor.");
  }

  return hasil;
}

export function unduhTemplateRekapPendanaan(): void {
  const headers = [
    "Skema",
    "Jenis / Gelombang",
    "Ketua Periset",
    "Judul",
    "Pusat Riset",
    "Jangka (Bln)",
    "Dana Tahun 1 (Rp)",
    "Dana Tahun 2 (Rp)",
    "Dana Tahun 3 (Rp)",
    "Nomor SK",
    "Tanggal SK",
    "Status",
    "Keterangan",
    "Tautan Folder / Dokumen",
    "Nama Tautan",
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([headers]);
  sheet["!cols"] = headers.map((header) => ({
    wch: Math.min(42, Math.max(18, header.length + 4)),
  }));
  XLSX.utils.book_append_sheet(workbook, sheet, NAMA_SHEET);
  XLSX.writeFile(workbook, "template-rekap-pendanaan.xlsx");
}
