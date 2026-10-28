import { useId } from "react";
import type { Kategori } from "../../../../types/orpaCharts.ts";

export const FALLBACK_COLOR = "#999999";

/** id unik per instance chart, supaya gradien tidak bentrok kalau dirender berkali-kali */
export function useUid() {
  return useId().replace(/:/g, "");
}

/** Gradien vertikal (atas -> bawah) untuk semua kategori */
export function BarDefs({ uid, kategori }: { uid: string; kategori: Kategori[] }) {
  return (
    <defs>
      {kategori.map((k) => (
        <linearGradient key={k.key} id={`${uid}-${k.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={k.from} />
          <stop offset="1" stopColor={k.to} />
        </linearGradient>
      ))}
    </defs>
  );
}

export const gradBg = (k: Pick<Kategori, "from" | "to">) =>
  `linear-gradient(135deg, ${k.from}, ${k.to})`;