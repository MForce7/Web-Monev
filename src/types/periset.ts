export type KeteranganPeran = string; // "Koordinator" | "Ketua" | "Anggota", tapi dibiarkan bebas karena data asli variatif

export interface Periset {
  nama: string;
  nip: string;
  keterangan: KeteranganPeran;
  jabatan: string;
}

export interface Kelompok {
  nama: string;
  anggota: Periset[];
}

export interface PusatRiset {
  nama: string;
  kelompok: Kelompok[];
}

/** Referensi posisi satu periset di dalam struktur data (dipakai untuk edit/kick) */
export interface PerisetRef {
  pi: number; // index pusat riset
  ki: number; // index kelompok
  ai: number; // index anggota
}