import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

type Sel = { status?: string; belumSesuai?: string | number };
type BarisPantau = {
  id: string | number;
  nama: string;
  pusatRiset?: string;
  bulan?: Record<string, Sel>; // mis. { Januari: { status: "Lengkap" } }
};

// TODO: isi / ganti dengan data asli (json atau API)
const semua: BarisPantau[] = [];

const th = "border-r border-white/30 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";
const td = "border-b border-r border-gray-300 px-3 py-2 text-center text-sm text-gray-800";
const sticky1 = "sticky left-0 z-10 w-14 min-w-[56px]";
const sticky2 = "sticky left-14 z-10 min-w-[200px]";
const LEBAR_STICKY = 256; // 56px (No) + 200px (Nama Ketua Tim), dipakai untuk posisi bayangan kiri

// bulan tetap ada di tipe props supaya cocok dengan komponen lain, tapi tidak dipakai di sini
type Props = { bulan?: string | null; pusatRiset: string | null };

export default function Tabel3({ pusatRiset }: Props) {
  const data = pusatRiset ? semua.filter((d) => d.pusatRiset === pusatRiset) : semua;
  const jumlahBaris = Math.max(data.length, JUMLAH_BARIS_KOSONG);

  const ref = useRef<HTMLDivElement>(null);
  const [bisaKiri, setBisaKiri] = useState(false);
  const [bisaKanan, setBisaKanan] = useState(false);

  const cek = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setBisaKiri(el.scrollLeft > 4);
    setBisaKanan(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    cek();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(cek);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cek]);

  const geser = (arah: 1 | -1) => ref.current?.scrollBy({ left: arah * 420, behavior: "smooth" });
  const bisaScroll = bisaKiri || bisaKanan;

  return (
    <section className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
      {/* petunjuk: hanya muncul kalau tabel memang bisa di-scroll */}
      {bisaScroll && (
        <p className="flex items-center justify-center gap-2 border-b border-gray-200 bg-[#fff5f6] px-3 py-2 text-xs font-semibold text-[#e8202f]">
          {bisaKiri && <span aria-hidden>←</span>}
          Geser tabel ke samping untuk melihat bulan lainnya
          {bisaKanan && <span aria-hidden className="animate-pulse">→</span>}
        </p>
      )}

      <div className="relative">
        <div
          ref={ref}
          onScroll={cek}
          className="overflow-x-auto [scrollbar-color:#f25c6a_#f3f4f6] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#f25c6a]"
        >
          <table className="w-full border-separate border-spacing-0">
            <thead style={{ background: GRAD_CARD }}>
              <tr>
                <th rowSpan={2} className={`${th} ${sticky1} bg-[#e8202f] border-b`}>No</th>
                <th rowSpan={2} className={`${th} ${sticky2} bg-[#e8202f] border-b text-left`}>Nama Ketua Tim</th>
                {BULAN.map((b) => (
                  <th key={b} colSpan={2} className={`${th} min-w-[200px] border-b text-sm`}>{b}</th>
                ))}
              </tr>
              <tr className="bg-black/5">
                {BULAN.map((b) => (
                  <FragmentHead key={b} />
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: jumlahBaris }).map((_, i) => {
                const d = data[i];
                return (
                  <tr key={d?.id ?? `kosong-${i}`} className="h-[52px] [&:last-child>td]:border-b-0">
                    <td className={`${td} ${sticky1} bg-white`}>{d ? i + 1 : null}</td>
                    <td className={`${td} ${sticky2} bg-white text-left font-medium`}>{d?.nama}</td>
                    {BULAN.map((b) => {
                      const s = d?.bulan?.[b];
                      return <FragmentSel key={b} status={s?.status} belum={s?.belumSesuai} />;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* bayangan tepi + tombol panah */}
        {bisaKanan && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-black/10 to-transparent" />
            <TombolPanah arah="kanan" onClick={() => geser(1)} />
          </>
        )}
        {bisaKiri && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-6 bg-gradient-to-r from-black/10 to-transparent"
              style={{ left: LEBAR_STICKY }}
            />
            <TombolPanah arah="kiri" onClick={() => geser(-1)} style={{ left: LEBAR_STICKY + 8 }} />
          </>
        )}
      </div>
    </section>
  );
}

function TombolPanah({ arah, onClick, style }: { arah: "kiri" | "kanan"; onClick: () => void; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arah === "kanan" ? "Geser ke kanan" : "Geser ke kiri"}
      style={style}
      className={`absolute top-9 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-[#e8202f] shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition hover:bg-[#fff5f6] ${
        arah === "kanan" ? "right-2" : ""
      }`}
    >
      {arah === "kanan" ? "›" : "‹"}
    </button>
  );
}

function FragmentHead() {
  return (
    <>
      <th className={`${th} bg-[#f25c6a] border-b`}>Status</th>
      <th className={`${th} bg-[#f25c6a] border-b`}>Belum Sesuai</th>
    </>
  );
}

function FragmentSel({ status, belum }: { status?: string; belum?: string | number }) {
  return (
    <>
      <td className={`${td} font-bold ${status === "Lengkap" ? "text-green-600" : "text-[#e8202f]"}`}>{status}</td>
      <td className={td}>{belum}</td>
    </>
  );
}