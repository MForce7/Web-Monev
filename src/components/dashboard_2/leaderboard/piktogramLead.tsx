import { useMemo } from "react";

export interface StatusItem {
  nama: string;
  PR: string;
  persen: number;
}

interface KepatuhanItem {
  nama: string; // nama PR
  persen: number; // rata-rata persen anggota PR
}

export interface PiktogramKepatuhanProps {
  data: StatusItem[]; // data mentah per orang
  urutan?: "tertinggi" | "terendah"; // dikontrol parent
  caption?: string;
  className?: string;
}

// Warna per kategori (key = nilai field PR, huruf besar)
const WARNA_KATEGORI: Record<string, { from: string; to: string }> = {
  PRTR: { from: "#5F27CD", to: "#9C6BFC" }, // ungu
  PRA: { from: "#FFB322", to: "#FFD27C" },  // kuning
  PRTP: { from: "#F85A5A", to: "#FF9595" }, // merah
  PRTS: { from: "#BAFFC9", to: "#EFFFF3" }, // hijau
};
const WARNA_DEFAULT = { from: "#9ca3af", to: "#d1d5db" };

const gradientOf = (nama: string) => {
  const w = WARNA_KATEGORI[nama] ?? WARNA_DEFAULT;
  return `linear-gradient(to right, ${w.from}, ${w.to})`;
};

function Daftar({ items, hidden }: { items: KepatuhanItem[]; hidden: boolean }) {
  return (
    <ul className="w-full shrink-0 space-y-3" aria-hidden={hidden}>
      {items.map((k) => (
        <li key={k.nama} className="flex items-center gap-4">
          <span className="w-12 text-sm font-bold text-gray-700">{k.nama}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-sm bg-gray-200">
            <div
              className="h-full"
              style={{ width: `${k.persen}%`, background: gradientOf(k.nama) }}
              role="progressbar"
              aria-valuenow={k.persen}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="w-12 text-right text-sm font-bold text-[#f25c5c]">{k.persen}%</span>
        </li>
      ))}
    </ul>
  );
}

export default function PiktogramKepatuhan({
  data,
  urutan = "tertinggi",
  caption = "Presentase Periset yang sudah mengisi logbook",
  className = "",
}: PiktogramKepatuhanProps) {
  // 1) kelompokkan per PR  2) rata-ratakan persen  3) urutkan tertinggi
  const desc = useMemo(() => {
    const groups = new Map<string, number[]>();

    for (const item of data) {
      const key = String(item.PR ?? "").trim().toUpperCase();
      if (!key) continue; // lewati data tanpa PR
      const list = groups.get(key);
      if (list) list.push(Number(item.persen) || 0);
      else groups.set(key, [Number(item.persen) || 0]);
    }

    return Array.from(groups, ([nama, list]) => ({
      nama,
      persen: Math.round(list.reduce((s, v) => s + v, 0) / list.length),
    })).sort((a, b) => b.persen - a.persen);
  }, [data]);

  const asc = useMemo(() => [...desc].reverse(), [desc]);

  return (
    <div className={`rounded-xl bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.2)] ${className}`}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${urutan === "tertinggi" ? "0" : "-100%"})` }}
        >
          <Daftar items={desc} hidden={urutan !== "tertinggi"} />
          <Daftar items={asc} hidden={urutan !== "terendah"} />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-gray-500">{caption}</p>
    </div>
  );
}