import type { StatusPantau } from "./types";
import type { Sel as SelEkspor, WarnaSel } from "../../../lib/eksporTabel.ts";

/* ---------- Tampilan status ---------- */
export const WARNA_STATUS: Record<StatusPantau, string> = {
  Lengkap: "bg-[#dcfce7] text-[#166534]",
  "Belum Lengkap": "bg-[#fef3c7] text-[#92400e]",
  Kosong: "bg-[#fee2e2] text-[#991b1b]",
};

// Warna status di file Excel (hex tanpa #), sama dengan warna di layar dan PDF
export const WARNA_XLSX: Record<string, WarnaSel> = {
  Lengkap: { isi: "DCFCE7", teks: "166534" },
  "Belum Lengkap": { isi: "FEF3C7", teks: "92400E" },
  Kosong: { isi: "FEE2E2", teks: "991B1B" },
};

export const warnaStatus = (nilai: SelEkspor) => (typeof nilai === "string" ? WARNA_XLSX[nilai] : undefined);