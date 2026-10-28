mport type { ReactNode } from "react";

/* ---------- Data contoh (nanti ganti dengan data dari API) ---------- */
export const navLinks = [
  { label: "Dashboard", href: "#", active: true },
  { label: "Login", href: "#", active: false },
  { label: "Logbook", href: "#", active: false },
];

export const sidebarMenu = ["CFC", "RIIM", "PRIS"];
export const sidebarOutput = ["Purwarupa", "Model", "Publikasi", "KI", "Paten", "Hak Cipta"];

export const bulanOpsi = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export const pusatRisetOpsi = ["PRA", "PRTS", "PRTR", "PRTP"];

export type Kolom = { key: string; label: string; className?: string };

export const columns: Kolom[] = [];
export const rows: Record<string, ReactNode>[] = [];
export const JUMLAH_BARIS_KOSONG = 7;