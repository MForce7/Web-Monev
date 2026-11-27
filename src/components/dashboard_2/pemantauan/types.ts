/* ---------- Tipe data ---------- */
export type StatusPantau = "Lengkap" | "Belum Lengkap" | "Kosong";

export type Sel = { status?: StatusPantau; belumSesuai?: string[] | string | number };

export type BarisPantau = {
  id: string | number;
  nama: string;
  judul?: string;
  pusatRiset?: string;
  bulan?: Record<string, Sel>; // mis. { Januari: { status: "Lengkap" } }
};

export const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const daftar = (v?: string[] | string | number): string[] =>
  Array.isArray(v) ? v : v === undefined || v === "" ? [] : [String(v)];