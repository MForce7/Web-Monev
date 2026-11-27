// import { useCallback, useEffect, useRef, useState } from "react";
// import { GRAD_CARD } from "../../../config/Warna.ts";
// import { JUMLAH_BARIS_KOSONG } from "../../../config/Datacontoh.ts";
// import rekapOutput from "../../../data/rekapOutput.json";
import DropdownPusatRiset from "../../rekapitulasi/DropdownPusatRiset.tsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GRAD_CARD } from "../../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../../config/Datacontoh.ts";
// import DropdownPusatRiset from "../DropdownPusatRiset.tsx";
import { fetchPemantauanData } from "../../../lib/supabasePemantauanData.ts";
import type { BarisPantau } from "./types";
import { BULAN } from "./types";
import { cetakPdf } from "./cetakPdf";
import {
  th,
  td,
  stickyBody1,
  stickyBody2,
  stickyBody3,
  stickyBody4,
  stickyHead1,
  stickyHead2,
  stickyHead3,
  stickyHead4,
} from "./styles";
import { FragmentHead, FragmentSel } from "./SelTabel";
import { TombolPanah } from "./TombolPanah";

// bulan tetap ada di tipe props supaya cocok dengan komponen lain, tapi tidak dipakai di sini
type Props = {
  bulan?: string | null;
  pusatRiset: string | null;
  /** Kalau diisi, dropdown pusat riset tampil di samping tombol Cetak */
  onChangePusatRiset?: (v: string | null) => void;
};

