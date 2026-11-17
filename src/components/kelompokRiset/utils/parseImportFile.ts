import * as XLSX from "xlsx";

import type { PusatRiset } from "../types";

export const HEADER_WAJIB = [
  "NO",
  "NAMA KELOMPOK RISET",
  "NAMA PERISET",
  "NIP",
  "KETERANGAN",
  "JABATAN FUNGSIONAL",
  "PUSAT RISET",
] as const;

function normalisasiHeader(header: unknown): string {
  return String(header ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function normalisasiKeterangan(
  nilai: string,
): "Koordinator" | "Ketua" | "Anggota" {
  const v = nilai.trim().toLowerCase();

  if (v === "koordinator") return "Koordinator";
  if (v === "ketua") return "Ketua";

  return "Anggota";
}

export async function parseFileKelompokRiset(
  file: File,
): Promise<PusatRiset[]> {
  const ekstensi = file.name
    .slice(file.name.lastIndexOf("."))
    .toLowerCase();

  let workbook: XLSX.WorkBook;

  if (ekstensi === ".csv") {
    const teks = await file.text();
    workbook = XLSX.read(teks, { type: "string" });
  } else {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array" });
  }

  const namaSheet = workbook.SheetNames[0];

  if (!namaSheet) {
    throw new Error("File tidak memiliki sheet/data.");
  }

  const sheet = workbook.Sheets[namaSheet];

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length < 2) {
    throw new Error("File kosong atau tidak memiliki baris data.");
  }

  const headerBaris = rows[0].map(normalisasiHeader);

  const indexKolom = HEADER_WAJIB.map((h) => headerBaris.indexOf(h));

  const headerHilang = HEADER_WAJIB.filter(
    (_, i) => indexKolom[i] === -1,
  );

  if (headerHilang.length > 0) {
    throw new Error(
      `Header kolom tidak lengkap. Kolom yang tidak ditemukan: ${headerHilang.join(", ")}.`,
    );
  }

  const [
    ,
    idxKelompok,
    idxPeriset,
    idxNip,
    idxKeterangan,
    idxJabatan,
    idxPusat,
  ] = indexKolom;

  type EntriPusat = {
    urutanKelompok: string[];
    kelompokMap: Map<string, PusatRiset["kelompok"][number]>;
  };

  const pusatMap = new Map<string, EntriPusat>();
  const urutanPusat: string[] = [];

  // Forward-fill untuk sel kosong akibat merged cell di Excel.
  let pusatTerakhir = "";
  let kelompokTerakhir = "";

  for (let i = 1; i < rows.length; i++) {
    const baris = rows[i];

    const semuaKosong = baris.every(
      (cell) => !String(cell ?? "").trim(),
    );

    if (semuaKosong) continue;

    const namaPusatRaw = String(baris[idxPusat] ?? "").trim();
    const namaKelompokRaw = String(baris[idxKelompok] ?? "").trim();
    const namaPeriset = String(baris[idxPeriset] ?? "").trim();
    const nip = String(baris[idxNip] ?? "").trim();
    const keteranganRaw = String(baris[idxKeterangan] ?? "").trim();
    const jabatan = String(baris[idxJabatan] ?? "").trim();

    const namaPusat = namaPusatRaw || pusatTerakhir;
    const namaKelompok = namaKelompokRaw || kelompokTerakhir;

    if (!namaPusat) {
      throw new Error(`Baris ke-${i + 1}: Pusat Riset tidak ditemukan.`);
    }

    if (!namaKelompok) {
      throw new Error(
        `Baris ke-${i + 1}: Nama Kelompok Riset tidak ditemukan.`,
      );
    }

    if (!namaPeriset) continue;

    pusatTerakhir = namaPusat;
    kelompokTerakhir = namaKelompok;

    if (!pusatMap.has(namaPusat)) {
      pusatMap.set(namaPusat, { urutanKelompok: [], kelompokMap: new Map() });
      urutanPusat.push(namaPusat);
    }

    const entriPusat = pusatMap.get(namaPusat)!;

    if (!entriPusat.kelompokMap.has(namaKelompok)) {
      entriPusat.kelompokMap.set(namaKelompok, {
        nama: namaKelompok,
        anggota: [],
      });
      entriPusat.urutanKelompok.push(namaKelompok);
    }

    entriPusat.kelompokMap.get(namaKelompok)!.anggota.push({
      nama: namaPeriset,
      nip,
      keterangan: normalisasiKeterangan(keteranganRaw),
      jabatan,
    });
  }

  if (urutanPusat.length === 0) {
    throw new Error(
      "Tidak ada data periset yang berhasil dibaca dari file.",
    );
  }

  return urutanPusat.map((namaPusat) => {
    const entri = pusatMap.get(namaPusat)!;

    return {
      nama: namaPusat,
      kelompok: entri.urutanKelompok.map(
        (nama) => entri.kelompokMap.get(nama)!,
      ),
    };
  });
}