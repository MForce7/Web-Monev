import { Fragment, useMemo, useState } from "react";
import type { UserOptions } from "jspdf-autotable";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import Dropdown from "../components/rekapitulasi/Dropdown.tsx";

import raw from "../data/kelompokriset.json";

/* ---------- Data: ada di src/data/kelompokriset.json ----------
   (Draft Kepka ORPA tentang Kelompok Riset Tahun 2026). File ini hanya menampilkan. */
type Periset = { nama: string; nip: string; keterangan: string; jabatan: string };
type Kelompok = { nama: string; anggota: Periset[] };
type PusatRiset = { nama: string; kelompok: Kelompok[] };

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

/** Pilihan dropdown dan lebarnya: mengikuti pilihan terpanjang (satuan ch) + ruang panah di kiri-kanan */
const OPSI_PUSAT = [SEMUA, ...DATA.map((p) => p.nama)];
const LEBAR_DROPDOWN = {
  width: `calc(${Math.max(...OPSI_PUSAT.map((o) => o.length))}ch + 4.75rem)`,
};

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

  // Warna keterangan: pimpinan biru, anggota abu-abu
  const WARNA_KET = {
    pimpinan: { fill: [232, 239, 251] as [number, number, number], teks: [27, 53, 96] as [number, number, number] },
    anggota: { fill: [241, 245, 249] as [number, number, number], teks: [27, 53, 96] as [number, number, number] },
  };

  autoTable(doc, {
    startY: 33,
    head: [KOLOM],
    body,
    margin: { left: 14, right: 14, bottom: 14 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [219, 230, 247], lineWidth: 0.2, textColor: [27, 53, 96], valign: "middle" },
    headStyles: { fillColor: [27, 63, 120], textColor: 255, halign: "center" },
    alternateRowStyles: { fillColor: [245, 248, 253] },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 68 },
      3: { cellWidth: 42, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
    },
    rowPageBreak: "avoid",
    didParseCell: (h) => {
      if (h.section === "body" && h.column.index === 4 && typeof h.cell.raw === "string") {
        const w = h.cell.raw === "Anggota" ? WARNA_KET.anggota : WARNA_KET.pimpinan;
        h.cell.styles.fillColor = w.fill;
        h.cell.styles.textColor = w.teks;
        h.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Nomor halaman
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(`Halaman ${i} dari ${n}`, lebar - 14, tinggi - 8, { align: "right" });
  }

  doc.save(namaFile);
}

/** Gaya dropdown kecil.
    .dd-kecil memperkecil tombol komponen Dropdown bersama (font 12px, satu baris)
    dan memberi ruang untuk panah di kanan, tanpa mengubah file Dropdown-nya.
    Teks yang terlalu panjang (hanya di layar sempit) dipotong dengan titik-titik. */
function GayaDropdown() {
  return (
    <style>{`
      .dd-kecil button[aria-haspopup="listbox"] {
        display: block !important;
        font-size: 12px !important;
        line-height: 2.25rem !important;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 2.25rem !important;
        padding-right: 2.25rem !important;
      }
    `}</style>
  );
}

function KelompokRisetTable() {
  const [pusat, setPusat] = useState(SEMUA);
  const [cari, setCari] = useState("");
  const [mencetak, setMencetak] = useState(false);

  const total = useMemo(
    () => ({
      kelompok: DATA.reduce((n, p) => n + p.kelompok.length, 0),
      periset: DATA.reduce((n, p) => n + p.kelompok.reduce((m, k) => m + k.anggota.length, 0), 0),
    }),
    [],
  );

  /** Terapkan filter pusat riset + pencarian. Nomor anggota dihitung sebelum difilter supaya tidak bergeser. */
  const tampil: PusatTampil[] = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return DATA.filter((p) => pusat === SEMUA || p.nama === pusat)
      .map((p) => ({
        nama: p.nama,
        kelompok: p.kelompok
          .map((k, idx) => {
            const semua = k.anggota.map((a, i) => ({ ...a, no: i + 1 }));
            const cocokKelompok = k.nama.toLowerCase().includes(q);
            return {
              nama: k.nama,
              no: idx + 1,
              anggota:
                q && !cocokKelompok
                  ? semua.filter((a) => [a.nama, a.nip, a.jabatan].some((t) => t.toLowerCase().includes(q)))
                  : semua,
            };
          })
          .filter((k) => k.anggota.length > 0),
      }))
      .filter((p) => p.kelompok.length > 0);
  }, [pusat, cari]);

  /** Cetak PDF sesuai filter yang sedang aktif */
  const cetak = async () => {
    if (mencetak) return;
    setMencetak(true);
    try {
      await cetakPdf(pusat, cari, tampil);
    } catch (err) {
      console.error(err);
      alert("PDF gagal dibuat. Coba lagi.");
    } finally {
      setMencetak(false);
    }
  };

  const td =
    "px-3 py-2 border-r border-b border-slate-200 align-top break-words text-xs font-normal leading-snug text-[#1b3560]";

  return (
    // Tanpa overflow-hidden di sini supaya daftar dropdown tidak terpotong; sudut bulat dipasang di header dan tabel
    <div className="bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 w-full max-w-full min-w-0">
      <GayaDropdown />

      <div className="p-4 bg-slate-50 border-b border-slate-200 rounded-t-3xl flex flex-wrap items-center gap-3">
        {/* Judul mengisi sisa ruang di kiri */}
        <h3 className="font-bold text-[#1b3560] text-sm min-w-[220px] flex-1">
          Kelompok Riset ORPA Tahun Anggaran 2026
          <span className="ml-2 text-xs font-normal text-slate-500">
            {total.kelompok} kelompok · {total.periset} periset
          </span>
        </h3>
        {/* Pencarian, dropdown, dan cetak selalu menempel di kanan */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari kelompok, nama, NIP, jabatan..."
            className="h-9 w-52 max-w-full px-4 border border-[#dbe6f7] rounded-full text-xs text-[#1b3560] bg-white focus:outline-none focus:border-[#2a5aa8] focus:ring-2 focus:ring-[#2a5aa8]/30"
          />
          <div className="dd-kecil max-w-full" style={LEBAR_DROPDOWN}>
            <Dropdown label="Semua Pusat Riset" options={OPSI_PUSAT} value={pusat} onChange={setPusat} />
          </div>
          <button
            type="button"
            onClick={cetak}
            disabled={mencetak}
            title="Unduh daftar sebagai PDF"
            className="h-9 px-4 hover:brightness-110 text-white rounded-full text-xs font-bold shadow-md transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
            style={{ background: GRAD_BIRU }}
          >
            {mencetak ? "Membuat PDF…" : "Cetak Daftar"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-b-3xl">
        <table className="w-full max-w-full table-fixed text-left text-xs font-normal leading-snug text-[#1b3560] border-collapse">
          <colgroup>
            {WIDTHS.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>

          <thead>
            <tr className="text-white text-center text-sm font-bold" style={{ background: GRAD_BIRU }}>
              {KOLOM.map((l) => (
                <th key={l} className={`px-3 py-3 text-sm font-bold border-r border-white/25 last:border-r-0 ${WRAP}`}>
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
                    className="px-3 py-2 text-white text-center text-xs font-bold uppercase tracking-wider"
                    style={{ background: GRAD_BIRU_TUA }}
                  >
                    {p.nama}
                  </td>
                </tr>
                {p.kelompok.map((k) =>
                  k.anggota.map((a, i) => (
                    <tr key={`${p.nama}-${k.nama}-${a.nip}`} className="hover:bg-[#eef3fb] transition-colors">
                      {i === 0 && (
                        <>
                          <td rowSpan={k.anggota.length} className={`${td} text-center bg-white`}>
                            {k.no}.
                          </td>
                          <td rowSpan={k.anggota.length} className={`${td} bg-white`}>
                            {k.nama}
                          </td>
                        </>
                      )}
                      <td className={td}>
                        <span className="text-slate-400 mr-1">{a.no}.</span>
                        {a.nama}
                      </td>
                      <td className={`${td} text-center`}>{a.nip}</td>
                      <td className={`${td} text-center`}>
                        <span
                          className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full border text-[11px] font-normal ${lencana(a.keterangan)}`}
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
    </div>
  );
}

/* ---------- Halaman ---------- */
export default function KelompokRisetPage() {
  return (
    <div className="mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden" translate="no">
      <InstansiBar />
      <div className="p-6 md:p-8">
        <KelompokRisetTable />
      </div>
    </div>
  );
}