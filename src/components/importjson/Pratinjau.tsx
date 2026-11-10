import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Badge, { WARNA_BADGE } from "./Badge.tsx";
import DaftarLink from "./DaftarLink.tsx";
import Kosong from "./Kosong.tsx";
import { GRAD } from "./konstanta.ts";
import type { Isian } from "./tipe.ts";

const th = "border-r border-white/25 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";
const td = "border-b border-r border-[#dbe6f7] px-3 py-2 align-top text-sm text-[#1b3560] last:border-r-0";
const teks = "whitespace-pre-line [overflow-wrap:anywhere]";

// Lebar kolom kiri dikunci supaya posisi sticky tepat
const w1 = "w-[48px] min-w-[48px] max-w-[48px]";
const w2 = "w-[200px] min-w-[200px] max-w-[200px]";
const w3 = "w-[120px] min-w-[120px] max-w-[120px]";
const LEBAR_STICKY = 368; // 48 + 200 + 120
const JUMLAH_KOLOM = 16;

export default function Pratinjau({ grup }: { grup: { pusat: string; items: Isian[] }[] }) {
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
  }, [cek, grup]);

  const geser = (arah: 1 | -1) => ref.current?.scrollBy({ left: arah * 420, behavior: "smooth" });

  const tombolPanah = (arah: "kiri" | "kanan") => (
    <button
      type="button"
      onClick={() => geser(arah === "kanan" ? 1 : -1)}
      aria-label={arah === "kanan" ? "Geser ke kanan" : "Geser ke kiri"}
      style={arah === "kiri" ? { left: LEBAR_STICKY + 8 } : undefined}
      className={`absolute top-10 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-[#2a5aa8] shadow-[0_2px_8px_rgba(27,63,120,0.3)] transition hover:bg-[#eaf0fa] ${
        arah === "kanan" ? "right-2" : ""
      }`}
    >
      {arah === "kanan" ? "›" : "‹"}
    </button>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dbe6f7]">
      <div
        ref={ref}
        onScroll={cek}
        className="overflow-x-auto [scrollbar-color:#2a5aa8_#eaf0fa] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#eaf0fa] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a5aa8]"
      >
        <table className="w-full border-separate border-spacing-0 bg-white">
          <thead style={{ background: GRAD }}>
            <tr>
              <th rowSpan={2} className={`${th} sticky left-0 z-20 border-b bg-[#1b3f78] ${w1}`}>No</th>
              <th rowSpan={2} className={`${th} sticky left-[48px] z-20 border-b bg-[#1b3f78] text-left ${w2}`}>Nama Ketua Tim</th>
              <th rowSpan={2} className={`${th} sticky left-[248px] z-20 border-b bg-[#1b3f78] ${w3}`}>Validasi</th>
              <th rowSpan={2} className={`${th} min-w-[240px] border-b`}>Judul Aktivitas</th>
              <th rowSpan={2} className={`${th} min-w-[140px] border-b`}>Target Output</th>
              <th colSpan={6} className={`${th} border-b bg-[#2a5aa8]/60 uppercase`}>Progres Aktivitas / Kegiatan</th>
              <th colSpan={5} className={`${th} border-b bg-[#2a5aa8]/60 uppercase`}>Progres Capaian Output</th>
            </tr>
            <tr>
              {[
                ["Status Pelaksanaan", "min-w-[120px]"],
                ["Persentase Progres", "min-w-[110px]"],
                ["Uraian Kemajuan Aktivitas", "min-w-[280px]"],
                ["Kendala Yang Ditemui", "min-w-[220px]"],
                ["Mitigasi / Rencana Tindak Lanjut", "min-w-[220px]"],
                ["Data Dukung Progres", "min-w-[150px]"],
                ["Jenis Output", "min-w-[120px]"],
                ["Judul Output", "min-w-[240px]"],
                ["Status", "min-w-[110px]"],
                ["Progres Capaian", "min-w-[110px]"],
                ["Data Dukung Output", "min-w-[150px]"],
              ].map(([label, lebar]) => (
                <th key={label} className={`${th} ${lebar} border-b bg-white/10`}>{label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {grup.map((g) => (
              <Fragment key={g.pusat}>
                <tr>
                  <td colSpan={JUMLAH_KOLOM} className="border-b border-[#dbe6f7] bg-[#eaf0fa] p-0">
                    <div className="sticky left-0 w-max px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1b3560]">
                      {g.pusat || "Tanpa pusat riset"}{" "}
                      <span className="font-medium normal-case tracking-normal text-slate-500">({g.items.length} kegiatan)</span>
                    </div>
                  </td>
                </tr>
                {g.items.map((d, i) => (
                  <tr
                    key={d.id}
                    className={`transition-colors hover:bg-[#eaf0fa] ${i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"}`}
                  >
                    <td className={`${td} sticky left-0 z-10 bg-inherit text-center ${w1}`}>{d.no}</td>
                    <td className={`${td} sticky left-[48px] z-10 bg-inherit font-medium ${w2}`}>{d.ketua}</td>
                    <td className={`${td} sticky left-[248px] z-10 bg-inherit text-center ${w3}`}>
                      <Badge warna={WARNA_BADGE[d.validasi]}>{d.validasi}</Badge>
                      {d.validasi === "Cek" && (
                        <span
                          title={d.belumSesuai.join(", ")}
                          className="mt-1 block text-[11px] leading-tight text-[#92400e]"
                        >
                          {d.belumSesuai.length === 1 ? `${d.belumSesuai[0]} kosong` : `${d.belumSesuai.length} kolom belum diisi`}
                        </span>
                      )}
                    </td>
                    <td className={`${td} ${teks}`}>{d.judulAktivitas || <Kosong />}</td>
                    <td className={`${td} ${teks}`}>{d.target || <Kosong />}</td>
                    <td className={`${td} ${teks}`}>{d.statusPelaksanaan || <Kosong />}</td>
                    <td className={`${td} text-center`}>{d.persenPelaksanaan || <Kosong />}</td>
                    <td className={`${td} ${teks}`}>{d.uraian || <Kosong />}</td>
                    <td className={`${td} ${teks}`}>{d.kendala || <Kosong />}</td>
                    <td className={`${td} ${teks}`}>{d.mitigasi || <Kosong />}</td>
                    <td className={td}><DaftarLink links={d.dataDukungAktivitas} /></td>
                    <td className={`${td} ${teks}`}>{d.jenisOutput || <Kosong />}</td>
                    <td className={`${td} ${teks}`}>{d.judulOutput || <Kosong />}</td>
                    <td className={`${td} ${teks}`}>{d.statusOutput || <Kosong />}</td>
                    <td className={`${td} text-center`}>{d.progresOutput === null ? <Kosong /> : `${d.progresOutput}%`}</td>
                    <td className={td}><DaftarLink links={d.dataDukungOutput} /></td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {bisaKanan && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-[#1b3f78]/10 to-transparent" />
          {tombolPanah("kanan")}
        </>
      )}
      {bisaKiri && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 z-20 w-6 bg-gradient-to-r from-[#1b3f78]/10 to-transparent"
            style={{ left: LEBAR_STICKY }}
          />
          {tombolPanah("kiri")}
        </>
      )}
    </div>
  );
}
