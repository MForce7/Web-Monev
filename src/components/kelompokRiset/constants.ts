import raw from "../../data/kelompokriset.json";

import type { PusatRiset } from "./types";

const DATA_PUSAT = (
  raw as { pusatRiset: PusatRiset[] }
).pusatRiset;

export const SEMUA = "Semua Pusat Riset";

export const STORAGE_KEY = "kelompok-riset-orpa-2026";

export const GRAD_BIRU =
  "linear-gradient(90deg, #1c3d85 0%, #2a58a5 100%)";

export const GRAD_BIRU_TUA =
  "linear-gradient(90deg, #14306b 0%, #1f468c 100%)";

export const KOLOM = [
  "No",
  "Nama Kelompok Riset",
  "Nama Periset",
  "NIP",
  "Keterangan",
  "Jabatan Fungsional",
];

export const WIDTHS = [5, 20, 25, 15, 10, 25];

export const OPSI_PUSAT = [
  SEMUA,
  ...DATA_PUSAT.map((p) => p.nama),
];

export const LEBAR_DROPDOWN = {
  width: `calc(${
    Math.max(...OPSI_PUSAT.map((o) => o.length))
  }ch + 4.75rem)`,
};

export const LENCANA = {
  pimpinan:
    "bg-[#e8effb] text-[#1b3560] border-[#c3d3ee]",
  anggota:
    "bg-slate-100 text-[#1b3560] border-slate-200",
};

export const lencana = (keterangan: string) =>
  keterangan === "Anggota"
    ? LENCANA.anggota
    : LENCANA.pimpinan;

export const TD_CLASS =
  "px-3 py-2 border-r border-b border-slate-200 align-top break-words text-xs font-normal leading-snug text-[#1b3560]";

export const WRAP = "break-words whitespace-normal";