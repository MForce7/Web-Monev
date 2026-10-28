/** Satu kategori: kunci, label, dan warna gradasi (from = atas/awal, to = bawah/akhir) */
export interface Kategori {
  key: string;
  label: string;
  from: string;
  to: string;
}

export interface BarValue {
  target: number;
  realisasi: number;
}

export interface TargetChartData {
  max: number; // nilai maksimum sumbu Y
  series: string[]; // urutan kategori di dalam tiap grup (key dari kategori)
  groups: BarValue[][]; // tiap grup berisi satu BarValue per series
}

export interface KomposisiItem {
  kategori: string; // key dari kategori
  value: number;
}

export interface OrpaChartsData {
  kategori: Kategori[];
  targetVsRealisasi: TargetChartData;
  komposisi: KomposisiItem[]; // urut searah jarum jam mulai jam 12
}