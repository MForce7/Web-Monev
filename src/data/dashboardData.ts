export type Periode = "III" | "IV";

export type Stat = {
  label: string;
  color: string;
  target: number;
  realisasi: number;
};

export type Kepatuhan = { kode: string; persen: number };

/* ---------- DATA (ganti dengan data dari logbook / API) ---------- */
export const STATS: Stat[] = [
  { label: "Ketua Tim", color: "text-[#ffb322]", target: 56, realisasi: 56 },
  { label: "Publikasi", color: "text-[#f85a5a]", target: 66, realisasi: 66 },
  { label: "Purwarupa", color: "text-[#4195ff]", target: 33, realisasi: 33 },
  { label: "KI", color: "text-[#5b21cd]", target: 40, realisasi: 40 },
];

export const KEPATUHAN_TERTINGGI: Kepatuhan[] = [
  { kode: "PRTR", persen: 90 },
  { kode: "PRTS", persen: 80 },
  { kode: "PRA", persen: 70 },
  { kode: "PRTP", persen: 60 },
];

// CONTOH: ganti dengan data asli (urut dari yang paling rendah)
export const KEPATUHAN_TERENDAH: Kepatuhan[] = [
  { kode: "PRXA", persen: 20 },
  { kode: "PRXB", persen: 30 },
  { kode: "PRXC", persen: 40 },
  { kode: "PRXD", persen: 50 },
];

export const PERINGKAT_TERTINGGI: string[] = [
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Dini Dwirahayu,S.Si",
];

// CONTOH: ganti dengan data asli (urut dari yang paling rendah)
export const PERINGKAT_TERENDAH: string[] = Array.from(
  { length: 10 },
  (_, i) => `Nama Periset ${i + 1},S.Si`
);

export const LEADERBOARD = [
  {
    judul: "Peringkat Kepatuhan Logbook Tertinggi",
    kepatuhan: KEPATUHAN_TERTINGGI,
    peringkat: PERINGKAT_TERTINGGI,
  },
  {
    judul: "Peringkat Kepatuhan Logbook Terendah",
    kepatuhan: KEPATUHAN_TERENDAH,
    peringkat: PERINGKAT_TERENDAH,
  },
] as const;