import { BarDefs, FALLBACK_COLOR, useUid } from "./chartutils";

export type Kategori = {
  key: string;
  label: string;
  from: string; // warna awal gradient
  to: string;   // warna akhir gradient
};

export type TargetChartData = {
  max: number;
  series: string[]; // urutan key kategori untuk tiap batang dalam satu grup
  groups: { target: number; realisasi: number }[][];
};

interface Props {
  data: TargetChartData;
  kategori: Kategori[];
}

/** Grafik batang: target (garis putus-putus) vs realisasi (batang gradasi) */
export default function TargetChart({ data, kategori }: Props) {
  const uid = useUid();
  const { max, series, groups } = data;

  const W = 420, H = 240, L = 40, R = 410, top = 52, base = 222;
  const y = (v: number) => base - (v / max) * (base - top);

  const barW = 17, gap = 1;
  const groupStep = (R - L) / Math.max(groups.length, 1);
  const groupW = series.length * barW + (series.length - 1) * gap;
  const ticks = [1, 2, 3].map((i) => Math.round((max * i) / 3));
  const colorOf = (key: string) => kategori.find((k) => k.key === key)?.from ?? FALLBACK_COLOR;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Target Kepala ORPA vs Realisasi">
      <BarDefs uid={uid} kategori={kategori} />

      {/* Legenda kanan atas */}
      <rect x="292" y="6" width="10" height="10" fill="none" stroke="#777" strokeDasharray="2 2" />
      <text x="306" y="14.5" fontSize="8.5" fill="#444">Target Kepala ORPA</text>
      <rect x="292" y="20" width="10" height="10" fill="none" stroke="#333" />
      <text x="306" y="28.5" fontSize="8.5" fill="#444">Realisasi</text>

      {/* Garis bantu */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={R} y1={y(v)} y2={y(v)} stroke="#e2e2e2" />
          <text x={L - 8} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#555" fontWeight="600">{v}</text>
        </g>
      ))}
      <line x1={L} x2={R} y1={base} y2={base} stroke="#555" />

      {groups.map((group, gi) =>
        group.map((b, bi) => {
          const key = series[bi];
          if (!key) return null; // jaga-jaga kalau data lebih panjang dari series
          const x = L + gi * groupStep + (groupStep - groupW) / 2 + bi * (barW + gap);
          return (
            <g key={`${gi}-${bi}`}>
              {b.target > 0 && (
                <rect
                  x={x}
                  y={y(b.target)}
                  width={barW}
                  height={base - y(b.target)}
                  fill="none"
                  stroke={colorOf(key)}
                  strokeDasharray="2 2"
                />
              )}
              {b.realisasi > 0 && (
                <>
                  <rect
                    x={x}
                    y={y(b.realisasi)}
                    width={barW}
                    height={base - y(b.realisasi)}
                    rx="1.5"
                    fill={`url(#${uid}-${key})`}
                  />
                  <text x={x + barW / 2} y={y(b.realisasi) - 3} fontSize="8" fontWeight="700" textAnchor="middle" fill="#333">
                    {b.realisasi}
                  </text>
                </>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}