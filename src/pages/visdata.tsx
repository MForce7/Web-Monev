import { useId, useState, type ReactNode } from "react";

/* ---------- Warna (perkiraan dari Figma, ganti kalau perlu) ---------- */
const RED = "#e8202f";
const C = {
  publikasi: "#f25c5c",
  purwarupa: "#4a9dff",
  ki: "#5b21d6",
  model: "#ffb020",
  paten: "#b8f5c8",
  hakCipta: "#9e9a9a",
};

/* ---------- Gradasi per kategori: [atas/awal, bawah/akhir] ---------- */
const GRAD = {
  publikasi: ["#f25c5c", "#ffb5b5"],
  purwarupa: ["#4a9dff", "#b5d8ff"],
  ki: ["#5b21d6", "#b39cff"],
  model: ["#ffb020", "#ffe0a3"],
  paten: ["#6fdc8f", "#d6fbe1"],
  hakCipta: ["#7d7979", "#d2cfcf"],
} as const;
type GradKey = keyof typeof GRAD;

/* ---------- Data contoh (nanti ganti dengan data dari API) ---------- */
type Triwulan = "III" | "IV";

const summaryData: Record<
  Triwulan,
  { ketuaTim: number; publikasi: [number, number]; purwarupa: [number, number]; ki: [number, number] }
> = {
  III: { ketuaTim: 56, publikasi: [66, 70], purwarupa: [33, 33], ki: [40, 40] },
  IV: { ketuaTim: 56, publikasi: [66, 70], purwarupa: [33, 33], ki: [40, 40] },
};

// Target (garis putus-putus) vs realisasi (batang gradasi). Tiap grup = Publikasi, Purwarupa, KI
const targetVsRealisasi: { t: number; r: number }[][] = [
  [{ t: 30, r: 21 }, { t: 2, r: 0 }, { t: 5, r: 5 }],
  [{ t: 24, r: 14 }, { t: 7, r: 7 }, { t: 12, r: 7 }],
  [{ t: 23, r: 9 }, { t: 0, r: 0 }, { t: 5, r: 1 }],
  [{ t: 26, r: 18 }, { t: 10, r: 2 }, { t: 18, r: 9 }],
];

// Urutan searah jarum jam mulai dari jam 12 (sesuai desain)
const komposisi = [
  { label: "Purwarupa", value: 9.7, grad: "purwarupa" as GradKey, side: "right" as const, lineEnd: 296 },
  { label: "Publikasi", value: 66.7, grad: "publikasi" as GradKey, side: "right" as const, lineEnd: 300 },
  { label: "KI", value: 23.7, grad: "ki" as GradKey, side: "left" as const, lineEnd: 86 },
];

const pusatRiset = [
  { nama: "PRA", data: [7, 14, 7, 21, 5, 9] },
  { nama: "PRTR", data: [7, 14, 7, 21, 5, 9] },
  { nama: "PRTS", data: [7, 14, 7, 21, 5, 9] },
  { nama: "PRTP", data: [7, 14, 7, 21, 5, 9] },
];
const kategori: { label: string; key: GradKey }[] = [
  { label: "Publikasi", key: "publikasi" },
  { label: "Purwarupa", key: "purwarupa" },
  { label: "KI", key: "ki" },
  { label: "Model", key: "model" },
  { label: "Paten", key: "paten" },
  { label: "Hak Cipta", key: "hakCipta" },
];
const kategoriTiga = kategori.slice(0, 3);

const kepatuhan = [
  { nama: "PRTR", persen: 70, gradient: "from-[#ffb020] to-[#ffd98a]" },
  { nama: "PRA", persen: 50, gradient: "from-[#5b21d6] to-[#a07dff]" },
  { nama: "PRTP", persen: 80, gradient: "from-[#f25c5c] to-[#ff9a9a]" },
  { nama: "PRTS", persen: 40, gradient: "from-[#6fdc8f] to-[#d6fbe1]" },
];

const peringkat = [
  "Dr. Sayid Mahmud,M.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Dini Dwirahayu,S.Si",
];
const crownColors = ["#ffb020", "#c9c9cd", "#ffd98a"];

/* ---------- Helper gradasi ---------- */

