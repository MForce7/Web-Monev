import { useMemo, type ReactNode } from "react";

export interface PeringkatItem {
  nama: string;
  persen: number;
}

export interface LeaderboardSectionProps {
  peringkat: PeringkatItem[];
  urutan?: "tertinggi" | "terendah"; // dikontrol parent
  titleTertinggi?: string;
  titleTerendah?: string;
  crownColors?: string[];
  visibleRows?: number; // jumlah baris yang terlihat tanpa scroll (default 10)
  onPrev?: () => void;
  onNext?: () => void;
  children?: ReactNode; // slot untuk piktogram
}

// Tinggi satu baris: py-3 (24px) + line-height text-sm (20px) + border bawah (1px)
const ROW_HEIGHT = 45;

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f22a3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function Crown({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />
    </svg>
  );
}

function Daftar({
  items,
  hidden,
  crownColors,
  visibleRows,
}: {
  items: PeringkatItem[];
  hidden: boolean;
  crownColors?: string[]; // jika diisi, 3 teratas pakai mahkota
  visibleRows: number;
}) {
  return (
    <ol
      className="w-full shrink-0 overflow-y-auto overscroll-contain"
      style={{ maxHeight: visibleRows * ROW_HEIGHT }}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
    >
      {items.map((item, i) => (
        <li key={`${item.nama}-${i}`} className="flex items-center gap-4 border-b border-gray-200 px-5 py-3 last:border-b-0">
          <span className="flex w-7 shrink-0 justify-center text-sm font-bold text-gray-800">
            {crownColors && i < 3 ? <Crown color={crownColors[i % crownColors.length]} /> : `${i + 1}.`}
          </span>
          <span className="truncate text-sm font-bold text-gray-900">{item.nama}</span>
          <span className="shrink-0 text-sm font-bold text-[#f25c5c]">{item.persen}%</span>
        </li>
      ))}
    </ol>
  );
}

export default function LeaderboardSection({
  peringkat,
  urutan = "tertinggi",
  titleTertinggi = "Peringkat Kepatuhan Pengisian Logbook Tertinggi",
  titleTerendah = "Peringkat Kepatuhan Pengisian Logbook Terendah",
  crownColors = ["#FFC107", "#B0BEC5", "#CD7F32"],
  visibleRows = 10,
  onPrev,
  onNext,
  children,
}: LeaderboardSectionProps) {
  const desc = useMemo(() => [...peringkat].sort((a, b) => b.persen - a.persen), [peringkat]);
  const asc = useMemo(() => [...desc].reverse(), [desc]);

  const isTertinggi = urutan === "tertinggi";
  const navClass =
    "rounded-full bg-white/70 p-2 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/70";

  return (
    <section className="w-screen bg-[#f22a3a] px-4 py-8 md:px-8" translate="no">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Sebelumnya" onClick={onPrev} disabled={isTertinggi} className={navClass}>
            <Arrow dir="left" />
          </button>
          <h3 className="px-2 text-center text-base font-bold text-white md:text-xl">
            {isTertinggi ? titleTertinggi : titleTerendah}
          </h3>
          <button type="button" aria-label="Berikutnya" onClick={onNext} disabled={!isTertinggi} className={navClass}>
            <Arrow dir="right" />
          </button>
        </div>

        {children && <div className="mt-5">{children}</div>}

        <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${isTertinggi ? "0" : "-100%"})` }}
          >
            <Daftar items={desc} hidden={!isTertinggi} crownColors={crownColors} visibleRows={visibleRows} />
            <Daftar items={asc} hidden={isTertinggi} visibleRows={visibleRows} />
          </div>
        </div>
      </div>
    </section>
  );
}