export const GRAD = "linear-gradient(90deg,#1b3f78,#2a5aa8)";
export const MENU = ["CFC", "RIIM", "PRIS"];
export const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export const SEMUA = "Semua Pusat Riset";

// Nama pusat riset di Excel -> kode yang dipakai di rekapOutput.json (sesuaikan kalau beda)
export const KODE_PUSAT: [RegExp, string][] = [
  [/antariksa/i, "PRA"],
  [/penerbangan/i, "PRTP"],
  [/roket/i, "PRTR"],
  [/satelit/i, "PRTS"],
];