// id unik per instance chart, supaya gradien tidak bentrok kalau chart dirender berkali-kali
function useUid() {
  return useId().replace(/:/g, "");
}

/** Definisi gradien vertikal (atas -> bawah) untuk semua kategori */
function BarDefs({ uid }: { uid: string }) {
  return (
    <defs>
      {(Object.keys(GRAD) as GradKey[]).map((k) => (
        <linearGradient key={k} id={`${uid}-${k}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GRAD[k][0]} />
          <stop offset="1" stopColor={GRAD[k][1]} />
        </linearGradient>
      ))}
    </defs>
  );
}

const gradBg = (k: GradKey) => `linear-gradient(135deg, ${GRAD[k][0]}, ${GRAD[k][1]})`;

/* ---------- Komponen kecil ---------- */
const cardClass = "rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)]";

function Card({ children, className = "p-5" }: { children: ReactNode; className?: string }) {
  return <div className={`${cardClass} ${className}`}>{children}</div>;
}

function Legend({ items, big = false }: { items: { label: string; key: GradKey }[]; big?: boolean }) {
  return (
    <ul
      className={`mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 font-semibold ${
        big ? "text-xs text-gray-700" : "text-[10px] text-gray-600"
      }`}
    >
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            className={`rounded-full ${big ? "h-3 w-3" : "h-2.5 w-2.5"}`}
            style={{ background: gradBg(i.key) }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function StatCard({ label, color, value, target }: { label: string; color: string; value: number; target?: number }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3 text-center shadow-[0_6px_14px_rgba(0,0,0,0.15)]">
      <p className="border-b border-gray-200 pb-1 text-[11px] font-bold leading-tight" style={{ color }}>
        {label}
      </p>
      <p className="mt-2 text-4xl font-extrabold" style={{ color }}>
        {value}
        {target !== undefined && <span className="text-xl"> / {target}</span>}
      </p>
    </div>
  );
}

/** Grafik batang: target (garis putus-putus) vs realisasi (batang gradasi) */
function TargetChart() {
  const uid = useUid();
  const W = 420, H = 240, L = 40, R = 410, top = 52, base = 222, max = 30;
  const y = (v: number) => base - (v / max) * (base - top);
  const barW = 17, groupStart = 66, groupStep = 78;
  const series: GradKey[] = ["publikasi", "purwarupa", "ki"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Target Kepala ORPA vs Realisasi">
      <BarDefs uid={uid} />

      {/* Legenda kanan atas */}
      <rect x="292" y="6" width="10" height="10" fill="none" stroke="#777" strokeDasharray="2 2" />
      <text x="306" y="14.5" fontSize="8.5" fill="#444">Target Kepala ORPA</text>
      <rect x="292" y="20" width="10" height="10" fill="none" stroke="#333" />
      <text x="306" y="28.5" fontSize="8.5" fill="#444">Realisasi</text>

      {/* Garis bantu */}
      {[10, 20, 30].map((v) => (
        <g key={v}>
          <line x1={L} x2={R} y1={y(v)} y2={y(v)} stroke="#e2e2e2" />
          <text x={L - 8} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#555" fontWeight="600">{v}</text>
        </g>
      ))}
      <line x1={L} x2={R} y1={base} y2={base} stroke="#555" />

      {targetVsRealisasi.map((group, gi) =>
        group.map((b, bi) => {
          const x = groupStart + gi * groupStep + bi * (barW + 1);
          const key = series[bi];
          return (
            <g key={`${gi}-${bi}`}>
              {b.t > 0 && (
                <rect
                  x={x}
                  y={y(b.t)}
                  width={barW}
                  height={base - y(b.t)}
                  fill="none"
                  stroke={C[key]}
                  strokeDasharray="2 2"
                />
              )}
              {b.r > 0 && (
                <rect x={x} y={y(b.r)} width={barW} height={base - y(b.r)} rx="1.5" fill={`url(#${uid}-${key})`} />
              )}
              {b.r > 0 && (
                <text x={x + barW / 2} y={y(b.r) - 3} fontSize="8" fontWeight="700" textAnchor="middle" fill="#333">{b.r}</text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

/** Grafik donat komposisi (dengan garis penunjuk label) */
function DonutChart() {
  const uid = useUid();
  const cx = 210, cy = 125, R = 100, r = 50, mid = (R + r) / 2;
  const total = komposisi.reduce((s, k) => s + k.value, 0);
  const pt = (rad: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  };
  let angle = 0;

  return (
    <svg viewBox="0 0 420 250" className="w-full" role="img" aria-label="Komposisi Realisasi Capaian ORPA">
      <defs>
        {/* Gradien radial dari lubang tengah (pekat) ke tepi luar (lembut), berlaku untuk semua irisan */}
        {komposisi.map((k) => (
          <radialGradient
            key={k.grad}
            id={`${uid}-donut-${k.grad}`}
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={cy}
            r={R}
          >
            <stop offset={r / R} stopColor={GRAD[k.grad][0]} />
            <stop offset="1" stopColor={GRAD[k.grad][1]} />
          </radialGradient>
        ))}
      </defs>

      {komposisi.map((k) => {
        const sweep = (k.value / total) * 360;
        const a0 = angle, a1 = angle + sweep;
        angle = a1;
        const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1);
        const [ix1, iy1] = pt(r, a1), [ix0, iy0] = pt(r, a0);
        const large = sweep > 180 ? 1 : 0;
        const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix0} ${iy0} Z`;

        const persen = ((sweep / 360) * 100).toFixed(1);
        const [dx, dy] = pt(mid, (a0 + a1) / 2);
        const textX = k.side === "right" ? k.lineEnd + 4 : 28;
        return (
          <g key={k.label}>
            <path d={d} fill={`url(#${uid}-donut-${k.grad})`} stroke="#fff" strokeWidth="1.5" />
            <circle cx={dx} cy={dy} r="2" fill="#444" />
            <line x1={dx} y1={dy} x2={k.lineEnd} y2={dy} stroke="#666" strokeWidth="0.8" />
            <text x={textX} y={dy - 1} fontSize="8.5" fontWeight="700" fill="#444">{k.label}</text>
            <text x={textX} y={dy + 9} fontSize="8.5" fill="#777">{persen}%</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Grafik batang sederhana untuk satu pusat riset (batang gradasi per kategori) */
function PusatRisetChart({ data }: { data: number[] }) {
  const uid = useUid();
  const W = 400, H = 200, L = 28, B = 6, T = 10, plotH = H - B - T, max = 30;
  const y = (v: number) => T + plotH - (v / max) * plotH;
  const slot = (W - L - 10) / data.length, barW = 28;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <BarDefs uid={uid} />
      {[0, 10, 20, 30].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - 10} y1={y(v)} y2={y(v)} stroke="#e5e5e5" />
          <text x={L - 6} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#666">{v}</text>
        </g>
      ))}
      {data.map((v, i) => {
        const kat = kategori[i];
        if (!kat) return null; // jaga-jaga kalau data lebih panjang dari kategori
        const x = L + i * slot + (slot - barW) / 2;
        return (
          <g key={i}>
            <rect x={x} y={y(v)} width={barW} height={y(0) - y(v)} rx="2" fill={`url(#${uid}-${kat.key})`} />
            <text x={x + barW / 2} y={y(v) - 4} fontSize="9" textAnchor="middle" fill="#333">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

const Crown = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill={color} aria-hidden="true">
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />
  </svg>
);

const Arrow = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {dir === "left" ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
  </svg>
);

/* ---------- Halaman ---------- */
export default function Home() {
  const [triwulan, setTriwulan] = useState<Triwulan>("III");
  const s = summaryData[triwulan];

  return (
    <div className="flex w-full flex-col items-center gap-12">
      {/* Pita di atas tab (selebar halaman). Tab menempel di tepi bawah pita. */}
      <div className="-mx-8 -mt-8 flex h-24 w-[calc(100%+4rem)] items-end justify-center bg-[#222]" translate="no">
        <div role="tablist" aria-label="Pilih triwulan" className="flex">
          {(["III", "IV"] as Triwulan[]).map((t) => {
            const aktif = triwulan === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={aktif}
                onClick={() => setTriwulan(t)}
                className={`w-36 cursor-pointer rounded-t-2xl px-4 py-3 text-center text-sm font-bold leading-tight transition md:w-44 md:text-base ${
                  aktif ? "bg-white text-[#e8202f]" : "bg-[#e8202f] text-white hover:bg-[#c41a28]"
                }`}
              >
                MONEV
                <br />
                Triwulan {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-6xl space-y-10" translate="no">
        {/* Judul */}
        <h2 className="rounded-2xl bg-[#f22a3a] px-6 py-4 text-center text-xl font-bold text-white shadow-[0_8px_18px_rgba(0,0,0,0.2)] md:text-3xl">
          Capaian MONEV Triwulan {triwulan} Tahun 2026
        </h2>

        {/* Kartu ringkasan */}
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Ketua Tim" color="#f5a623" value={s.ketuaTim} />
          <StatCard label="Publikasi (Target/Realisasi)" color={C.publikasi} value={s.publikasi[0]} target={s.publikasi[1]} />
          <StatCard label="Purwarupa (Target/Realisasi)" color={C.purwarupa} value={s.purwarupa[0]} target={s.purwarupa[1]} />
          <StatCard label="KI (Target/Realisasi)" color={C.ki} value={s.ki[0]} target={s.ki[1]} />
        </div>

        {/* Dua grafik utama */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="mb-3 text-center text-sm font-bold text-gray-900">Target Kepala ORPA vs Realisasi</h3>
            <TargetChart />
            <Legend big items={kategoriTiga} />
          </Card>
          <Card>
            <h3 className="mb-3 text-center text-sm font-bold text-gray-900">Komposisi Realisasi Capaian ORPA</h3>
            <DonutChart />
          </Card>
        </div>

        {/* Komposisi per pusat riset */}
        <section className="text-center">
          <h3 className="text-xl font-bold text-gray-800 md:text-2xl">Komposisi Capaian Kinerja Pusat Riset</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-gray-500">
            Diagram berikut menampilkan proporsi dan perbandingan realisasi capaian kinerja dari setiap Pusat Riset pada periode ini.
          </p>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {pusatRiset.map((p) => (
              <Card key={p.nama} className="p-3">
                <h4 className="mb-2 text-center text-xs font-bold text-gray-800">Realisasi Capaian {p.nama}</h4>
                <PusatRisetChart data={p.data} />
                <Legend items={kategori} />
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Peringkat logbook (latar merah selebar halaman) */}
      <section className="-mx-8 -mb-8 w-[calc(100%+4rem)] bg-[#f22a3a] px-4 py-8 md:px-8" translate="no">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            {/* TODO: sambungkan tombol panah ke data periode sebelum/sesudahnya */}
            <button type="button" aria-label="Sebelumnya" className="rounded-full bg-white/70 p-2 hover:bg-white">
              <Arrow dir="left" />
            </button>
            <h3 className="px-2 text-center text-base font-bold text-white md:text-xl">Peringkat Kepatuhan Logbook Tertinggi</h3>
            <button type="button" aria-label="Berikutnya" className="rounded-full bg-white/70 p-2 hover:bg-white">
              <Arrow dir="right" />
            </button>
          </div>

          <Card className="mt-5 p-5">
            <ul className="space-y-3">
              {kepatuhan.map((k) => (
                <li key={k.nama} className="flex items-center gap-4">
                  <span className="w-12 text-sm font-bold text-gray-700">{k.nama}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-sm bg-gray-200">
                    <div className={`h-full bg-gradient-to-r ${k.gradient}`} style={{ width: `${k.persen}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-[#f25c5c]">{k.persen}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs font-semibold text-gray-500">Presentase Periset yang sudah mengisi logbook</p>
          </Card>

          <ol className="mt-4 overflow-hidden rounded-xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
            {peringkat.map((nama, i) => (
              <li key={i} className="flex items-center gap-4 border-b border-gray-200 px-5 py-3 last:border-b-0">
                <span className="flex w-7 justify-center text-sm font-bold text-gray-800">
                  {i < 3 ? <Crown color={crownColors[i]} /> : `${i + 1}.`}
                </span>
                <span className="text-sm font-bold text-gray-900">{nama}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}