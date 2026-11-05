import { useMemo, useRef, useState, type DragEvent } from "react";
import Badge, { WARNA_BADGE } from "../components/importexcel/Badge";
import Langkah from "../components/importexcel/Langkah";
import Pratinjau from "../components/importexcel/Pratinjau";
import TombolGradasi from "../components/importexcel/TombolGradasi";
import { bacaExcel, bentukLogbook, unduhTemplate } from "../components/importexcel/excel";
import { MENU } from "../components/importexcel/konstanta";
import type { HasilBaca } from "../components/importexcel/tipe";
import Dropdown from "../components/rekapitulasi/Dropdown";
import { bulanOpsi } from "../config/Datacontoh";

export default function Importexcel() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [hasil, setHasil] = useState<HasilBaca | null>(null);
  const menu = MENU[0]; // menu logbook tetap (dropdown dihapus)
  const [bulan, setBulan] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [seret, setSeret] = useState(false);
  const [error, setError] = useState("");
  const [tersimpan, setTersimpan] = useState<number | null>(null);

  const reset = () => {
    setFile(null);
    setHasil(null);
    setBulan("");
    setError("");
    setTersimpan(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const proses = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    setTersimpan(null);
    if (!/\.xlsx?$/i.test(f.name)) return setError("Format file harus .xlsx atau .xls.");

    setMemuat(true);
    try {
      const h = await bacaExcel(f);
      setFile(f);
      setHasil(h);
      setBulan(h.bulan ?? "");
    } catch (e) {
      setFile(null);
      setHasil(null);
      setError(e instanceof Error ? e.message : "File tidak bisa dibaca.");
    } finally {
      setMemuat(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSeret(false);
    void proses(e.dataTransfer.files[0]);
  };

  /* ---------- turunan data ---------- */

  const daftarPusat = useMemo(() => [...new Set((hasil?.rows ?? []).map((r) => r.pusat))], [hasil]);

  const tampil = useMemo(() => hasil?.rows ?? [], [hasil]);

  const grup = useMemo(
    () =>
      [...new Set(tampil.map((r) => r.pusat))].map((p) => ({
        pusat: p,
        items: tampil.filter((r) => r.pusat === p),
      })),
    [tampil]
  );

  const siap = tampil.filter((r) => r.validasi === "Siap");
  const cekCount = tampil.filter((r) => r.validasi === "Cek").length;
  const kosongCount = tampil.filter((r) => r.validasi === "Kosong").length;

  const simpan = () => {
    if (!bulan) return setError("Pilih bulan laporan dulu.");
    const payload = bentukLogbook(menu, bulan, siap);
    // TODO: kirim payload ke API / database di sini
    console.log(payload);
    setError("");
    setTersimpan(siap.length);
  };

  /* ---------- tampilan ---------- */

  return (
    <div className="min-h-screen w-full bg-[#f2f5fa] pt-24 font-sans text-[#1b3560]">
      <main className="min-w-0">
        <div className="flex h-[66px] items-center gap-4 bg-[#1f4e8c] px-6 text-xl font-bold text-white sm:px-9">
          <span>ORPA</span>
          <span aria-hidden="true" className="h-[26px] w-px bg-white/60" />
          <span className="truncate">Badan Riset dan Inovasi Nasional</span>
        </div>

        <div className="flex flex-col gap-5 px-4 py-6 sm:px-9">
          {/* Pilihan */}
          <div className="mx-auto grid w-full max-w-sm grid-cols-1 gap-3">
            <Dropdown label="Pilih Bulan" options={bulanOpsi} value={bulan || null} onChange={setBulan} />
          </div>

          {/* Kartu */}
          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe6f7] px-6 py-4">
              <div>
                <h2 className="text-xl font-extrabold">Import logbook dari Excel</h2>
                <p className="text-[13px] text-slate-500">
                  Unggah file Laporan progres aktivitas dan output, periksa pratinjau, lalu simpan ke logbook
                </p>
              </div>
              <TombolGradasi onClick={unduhTemplate}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
                </svg>
                Unduh Template
              </TombolGradasi>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-[#dbe6f7] bg-[#f5f8fd] px-6 py-2.5 text-[13px] font-bold">
              <Langkah n={1} label="Pilih file" aktif={!hasil} selesai={!!hasil} />
              <span aria-hidden="true" className={`h-0.5 w-12 ${hasil ? "bg-[#1f4e8c]" : "bg-[#dbe6f7]"}`} />
              <Langkah n={2} label="Periksa pratinjau" aktif={!!hasil && tersimpan === null} selesai={tersimpan !== null} />
              <span aria-hidden="true" className={`h-0.5 w-12 ${tersimpan !== null ? "bg-[#1f4e8c]" : "bg-[#dbe6f7]"}`} />
              <Langkah n={3} label="Simpan ke logbook" aktif={tersimpan !== null} selesai={tersimpan !== null} />
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
              onDragLeave={() => setSeret(false)}
              onDrop={onDrop}
              className={`mx-6 mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border-2 border-dashed px-4 py-6 transition ${
                seret ? "border-[#2a5aa8] bg-[#eaf0fa]" : "border-[#9db8e0] bg-[#f5f8fd]"
              }`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(27,63,120,0.18)]">
                <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="none" stroke="#1f4e8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-base font-extrabold">Tarik dan lepas file Excel di sini</p>
                <p className="text-[13px] text-slate-500">
                  Format .xlsx atau .xls, mengikuti template laporan bulanan
                </p>
              </div>
              <TombolGradasi besar onClick={() => inputRef.current?.click()} disabled={memuat}>
                {memuat ? "Membaca…" : "Pilih File"}
              </TombolGradasi>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="sr-only"
                aria-label="Pilih file Excel"
                onChange={(e) => void proses(e.target.files?.[0])}
              />
            </div>

            {error && (
              <p role="alert" className="mx-6 mt-3 rounded-xl bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b]">
                {error}
              </p>
            )}

            {/* File terpilih */}
            {file && hasil && (
              <div className="mx-6 mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe6f7] px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
                    <rect width="32" height="32" rx="8" fill="#dcfce7" />
                    <path d="M10 9h8l4 4v10H10z" fill="none" stroke="#166534" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {Math.max(1, Math.round(file.size / 1024))} KB, sheet {hasil.sheet}, {daftarPusat.length} pusat riset terdeteksi
                      {hasil.bulan ? `, bulan ${hasil.bulan}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full px-3 py-1.5 text-xs font-bold text-[#1f4e8c] hover:bg-[#eaf0fa]">
                    Ganti
                  </button>
                  <button type="button" onClick={reset} className="rounded-full px-3 py-1.5 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]">
                    Hapus
                  </button>
                </div>
              </div>
            )}

            {/* Pratinjau */}
            {hasil && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-2.5 pt-[18px]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="mr-1 text-base font-extrabold">Pratinjau data</span>
                    <Badge warna="bg-[#eaf0fa] text-[#1b3560]">{tampil.length} kegiatan</Badge>
                    <Badge warna={WARNA_BADGE.Siap}>{siap.length} siap</Badge>
                    <Badge warna={WARNA_BADGE.Cek}>{cekCount} perlu dicek</Badge>
                    <Badge warna={WARNA_BADGE.Kosong}>{kosongCount} kosong</Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    Baris kosong dilewati, baris yang perlu dicek diperbaiki dulu
                  </span>
                </div>
                <div className="px-6">
                  <Pratinjau grup={grup} />
                </div>
              </>
            )}

            {tersimpan !== null && (
              <p role="status" className="mx-6 mt-4 rounded-xl bg-[#dcfce7] px-4 py-2 text-sm font-semibold text-[#166534]">
                {tersimpan} kegiatan {menu} bulan {bulan} siap disimpan ke logbook.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 px-6 py-[18px]">
              <button type="button" onClick={reset} className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-[#f5f8fd]">
                Batal
              </button>
              <TombolGradasi besar onClick={simpan} disabled={!hasil || siap.length === 0 || tersimpan !== null}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
                Simpan ke Logbook
              </TombolGradasi>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}