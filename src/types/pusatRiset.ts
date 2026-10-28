import type { Kategori } from "./orpaCharts";

export type { Kategori };

/** Capaian satu pusat riset: nilai per kategori, dicari lewat key kategori */
export interface PusatRisetItem {
  nama: string;
  nilai: Record<string, number>;
}

export interface PusatRisetData {
  kategori: Kategori[]; // urutan kategori = urutan batang & legenda
  items: PusatRisetItem[];
}