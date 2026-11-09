import type { ReactNode } from "react";
import type { Validasi } from "./tipe";

export const WARNA_BADGE: Record<Validasi, string> = {
  Siap: "bg-[#dcfce7] text-[#166534]",
  Cek: "bg-[#fef3c7] text-[#92400e]",
  Kosong: "bg-[#fee2e2] text-[#991b1b]",
};

export default function Badge({ children, warna }: { children: ReactNode; warna: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${warna}`}>
      {children}
    </span>
  );
}
