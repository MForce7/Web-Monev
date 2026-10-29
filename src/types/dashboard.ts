// src/types/dashboard.ts
export type Triwulan = "I" | "II" | "III" | "IV";
export type KategoriKey = "publikasi" | "purwarupa" | "ki" | "model" | "paten" | "hakCipta";

export interface Kategori { key: KategoriKey; label: string; from: string; to: string }
export interface TargetRealisasi { target: number; realisasi: number }

export interface TriwulanData {
  metrics: {
    total: number;
    items: (TargetRealisasi & { key: string; title: string; color: string })[];
  };
  pusatRiset: {
    nama: string;
    nilai: Record<KategoriKey, number>;
    targetVsRealisasi: Partial<Record<KategoriKey, TargetRealisasi>>;
  }[];
  orpa: {
    chartMax: number;
    komposisi: { kategori: KategoriKey; value: number }[];
  };
}

export interface DashboardData {
  kategori: Kategori[];
  triwulan: Partial<Record<Triwulan, TriwulanData>>; // Partial: BE bisa belum punya data triwulan tertentu
}