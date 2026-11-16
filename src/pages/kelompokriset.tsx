import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { UserOptions } from "jspdf-autotable";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import Dropdown from "../components/rekapitulasi/Dropdown.tsx";
import { useState } from "react";

// import InstansiBar from "../components/rekapitulasi/InstansiBar";

import {
  GayaDropdown,
  KelompokRisetToolbar,
  KelompokRisetTable,
  ImportDataModal,
  useKelompokRiset,
  cetakPdf,
} from "../components/kelompokRiset";

/** Bentuk data setelah difilter (nomor anggota dan kelompok sudah dihitung) */
type AnggotaTampil = Periset & { no: number };
type KelompokTampil = { nama: string; no: number; anggota: AnggotaTampil[] };
type PusatTampil = { nama: string; kelompok: KelompokTampil[] };

const DATA: PusatRiset[] = (raw as { pusatRiset: PusatRiset[] }).pusatRiset;

/* ---------- Tampilan ----------
   Isi tabel text-xs, judul kolom text-sm bold, warna #1b3560. */
const GRAD_BIRU = "linear-gradient(90deg, #1c3d85 0%, #2a58a5 100%)";
const GRAD_BIRU_TUA = "linear-gradient(90deg, #14306b 0%, #1f468c 100%)";

/** Lebar kolom (%), total 100 */
const WIDTHS = [5, 20, 25, 15, 10, 25];
const KOLOM = ["No", "Nama Kelompok Riset", "Nama Periset", "NIP", "Keterangan", "Jabatan Fungsional"];
const SEMUA = "Semua Pusat Riset";

/** Kelas untuk teks header supaya bisa turun baris */
const WRAP = "break-words whitespace-normal";

/** Warna lencana keterangan: pimpinan kelompok biru, anggota abu-abu */
const LENCANA = {
  pimpinan: "bg-[#e8effb] text-[#1b3560] border-[#c3d3ee]",
  anggota: "bg-slate-100 text-[#1b3560] border-slate-200",
};
const lencana = (ket: string) => (ket === "Anggota" ? LENCANA.anggota : LENCANA.pimpinan);

/** Pilihan dropdown dan lebarnya: mengikuti pilihan terpanjang (satuan ch) + ruang panah di kiri-kanan.
    Dipasang lewat variabel CSS supaya hanya berlaku di layar sm ke atas; di HP dropdown selebar layar. */
const OPSI_PUSAT = [SEMUA, ...DATA.map((p) => p.nama)];
const LEBAR_DROPDOWN = {
  "--lebar-dd": `calc(${Math.max(...OPSI_PUSAT.map((o) => o.length))}ch + 4.75rem)`,
} as CSSProperties;

/* ---------- Cetak PDF (gaya sama dengan Rekap Pemantauan) ---------- */
async function cetakPdf(pusat: string, cari: string, data: PusatTampil[]) {
  // Dimuat saat dibutuhkan saja, supaya halaman tidak berat
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const lebar = doc.internal.pageSize.getWidth();
  const tinggi = doc.internal.pageSize.getHeight();
  const tglCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const namaFile = `Kelompok-Riset-${pusat.replace(/[^\w]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  const filter = [pusat, cari.trim() ? `Pencarian: "${cari.trim()}"` : ""].filter(Boolean).join("  ·  ");

  // Kop
  doc.setFillColor(27, 63, 120);
  doc.rect(0, 0, lebar, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Kelompok Riset ORPA Tahun Anggaran 2026", 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(filter, 14, 16.5);
  doc.text(`Dicetak ${tglCetak}`, lebar - 14, 16.5, { align: "right" });

  if (data.length === 0) {
    doc.setTextColor(27, 53, 96);
    doc.setFontSize(10);
    doc.text("Belum ada data kelompok riset untuk filter ini.", 14, 34);
    doc.save(namaFile);
    return;
  }

  // Ringkasan
  const jmlKelompok = data.reduce((n, p) => n + p.kelompok.length, 0);
  const jmlPeriset = data.reduce((n, p) => n + p.kelompok.reduce((m, k) => m + k.anggota.length, 0), 0);
  doc.setTextColor(27, 53, 96);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Pusat riset: ${data.length}    Kelompok: ${jmlKelompok}    Periset: ${jmlPeriset}`, 14, 29);

  // Tabel: No dan Nama Kelompok digabung (rowSpan) seperti di layar
  const body: NonNullable<UserOptions["body"]> = [];
  data.forEach((p) => {
    body.push([
      {
        content: p.nama.toUpperCase(),
        colSpan: KOLOM.length,
        styles: { halign: "center", fillColor: [31, 70, 140], textColor: 255, fontStyle: "bold" },
      },
    ]);
    p.kelompok.forEach((k) => {
      k.anggota.forEach((a, i) => {
        const baris: NonNullable<UserOptions["body"]>[number] = [];
        if (i === 0) {
          baris.push(
            { content: `${k.no}.`, rowSpan: k.anggota.length, styles: { halign: "center", valign: "top", fillColor: [255, 255, 255] } },
            { content: k.nama, rowSpan: k.anggota.length, styles: { valign: "top", fillColor: [255, 255, 255] } },
          );
        }
        baris.push(`${a.no}. ${a.nama}`, a.nip, a.keterangan, a.jabatan);
        body.push(baris);
      });
    });
  });