export default function TabelPemantauan({ pusatRiset, onChangePusatRiset }: Props) {
  /* ---------- Data ----------
     Diambil langsung dari Supabase (tabel activities + monthly_reports), lalu status
     tiap bulan dihitung lewat periksaIsi() berdasarkan isian asli logbook-nya. */
  const [semua, setSemua] = useState<BarisPantau[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    setGalat(null);

    fetchPemantauanData()
      .then((hasil) => {
        if (!batal) setSemua(hasil);
      })
      .catch((err: Error) => {
        if (!batal) setGalat(err.message);
      })
      .finally(() => {
        if (!batal) setMemuat(false);
      });

    return () => {
      batal = true;
    };
  }, []);

  // Daftar unit kerja / pusat riset dibentuk dari data asli (bukan daftar statis),
  // supaya pilihan filter selalu cocok dengan nilai yang benar-benar ada di database.
  const opsiPusatRiset = useMemo(() => {
    const set = new Set(semua.map((d) => d.pusatRiset).filter((v): v is string => !!v));
    const unit = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["Semua Pusat Riset", ...unit];
  }, [semua]);

  const [cari, setCari] = useState("");

  // "Semua Pusat Riset" (atau belum memilih) = tampilkan semua ketua tim
  const data = useMemo(() => {
    const kataKunci = cari.trim().toLowerCase();
    return semua.filter((d) => {
      const cocokUnit = !pusatRiset || pusatRiset === "Semua Pusat Riset" || d.pusatRiset === pusatRiset;
      const cocokNama = !kataKunci || d.nama.toLowerCase().includes(kataKunci);
      return cocokUnit && cocokNama;
    });
  }, [semua, pusatRiset, cari]);

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

  const geser = (arah: 1 | -1) => ref.current?.scrollBy({ left: arah * 320, behavior: "smooth" });
  const bisaScroll = bisaKiri || bisaKanan;

  // Belum memilih pusat riset = unduh semua pusat riset
  const namaPusat = pusatRiset ?? "Semua Pusat Riset";

  const [mencetak, setMencetak] = useState(false);

  async function handleCetak() {
    if (mencetak) return;

    try {
      setMencetak(true);
      await cetakPdf(namaPusat, data);
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      alert("PDF gagal dibuat. Silakan coba kembali.");
    } finally {
      setMencetak(false);
    }
  }

  return (
    // Pembungkus luar membawa bayangan + sudut bulat; bagian dalam dipotong dengan clip-path
    <div className="w-full min-w-0 rounded-2xl shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
      <section className="isolate w-full overflow-hidden rounded-2xl bg-white [--no-w:44px] [--nama-w:120px] [--judul-w:140px] [--unit-w:120px] [--sticky-w:424px] [clip-path:inset(0_round_1rem)] md:[--no-w:56px] md:[--nama-w:200px] md:[--judul-w:220px] md:[--unit-w:180px] md:[--sticky-w:656px]">
        {/* Bilah atas: judul di kiri; dropdown pusat riset + tombol Cetak di kanan.
            z-40 supaya daftar dropdown tampil di atas tabel (kolom sticky memakai z-10 sampai z-30). */}
        <div className="relative z-40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#dbe6f7] bg-white px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1b3560]">Pemantauan pengisian logbook</p>
            <p className="truncate text-xs text-slate-500">{pusatRiset ?? "Semua pusat riset"}</p>
          </div>
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
            <div className="w-40 min-w-0 sm:w-56">
              <input
                type="text"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama ketua tim..."
                aria-label="Cari nama ketua tim"
                className="w-full rounded-lg border border-[#c7d7ef] bg-white px-3 py-1.5 text-xs text-[#1b3560] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]/40"
              />
            </div>

            {onChangePusatRiset && (
              <div className="w-44 min-w-0 sm:w-60">
                <DropdownPusatRiset value={pusatRiset} onChange={onChangePusatRiset} opsi={opsiPusatRiset} />
              </div>
            )}
            <button
              type="button"
              onClick={handleCetak}
              disabled={mencetak}
              title="Unduh rekap sebagai PDF"
              style={{ background: GRAD_CARD }}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white shadow-[0_2px_8px_rgba(27,63,120,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 sm:gap-2 sm:px-4"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9V3h12v6" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="7" rx="1" />
              </svg>
              {mencetak ? "Membuat PDF…" : "Cetak"}
            </button>
          </div>
        </div>

        {/* status memuat / gagal ambil data dari Supabase */}
        {memuat && (
          <p className="border-b border-[#dbe6f7] bg-[#f5f8fd] px-3 py-2 text-center text-xs text-slate-500 sm:px-4">
            Memuat data pemantauan...
          </p>
        )}
        {galat && (
          <p className="border-b border-[#dbe6f7] bg-red-50 px-3 py-2 text-center text-xs text-red-600 sm:px-4">
            Gagal memuat data pemantauan: {galat}
          </p>
        )}

        {!memuat && !galat && (
          <>
            {/* petunjuk: hanya muncul kalau tabel memang bisa di-scroll */}
            {bisaScroll && (
              <p className="flex items-center justify-center gap-2 border-b border-[#dbe6f7] bg-[#f5f8fd] px-3 py-1 text-center text-[11px] font-semibold text-[#2a5aa8] sm:text-xs">
                {bisaKiri && <span aria-hidden>←</span>}
                Geser tabel ke samping untuk melihat bulan lainnya
                {bisaKanan && <span aria-hidden className="animate-pulse">→</span>}
              </p>
            )}

            <div className="relative">
              <div
                ref={ref}
                onScroll={cek}
                className="overflow-x-auto overscroll-x-contain [scrollbar-color:#2a5aa8_#eaf0fa] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#eaf0fa] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a5aa8]"
              >
                <table className="w-full border-separate border-spacing-0">
                  <thead style={{ background: GRAD_CARD }}>
                    <tr>
                      <th rowSpan={2} className={`${th} ${stickyHead1} bg-[#1b3f78] border-b`}>No</th>
                      <th rowSpan={2} className={`${th} ${stickyHead2} bg-[#1b3f78] border-b text-left`}>Nama Ketua Tim</th>
                      <th rowSpan={2} className={`${th} ${stickyHead3} bg-[#1b3f78] border-b text-left`}>Judul</th>
                      <th rowSpan={2} className={`${th} ${stickyHead4} bg-[#1b3f78] border-b text-left`}>Unit Kerja</th>
                      {BULAN.map((b) => (
                        <th key={b} colSpan={2} className={`${th} min-w-[260px] border-b text-xs`}>{b}</th>
                      ))}
                    </tr>
                    <tr>
                      {BULAN.map((b) => (
                        <FragmentHead key={b} />
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {Array.from({ length: jumlahBaris }).map((_, i) => {
                      const d = data[i];
                      return (
                        <tr
                          key={d?.id ?? `kosong-${i}`}
                          className={`min-h-[52px] transition-colors hover:bg-[#eaf0fa] [&:last-child>td]:border-b-0 ${
                            i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"
                          }`}
                        >
                          <td className={`${td} ${stickyBody1} h-[52px] bg-inherit`}>{d ? i + 1 : null}</td>
                          <td className={`${td} ${stickyBody2} bg-inherit text-left font-medium`}>{d?.nama}</td>
                          <td className={`${td} ${stickyBody3} bg-inherit truncate text-left`} title={d?.judul}>
                            {d?.judul || "-"}
                          </td>
                          <td className={`${td} ${stickyBody4} bg-inherit truncate text-left`} title={d?.pusatRiset}>
                            {d?.pusatRiset || "-"}
                          </td>
                          {BULAN.map((b) => {
                            const s = d?.bulan?.[b];
                            return <FragmentSel key={b} ada={!!d} status={s?.status} belum={s?.belumSesuai} />;
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-[#1b3f78]/10 to-transparent" />
                  <TombolPanah arah="kanan" onClick={() => geser(1)} />
                </>
              )}
              {bisaKiri && (
                <>
                  <div
                    className="pointer-events-none absolute inset-y-0 z-20 w-6 bg-gradient-to-r from-[#1b3f78]/10 to-transparent"
                    style={{ left: "var(--sticky-w)" }}
                  />
                  <TombolPanah arah="kiri" onClick={() => geser(-1)} style={{ left: "calc(var(--sticky-w) + 8px)" }} />
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}