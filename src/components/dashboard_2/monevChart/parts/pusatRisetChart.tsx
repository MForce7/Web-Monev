import { BarDefs, useUid } from "./chartutils";

export type Kategori = {
  key: string;
  label: string;
  from: string; // warna awal gradient
  to: string;   // warna akhir gradient
};

interface Props {
  nilai: Record<string, number>;
  kategori: Kategori[];
  max?: number; // kalau kosong dihitung otomatis dari data
}

/** Grafik batang sederhana untuk satu pusat riset (satu batang per kategori) */
export default function PusatRisetChart({ nilai, kategori, max }: Props) {
  const uid = useUid();

  const values = kategori.map((k) => nilai[k.key] ?? 0);
  const yMax = max ?? Math.max(10, Math.ceil(Math.max(...values) / 10) * 10);

  const W = 400, H = 200, L = 28, B = 6, T = 16;
  const plotH = H - B - T;
  const y = (v: number) => T + plotH - (v / yMax) * plotH;
  const slot = (W - L - 10) / Math.max(kategori.length, 1);
  const barW = 28;
  const ticks = [0, 1, 2, 3].map((i) => Math.round((yMax * i) / 3));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <BarDefs uid={uid} kategori={kategori} />

      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - 10} y1={y(v)} y2={y(v)} stroke="#e5e5e5" />
          <text x={L - 6} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#666">{v}</text>
        </g>
      ))}

      {kategori.map((k, i) => {
        const v = values[i];
        const x = L + i * slot + (slot - barW) / 2;
        return (
          <g key={k.key}>
            <rect x={x} y={y(v)} width={barW} height={y(0) - y(v)} rx="2" fill={`url(#${uid}-${k.key})`} />
            <text x={x + barW / 2} y={y(v) - 4} fontSize="9" textAnchor="middle" fill="#333">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}