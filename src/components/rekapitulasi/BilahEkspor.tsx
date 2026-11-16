import { useState } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";

type Jenis = "pdf" | "excel";

const IKON = {
  pdf: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 14h6M9 17h4" />
    </>
  ),
  excel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 15h18M9 4v16" />
    </>
  ),
};

/** Bilah atas tabel: judul di kiri, tombol unduh PDF dan Excel di kanan (gaya sama dengan Pemantauan) */
export default function BilahEkspor({
  judul,
  subjudul,
  onPdf,
  onExcel,
}: {
  judul: string;
  subjudul: string;
  onPdf: () => Promise<void>;
  onExcel: () => Promise<void>;
}) {
  const [sibuk, setSibuk] = useState<Jenis | null>(null);

  const jalankan = async (jenis: Jenis, fn: () => Promise<void>) => {
    if (sibuk) return;
    setSibuk(jenis);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      alert(jenis === "pdf" ? "PDF gagal dibuat. Coba lagi." : "Excel gagal dibuat. Coba lagi.");
    } finally {
      setSibuk(null);
    }
  };

  const tombol = (jenis: Jenis, fn: () => Promise<void>, label: string, judulTombol: string) => (
    <button
      type="button"
      onClick={() => void jalankan(jenis, fn)}
      disabled={sibuk !== null}
      title={judulTombol}
      style={{ background: GRAD_CARD }}
      className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white shadow-[0_2px_8px_rgba(27,63,120,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 sm:gap-2 sm:px-4"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {IKON[jenis]}
      </svg>
      {sibuk === jenis ? "Membuat…" : label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#dbe6f7] bg-white px-3 py-2 sm:px-4">
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm font-bold text-[#1b3560]">{judul}</p>
        <p className="truncate text-xs text-slate-500">{subjudul}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {tombol("pdf", onPdf, "PDF", "Unduh sebagai PDF")}
        {tombol("excel", onExcel, "Excel", "Unduh sebagai Excel (.xlsx)")}
      </div>
    </div>
  );
}