export default function KelompokRisetPage() {
  const [mencetak, setMencetak] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const {
    modeEdit,

    pusat,
    setPusat,

    cari,
    setCari,

    tampil,
    total,

    opsiPusat,
    opsiKelompok,

/** Tombol panah bulat untuk menggeser tabel */
function TombolPanah({ arah, onClick }: { arah: "kiri" | "kanan"; onClick: () => void }) {
  const kanan = arah === "kanan";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={kanan ? "Geser ke kanan" : "Geser ke kiri"}
      className={`absolute top-28 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-xl font-bold leading-none shadow-[0_2px_10px_rgba(27,63,120,0.4)] transition ${
        kanan
          ? "right-2 animate-pulse bg-[#2a5aa8] text-white hover:bg-[#1b3f78]"
          : "left-2 bg-white text-[#2a5aa8] hover:bg-[#eaf0fa]"
      }`}
    >
      {kanan ? "›" : "‹"}
    </button>
  );
}

function KelompokRisetTable() {
  const [pusat, setPusat] = useState(SEMUA);
  const [cari, setCari] = useState("");
  const [mencetak, setMencetak] = useState(false);

  /* ----- petunjuk geser (tampil hanya kalau tabel memang bisa digeser) ----- */
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
    const tabel = el.firstElementChild;
    if (tabel) ro.observe(tabel);
    window.addEventListener("resize", cek);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", cek);
    };
  }, [cek]);

  const geser = (arah: 1 | -1) => ref.current?.scrollBy({ left: arah * 320, behavior: "smooth" });
  const bisaScroll = bisaKiri || bisaKanan;

  const total = useMemo(
    () => ({
      kelompok: DATA.reduce((n, p) => n + p.kelompok.length, 0),
      periset: DATA.reduce((n, p) => n + p.kelompok.reduce((m, k) => m + k.anggota.length, 0), 0),
    }),
    [],
  );
    mulaiEdit,
    batalEdit,
    simpanEdit,

    updatePeriset,
    tambahPeriset,
    hapusPeriset,
    gantiKoordinator,
    pindahPeriset,
  } = useKelompokRiset();

  async function handleCetak() {
    if (mencetak || modeEdit) return;

    try {
      setMencetak(true);
      await cetakPdf(pusat, cari, tampil);
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      alert("PDF gagal dibuat. Silakan coba kembali.");
    } finally {
      setMencetak(false);
    }
  }

  return (
    // Tanpa overflow-hidden di sini supaya daftar dropdown tidak terpotong; sudut bulat dipasang di header dan isi
    <div className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.10)] sm:rounded-3xl">
      <GayaDropdown />

      {/* Toolbar: HP menumpuk penuh, tablet ke atas berjajar di kanan */}
      <div className="flex flex-col gap-3 rounded-t-2xl border-b border-slate-200 bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:rounded-t-3xl sm:p-4">
        <h3 className="min-w-0 text-sm font-bold text-[#1b3560] sm:min-w-[220px] sm:flex-1">
          Kelompok Riset ORPA Tahun Anggaran 2026
          <span className="block text-xs font-normal text-slate-500 sm:ml-2 sm:inline">
            {total.kelompok} kelompok · {total.periset} periset
          </span>
        </h3>

        <div className="flex min-w-0 flex-col gap-2 sm:ml-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari kelompok, nama, NIP, jabatan..."
            className="h-10 w-full min-w-0 rounded-full border border-[#dbe6f7] bg-white px-4 text-xs text-[#1b3560] focus:border-[#2a5aa8] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]/30 sm:h-9 sm:w-52"
          />
          <div className="dd-kecil w-full min-w-0 sm:w-[var(--lebar-dd)] sm:max-w-full" style={LEBAR_DROPDOWN}>
            <Dropdown label="Semua Pusat Riset" options={OPSI_PUSAT} value={pusat} onChange={setPusat} />
          </div>
          <button
            type="button"
            onClick={cetak}
            disabled={mencetak}
            title="Unduh daftar sebagai PDF"
            className="h-10 w-full rounded-full px-4 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 sm:h-9 sm:w-auto"
            style={{ background: GRAD_BIRU }}
          >
            {mencetak ? "Membuat PDF…" : "Cetak Daftar"}
          </button>
        </div>
      </div>

      {/* ───── HP (di bawah 768px): daftar kartu per kelompok ───── */}
      <div className="space-y-4 rounded-b-2xl p-3 md:hidden">
        {tampil.map((p) => (
          <div key={p.nama}>
            <p
              className="rounded-lg px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white"
              style={{ background: GRAD_BIRU_TUA }}
            >
              {p.nama}
            </p>

            <div className="mt-2 space-y-3">
              {p.kelompok.map((k) => (
                <div key={`${p.nama}-${k.nama}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-start gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-bold text-[#1b3560]">{k.no}.</span>
                    <span className="min-w-0 break-words text-sm font-bold text-[#1b3560]">{k.nama}</span>
                  </div>

                  <ul className="divide-y divide-slate-100">
                    {k.anggota.map((a) => (
                      <li key={`${k.nama}-${a.nip}`} className="px-3 py-2.5 text-xs text-[#1b3560]">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 break-words font-semibold">
                            <span className="mr-1 font-normal text-slate-400">{a.no}.</span>
                            {a.nama}
                          </p>
                          <span
                            className={`inline-block shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-normal ${lencana(a.keterangan)}`}
                          >
                            {a.keterangan}
                          </span>
                        </div>
                        <p className="mt-1 break-all text-slate-500">NIP {a.nip}</p>
                        <p className="mt-0.5 break-words text-slate-600">{a.jabatan}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {tampil.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">Tidak ada data yang cocok dengan pencarian.</p>
        )}
      </div>

      {/* ───── Tablet / desktop (768px ke atas): tabel ───── */}
      <div className="hidden overflow-hidden rounded-b-3xl md:block">
        {/* Bar petunjuk: hanya muncul kalau tabel memang bisa digeser */}
        {bisaScroll && (
          <p className="flex items-center justify-center gap-2 border-b border-slate-200 bg-[#eaf0fa] px-3 py-1.5 text-[11px] font-bold text-[#2a5aa8]">
            {bisaKiri && <span aria-hidden>←</span>}
            Geser tabel ke samping untuk melihat semua kolom
            {bisaKanan && (
              <span aria-hidden className="animate-pulse">
                →
              </span>
            )}
          </p>
        )}

        <div className="relative">
          <div
            ref={ref}
            onScroll={cek}
            className="overflow-x-auto overscroll-x-contain [scrollbar-color:#2a5aa8_#eaf0fa] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#eaf0fa] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a5aa8]"
          >
            <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-xs font-normal leading-snug text-[#1b3560] lg:min-w-0">
              <colgroup>
                {WIDTHS.map((w, i) => (
                  <col key={i} style={{ width: `${w}%` }} />
                ))}
              </colgroup>

              <thead>
                <tr className="text-center text-sm font-bold text-white" style={{ background: GRAD_BIRU }}>
                  {KOLOM.map((l) => (
                    <th key={l} className={`border-r border-white/25 px-3 py-3 text-sm font-bold last:border-r-0 ${WRAP}`}>
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tampil.map((p) => (
                  <Fragment key={p.nama}>
                    <tr>
                      <td
                        colSpan={KOLOM.length}
                        className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white"
                        style={{ background: GRAD_BIRU_TUA }}
                      >
                        {p.nama}
                      </td>
                    </tr>
                    {p.kelompok.map((k) =>
                      k.anggota.map((a, i) => (
                        <tr key={`${p.nama}-${k.nama}-${a.nip}`} className="transition-colors hover:bg-[#eef3fb]">
                          {i === 0 && (
                            <>
                              <td rowSpan={k.anggota.length} className={`${td} bg-white text-center`}>
                                {k.no}.
                              </td>
                              <td rowSpan={k.anggota.length} className={`${td} bg-white`}>
                                {k.nama}
                              </td>
                            </>
                          )}
                          <td className={td}>
                            <span className="mr-1 text-slate-400">{a.no}.</span>
                            {a.nama}
                          </td>
                          <td className={`${td} text-center`}>{a.nip}</td>
                          <td className={`${td} text-center`}>
                            <span
                              className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-normal ${lencana(a.keterangan)}`}
                            >
                              {a.keterangan}
                            </span>
                          </td>
                          <td className={`${td} border-r-0`}>{a.jabatan}</td>
                        </tr>
                      )),
                    )}
                  </Fragment>
                ))}

                {tampil.length === 0 && (
                  <tr>
                    <td colSpan={KOLOM.length} className="p-6 text-center text-xs text-slate-500">
                      Tidak ada data yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inner shadow di tepi + tombol panah */}
          {bisaKanan && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[#1b3f78]/35 to-transparent" />
              <TombolPanah arah="kanan" onClick={() => geser(1)} />
            </>
          )}
          {bisaKiri && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[#1b3f78]/35 to-transparent" />
              <TombolPanah arah="kiri" onClick={() => geser(-1)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Halaman ---------- */
export default function KelompokRisetPage() {
  return (
    <div className="mt-20 min-h-screen w-full max-w-full overflow-x-hidden bg-[#f4f4f4]" translate="no">
      <InstansiBar />
      <div className="min-w-0 p-3 sm:p-6 md:p-8">
        <KelompokRisetTable />
  async function handleImportFile(file: File) {
    console.log("File yang akan diimport:", file);

    // TODO:
    // Hubungkan ke Supabase Edge Function.
    // Kirim file ke Gemini untuk dikonversi menjadi JSON.
    // Validasi hasil JSON sebelum memperbarui data.

    throw new Error(
      "Integrasi Gemini dan Supabase belum dihubungkan.",
    );
  }

  return (
    <div
      className="mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden"
      translate="no"
    >
      {/* <InstansiBar /> */}

      <div className="p-6 md:p-8">
        <div className="bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 w-full max-w-full min-w-0">
          <GayaDropdown />

          <KelompokRisetToolbar
            pusat={pusat}
            setPusat={setPusat}
            cari={cari}
            setCari={setCari}
            total={total}
            opsiPusat={opsiPusat}
            modeEdit={modeEdit}
            mencetak={mencetak}
            onMulaiEdit={mulaiEdit}
            onBatalEdit={batalEdit}
            onSimpanEdit={simpanEdit}
            onUpdateData={() => setShowImport(true)}
            onCetak={handleCetak}
          />

          <KelompokRisetTable
            tampil={tampil}
            modeEdit={modeEdit}
            opsiKelompok={opsiKelompok}
            onUpdate={updatePeriset}
            onTambah={tambahPeriset}
            onHapus={hapusPeriset}
            onKoordinator={gantiKoordinator}
            onPindah={pindahPeriset}
          />

          <ImportDataModal
            open={showImport}
            onClose={() => setShowImport(false)}
            onImport={handleImportFile}
          />
        </div>
      </div>
    </div>
  );
}