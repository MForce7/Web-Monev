import { FALLBACK_COLOR, useUid } from "./chartutils";

export type Kategori = {
  key: string;
  label: string;
  from: string; // warna awal gradient
  to: string;   // warna akhir gradient
};

export type KomposisiItem = {
  kategori: string; // cocok dengan Kategori.key
  value: number;
};

interface Props {
  data: KomposisiItem[];
  kategori: Kategori[];
}

/** Grafik donat komposisi (dengan garis penunjuk label) */
export default function DonutChart({ data, kategori }: Props) {
  const uid = useUid();
  const cx = 210, cy = 125, R = 100, r = 50, mid = (R + r) / 2;
  const total = data.reduce((s, k) => s + k.value, 0);
  if (total <= 0) return null;

  const pt = (rad: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  };
  let angle = 0;

  return (
    <svg viewBox="0 0 420 250" className="w-full" role="img" aria-label="Komposisi Realisasi Capaian ORPA">
      <defs>
        {/* Gradien radial: pekat di lubang tengah, lembut di tepi luar */}
        {kategori.map((k) => (
          <radialGradient key={k.key} id={`${uid}-donut-${k.key}`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
            <stop offset={r / R} stopColor={k.from} />
            <stop offset="1" stopColor={k.to} />
          </radialGradient>
        ))}
      </defs>

      {data.map((item) => {
        const kat = kategori.find((k) => k.key === item.kategori);
        const sweep = Math.min((item.value / total) * 360, 359.99);
        const a0 = angle, a1 = angle + sweep;
        angle = a1;

        const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1);
        const [ix1, iy1] = pt(r, a1), [ix0, iy0] = pt(r, a0);
        const large = sweep > 180 ? 1 : 0;
        const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix0} ${iy0} Z`;

        const midAngle = (a0 + a1) / 2;
        const [dx, dy] = pt(mid, midAngle);
        const right = Math.sin((midAngle * Math.PI) / 180) >= 0; // setengah kanan / kiri
        const lineEnd = right ? cx + R + 30 : cx - R - 30;
        const textX = right ? lineEnd + 4 : lineEnd - 4;
        const persen = ((item.value / total) * 100).toFixed(1);

        return (
          <g key={item.kategori}>
            <path
              d={d}
              fill={kat ? `url(#${uid}-donut-${kat.key})` : FALLBACK_COLOR}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <circle cx={dx} cy={dy} r="2" fill="#444" />
            <line x1={dx} y1={dy} x2={lineEnd} y2={dy} stroke="#666" strokeWidth="0.8" />
            <text x={textX} y={dy - 1} fontSize="8.5" fontWeight="700" fill="#444" textAnchor={right ? "start" : "end"}>
              {kat?.label ?? item.kategori}
            </text>
            <text x={textX} y={dy + 9} fontSize="8.5" fill="#777" textAnchor={right ? "start" : "end"}>
              {persen}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}