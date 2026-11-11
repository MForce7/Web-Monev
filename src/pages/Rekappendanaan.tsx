import { Fragment, useMemo, useState } from "react";
import type { UserOptions } from "jspdf-autotable";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import Dropdown from "../components/rekapitulasi/Dropdown.tsx";
import raw from "../data/rekappendanaan.json";

/* ---------- Data: isi awal ada di src/data/rekappendanaan.json ----------
   (Rekap pendanaan PRIS dan RIIM ORPA). Isi tabel bisa diubah lewat tombol "Ubah" di tiap baris. */
type Skema = "PRIS" | "RIIM";
type Kegiatan = {
  no: number;
  skema: Skema;
  jenis: string;
  ketua: string;
  judul: string;
  pusatRiset: string;
  jangkaBulan: number | null;
  dana: (number | null)[]; // Tahun 1, 2, 3, ... (bisa lebih dari 3)
  total: number;
  nomorSK: string;
  tanggalSK: string; // "2026-08-04" atau teks bebas
  status: string;
  keterangan: string;
  link: string;
  /** Tulisan yang ditampilkan untuk tautan (kosong = "Folder dokumen") */
  linkLabel?: string;
};
type Grup = { skema: Skema; list: Kegiatan[] };

const DATA: Kegiatan[] = (raw as { pendanaan: Kegiatan[] }).pendanaan;

/* ---------- Tampilan ----------
   Isi tabel text-xs, judul kolom text-sm bold, warna #1b3560. */
const GRAD_BIRU = "linear-gradient(90deg, #1c3d85 0%, #2a58a5 100%)";
const GRAD_BIRU_TUA = "linear-gradient(90deg, #14306b 0%, #1f468c 100%)";

/** Jumlah kolom dana tahun minimal */
const MIN_TAHUN = 3;
/** Kolom sebelum dan sesudah kolom dana tahun */
const KOLOM_AWAL = ["No", "Ketua Periset", "Judul", "Pusat Riset", "Jenis / Gelombang", "Jangka (Bln)"];
const KOLOM_AKHIR = ["Total Pendanaan (Rp)", "Nomor SK", "Status / Keterangan", "Tindakan", "Upload Data Dukung"];

const SEMUA_SKEMA = "Semua Skema";
const SEMUA_PUSAT = "Semua Pusat Riset";
const URUTAN_SKEMA: Skema[] = ["PRIS", "RIIM"];
const NAMA_SKEMA: Record<Skema, string> = {
  PRIS: "PRIS — Riset Inovasi Strategis",
  RIIM: "RIIM — Riset dan Inovasi untuk Indonesia Maju",
};

const LENCANA: Record<Skema, string> = {
  PRIS: "bg-[#e8effb] text-[#1f468c] border-[#c3d3ee]",
  RIIM: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Gaya kotak isian saat mengubah baris */
const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs leading-snug text-[#1b3560] focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30";

/** Lebar dropdown mengikuti pilihan terpanjang (satuan ch) + ruang panah di kiri-kanan */
const lebarDropdown = (opsi: string[]) => ({
  width: `calc(${Math.max(...opsi.map((o) => o.length))}ch + 4.75rem)`,
});

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const rupiah = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("id-ID") : "—");
const tanggal = (t: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : t || "—";
};
const ukuranFile = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const jumlah = (list: Kegiatan[], t: number) => list.reduce((n, k) => n + (k.dana[t] ?? 0), 0);
const hitungTotal = (dana: (number | null)[]) => dana.reduce<number>((n, v) => n + (v ?? 0), 0);
/** Buang termin kosong di ujung, tapi sisakan minimal MIN_TAHUN */
const rapikanDana = (dana: (number | null)[]) => {
  const hasil = [...dana];
  while (hasil.length > MIN_TAHUN && hasil[hasil.length - 1] == null) hasil.pop();
  return hasil;
};
/** "1.500.000" -> 1500000, kosong -> null */
const angkaDari = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d ? Number(d) : null;
};
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- Cetak PDF (gaya sama dengan Rekap Pemantauan) ---------- */
async function cetakPdf(opsi: {
  grup: Grup[];
  semua: Kegiatan[];
  nTahun: number;
  skema: string;
  pusat: string;
  cari: string;
}) {
  const { grup, semua, nTahun, skema, pusat, cari } = opsi;
  // Dimuat saat dibutuhkan saja, supaya halaman tidak berat
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const lebar = doc.internal.pageSize.getWidth();
  const tinggi = doc.internal.pageSize.getHeight();
  const tglCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const aman = (s: string) => s.replace(/[^\w]+/g, "-");

  const filter = [skema, pusat, cari.trim() ? `Pencarian: "${cari.trim()}"` : ""].filter(Boolean).join("  ·  ");

  // Kop
  doc.setFillColor(27, 63, 120);
  doc.rect(0, 0, lebar, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Rekap Pendanaan PRIS dan RIIM ORPA", 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(filter, 14, 16.5);
  doc.text(`Dicetak ${tglCetak}`, lebar - 14, 16.5, { align: "right" });

  const namaFile = `Rekap-Pendanaan-${aman(skema)}-${aman(pusat)}-${new Date().toISOString().slice(0, 10)}.pdf`;

  if (semua.length === 0) {
    doc.setTextColor(27, 53, 96);
    doc.setFontSize(10);
    doc.text("Belum ada data pendanaan untuk filter ini.", 14, 34);
    doc.save(namaFile);
    return;
  }

  // Ringkasan
  const perSkema = URUTAN_SKEMA.map((s) => `${s}: ${semua.filter((k) => k.skema === s).length}`).join("    ");
  const totalSemua = semua.reduce((n, k) => n + k.total, 0);
  doc.setTextColor(27, 53, 96);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Kegiatan: ${semua.length}    ${perSkema}    Total pendanaan: Rp ${rupiah(totalSemua)}`, 14, 29);

  // Tabel
  const indeks = Array.from({ length: nTahun }, (_, i) => i);
  const jmlKolom = KOLOM_AWAL.length + nTahun + 3;
  const head = [[...KOLOM_AWAL, ...indeks.map((i) => `Dana Tahun ${i + 1} (Rp)`), "Total Pendanaan (Rp)", "Nomor SK", "Status / Keterangan"]];

  const body: NonNullable<UserOptions["body"]> = [];
  grup.forEach((g) => {
    body.push([
      {
        content: NAMA_SKEMA[g.skema].toUpperCase(),
        colSpan: jmlKolom,
        styles: { halign: "center", fillColor: [31, 70, 140], textColor: 255, fontStyle: "bold" },
      },
    ]);
    g.list.forEach((k) => {
      body.push([
        String(k.no),
        k.ketua,
        k.judul,
        k.pusatRiset,
        k.jenis,
        k.jangkaBulan == null ? "—" : String(k.jangkaBulan),
        ...indeks.map((i) => rupiah(k.dana[i])),
        rupiah(k.total),
        `${k.nomorSK || "—"}\n${tanggal(k.tanggalSK)}`,
        `${k.status || "—"}${k.keterangan ? `\n${k.keterangan}` : ""}`,
      ]);
    });
    const subStyle = { fillColor: [232, 239, 251] as [number, number, number], textColor: [27, 53, 96] as [number, number, number], fontStyle: "bold" as const, halign: "right" as const };
    body.push([
      { content: `Total ${g.skema} · ${g.list.length} kegiatan`, colSpan: KOLOM_AWAL.length, styles: subStyle },
      ...indeks.map((i) => ({ content: rupiah(jumlah(g.list, i)), styles: subStyle })),
      { content: rupiah(g.list.reduce((n, k) => n + k.total, 0)), styles: subStyle },
      { content: "", colSpan: 2, styles: subStyle },
    ]);
  });

  if (grup.length > 1) {
    const totStyle = { fillColor: [27, 63, 120] as [number, number, number], textColor: 255 as const, fontStyle: "bold" as const, halign: "right" as const };
    body.push([
      { content: `Total seluruhnya · ${semua.length} kegiatan`, colSpan: KOLOM_AWAL.length, styles: totStyle },
      ...indeks.map((i) => ({ content: rupiah(jumlah(semua, i)), styles: totStyle })),
      { content: rupiah(totalSemua), styles: totStyle },
      { content: "", colSpan: 2, styles: totStyle },
    ]);
  }

  // Lebar kolom angka dikunci; Ketua, Judul, Pusat Riset, dan Status menyesuaikan sisanya
  const kolomStyle: NonNullable<UserOptions["columnStyles"]> = {
    0: { cellWidth: 8, halign: "center" },
    4: { cellWidth: 18, halign: "center" },
    5: { cellWidth: 11, halign: "center" },
  };
  indeks.forEach((i) => (kolomStyle[6 + i] = { cellWidth: 19, halign: "right" }));
  kolomStyle[6 + nTahun] = { cellWidth: 21, halign: "right" };
  kolomStyle[7 + nTahun] = { cellWidth: 25 };

  autoTable(doc, {
    startY: 33,
    head,
    body,
    margin: { left: 8, right: 8, bottom: 14 },
    styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [219, 230, 247], lineWidth: 0.2, textColor: [27, 53, 96], valign: "top" },
    headStyles: { fillColor: [27, 63, 120], textColor: 255, halign: "center", valign: "middle", fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 248, 253] },
    columnStyles: kolomStyle,
    rowPageBreak: "avoid",
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

interface Props {
  /** Dipanggil setiap kali isi tabel diubah / dihapus (mis. untuk disimpan ke database) */
  onSave?(data: Kegiatan[]): void;
}

function RekapPendanaanTable({ onSave }: Props) {
  const [rows, setRows] = useState<Kegiatan[]>(DATA);
  const [skema, setSkema] = useState(SEMUA_SKEMA);
  const [pusat, setPusat] = useState(SEMUA_PUSAT);
  const [cari, setCari] = useState("");
  const [mencetak, setMencetak] = useState(false);
  /** Baris yang sedang diubah + salinan kerjanya */
  const [edit, setEdit] = useState<number | null>(null);
  const [draft, setDraft] = useState<Kegiatan | null>(null);
  /** Berkas data dukung yang dipilih, per nomor kegiatan. Disimpan di memori (hilang saat halaman dimuat ulang). */
  const [berkas, setBerkas] = useState<Record<number, File[]>>({});

  /** Jumlah kolom dana tahun: minimal 3, atau sebanyak termin terpanjang di data (termasuk baris yang sedang diubah) */
  const nTahun = useMemo(
    () => Math.max(MIN_TAHUN, ...rows.map((r) => r.dana.length), draft?.dana.length ?? 0),
    [rows, draft],
  );
  const indeksTahun = useMemo(() => Array.from({ length: nTahun }, (_, i) => i), [nTahun]);

  const kolom = useMemo(
    () => [...KOLOM_AWAL, ...indeksTahun.map((i) => `Dana Tahun ${i + 1} (Rp)`), ...KOLOM_AKHIR],
    [indeksTahun],
  );

  const daftarPusat = useMemo(() => Array.from(new Set(rows.map((k) => k.pusatRiset).filter(Boolean))), [rows]);
  const opsiSkema = useMemo(() => [SEMUA_SKEMA, ...URUTAN_SKEMA], []);
  const opsiPusat = useMemo(() => [SEMUA_PUSAT, ...daftarPusat], [daftarPusat]);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return rows
      .filter((k) => (skema === SEMUA_SKEMA || k.skema === skema) && (pusat === SEMUA_PUSAT || k.pusatRiset === pusat))
      .filter(
        (k) =>
          !q || [k.ketua, k.judul, k.pusatRiset, k.jenis, k.nomorSK, k.status, k.keterangan].some((t) => (t ?? "").toLowerCase().includes(q)),
      );
  }, [rows, skema, pusat, cari]);

  const grup: Grup[] = URUTAN_SKEMA.map((s) => ({ skema: s, list: tampil.filter((k) => k.skema === s) })).filter((g) => g.list.length > 0);

  /* ----- cetak PDF ----- */
  const cetak = async () => {
    if (mencetak) return;
    setMencetak(true);
    try {
      await cetakPdf({ grup, semua: tampil, nTahun, skema, pusat, cari });
    } catch (err) {
      console.error(err);
      alert("PDF gagal dibuat. Coba lagi.");
    } finally {
      setMencetak(false);
    }
  };

  /* ----- ubah / simpan / hapus ----- */
  const mulaiUbah = (k: Kegiatan) => {
    setEdit(k.no);
    setDraft({ ...k, dana: [...k.dana] });
  };
  const batalUbah = () => {
    setEdit(null);
    setDraft(null);
  };
  const simpan = () => {
    if (!draft) return;
    const dana = rapikanDana(draft.dana);
    const baru: Kegiatan = {
      ...draft,
      ketua: draft.ketua.trim(),
      judul: draft.judul.trim(),
      dana,
      total: hitungTotal(dana), // total selalu = jumlah seluruh termin
    };
    const next = rows.map((r) => (r.no === baru.no ? baru : r));
    setRows(next);
    onSave?.(next);
    batalUbah();
  };
  const hapus = (k: Kegiatan) => {
    if (!window.confirm(`Hapus kegiatan "${k.judul}"?`)) return;
    const next = rows.filter((r) => r.no !== k.no);
    setRows(next);
    onSave?.(next);
    setBerkas((b) => {
      const sisa = { ...b };
      delete sisa[k.no];
      return sisa;
    });
    if (edit === k.no) batalUbah();
  };
  const ubah = <F extends keyof Kegiatan>(f: F, v: Kegiatan[F]) => setDraft((d) => (d ? { ...d, [f]: v } : d));
  const ubahDana = (i: number, s: string) =>
    setDraft((d) => {
      if (!d) return d;
      const dana = Array.from({ length: Math.max(d.dana.length, i + 1) }, (_, idx) => d.dana[idx] ?? null);
      dana[i] = angkaDari(s);
      return { ...d, dana };
    });
  /** Tambah termin baru (kolom Dana Tahun berikutnya) */
  const tambahTahun = () =>
    setDraft((d) => {
      if (!d) return d;
      const dana = Array.from({ length: nTahun }, (_, i) => d.dana[i] ?? null);
      return { ...d, dana: [...dana, null] };
    });
  /** Hapus termin terakhir, hanya kalau kosong dan masih di atas minimal 3 */
  const kurangiTahun = () =>
    setDraft((d) => (d ? { ...d, dana: d.dana.slice(0, Math.max(MIN_TAHUN, nTahun - 1)) } : d));

  /* ----- berkas data dukung ----- */
  const tambahBerkas = (no: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    // TODO: kirim ke penyimpanan (mis. Supabase lewat lib/uploadSupportFile) lalu simpan alamat file-nya
    setBerkas((b) => ({ ...b, [no]: [...(b[no] ?? []), ...Array.from(files)] }));
  };
  const hapusBerkas = (no: number, idx: number) =>
    setBerkas((b) => ({ ...b, [no]: (b[no] ?? []).filter((_, i) => i !== idx) }));

  const td = "px-3 py-2 border-r border-b border-slate-200 align-top";
  const angka = `${td} text-right tabular-nums whitespace-nowrap`;

  /** Kolom upload: dipakai baris biasa maupun baris yang sedang diubah */
  const selUpload = (k: Kegiatan) => (
    <td className={`${td} border-r-0 min-w-[220px]`} onClick={(e) => e.stopPropagation()}>
      <label
        className="inline-block cursor-pointer rounded-full px-3.5 py-1 text-[11px] font-bold text-white shadow-md transition hover:brightness-110"
        style={{ background: GRAD_BIRU }}
      >
        Pilih file
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            tambahBerkas(k.no, e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <ul className="mt-2 space-y-1">
        {/* Tautan folder dokumen yang sudah ada di data */}
        {k.link && (
          <li className="flex items-center gap-1.5 rounded-lg bg-[#eef3fb] px-2 py-1">
            <a
              href={k.link}
              target="_blank"
              rel="noreferrer"
              title={k.link}
              className="max-w-[190px] truncate text-[#2a58a5] underline"
            >
              {k.linkLabel || "Folder dokumen"}
            </a>
          </li>
        )}
        {/* File yang sudah ditambahkan lewat tombol Pilih file (klik nama untuk membukanya) */}
        {(berkas[k.no] ?? []).map((f, i) => (
          <li key={`${f.name}-${i}`} className="flex items-center gap-1.5 rounded-lg bg-[#eef3fb] px-2 py-1">
            <button
              type="button"
              onClick={() => window.open(URL.createObjectURL(f), "_blank")}
              className="max-w-[150px] truncate text-left text-[#2a58a5] underline"
              title={`Buka ${f.name}`}
            >
              {f.name}
            </button>
            <span className="shrink-0 text-slate-500">{ukuranFile(f.size)}</span>
            <button
              type="button"
              onClick={() => hapusBerkas(k.no, i)}
              aria-label={`Hapus ${f.name}`}
              className="ml-auto shrink-0 rounded-full px-1.5 font-bold text-slate-500 hover:bg-white hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </td>
  );

  return (
    // Tanpa overflow-hidden di sini supaya daftar dropdown tidak terpotong; sudut bulat dipasang di header dan tabel
    <div className="bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 w-full max-w-full min-w-0">
      <GayaDropdown />

      <div className="p-4 bg-slate-50 border-b border-slate-200 rounded-t-3xl flex flex-wrap items-center gap-3">
        {/* Judul mengisi sisa ruang di kiri */}
        <h3 className="font-bold text-[#1b3560] text-sm min-w-[220px] flex-1">
          Rekap Pendanaan PRIS dan RIIM ORPA
          <span className="ml-2 text-xs font-normal text-slate-500">{rows.length} kegiatan</span>
        </h3>
        {/* Pencarian, dropdown, dan cetak selalu menempel di kanan */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari ketua, judul, nomor SK..."
            className="h-9 w-52 max-w-full px-4 border border-[#dbe6f7] rounded-full text-xs text-[#1b3560] bg-white focus:outline-none focus:border-[#2a5aa8] focus:ring-2 focus:ring-[#2a5aa8]/30"
          />
          <div className="dd-kecil max-w-full" style={lebarDropdown(opsiSkema)}>
            <Dropdown label="Semua Skema" options={opsiSkema} value={skema} onChange={setSkema} />
          </div>
          <div className="dd-kecil max-w-full" style={lebarDropdown(opsiPusat)}>
            <Dropdown label="Semua Pusat Riset" options={opsiPusat} value={pusat} onChange={setPusat} />
          </div>
          <button
            type="button"
            onClick={cetak}
            disabled={mencetak}
            title="Unduh rekap sebagai PDF"
            className="h-9 px-4 hover:brightness-110 text-white rounded-full text-xs font-bold shadow-md transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
            style={{ background: GRAD_BIRU }}
          >
            {mencetak ? "Membuat PDF…" : "Cetak Rekap"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-b-3xl">
        <table className="w-max min-w-full text-left text-xs leading-snug text-[#1b3560] border-collapse">
          <thead>
            <tr className="text-white text-center text-sm font-bold" style={{ background: GRAD_BIRU }}>
              {kolom.map((l) => (
                <th key={l} className="p-3 px-3 text-sm border-r border-white/25 last:border-r-0 whitespace-nowrap">
                  {l}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {grup.map((g) => (
              <Fragment key={g.skema}>
                <tr>
                  <td
                    colSpan={kolom.length}
                    className="p-2 text-white text-center text-xs font-bold uppercase tracking-wider"
                    style={{ background: GRAD_BIRU_TUA }}
                  >
                    {NAMA_SKEMA[g.skema]}
                  </td>
                </tr>

                {g.list.map((k) => {
                  /* ===== Baris sedang diubah ===== */
                  if (edit === k.no && draft) {
                    const d = draft;
                    const bisaKurangi = nTahun > MIN_TAHUN && d.dana[nTahun - 1] == null;
                    return (
                      <Fragment key={k.no}>
                        <tr className="bg-[#f5f8fd]">
                          <td className={`${td} text-center whitespace-nowrap`}>{k.no}</td>
                          <td className={`${td} min-w-[170px]`}>
                            <input className={INPUT} value={d.ketua} onChange={(e) => ubah("ketua", e.target.value)} aria-label="Ketua periset" />
                          </td>
                          <td className={`${td} min-w-[300px] max-w-[420px]`}>
                            <textarea className={INPUT} rows={4} value={d.judul} onChange={(e) => ubah("judul", e.target.value)} aria-label="Judul" />
                          </td>
                          <td className={`${td} min-w-[150px]`}>
                            <select className={INPUT} value={d.pusatRiset} onChange={(e) => ubah("pusatRiset", e.target.value)} aria-label="Pusat riset">
                              {(daftarPusat.includes(d.pusatRiset) ? daftarPusat : [d.pusatRiset, ...daftarPusat]).map((p) => (
                                <option key={p}>{p}</option>
                              ))}
                            </select>
                          </td>
                          <td className={`${td} min-w-[150px]`}>
                            <select className={`${INPUT} mb-1`} value={d.skema} onChange={(e) => ubah("skema", e.target.value as Skema)} aria-label="Skema">
                              {URUTAN_SKEMA.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                            <input className={INPUT} value={d.jenis} onChange={(e) => ubah("jenis", e.target.value)} aria-label="Jenis atau gelombang" />
                          </td>
                          <td className={`${td} min-w-[70px]`}>
                            <input
                              className={`${INPUT} text-center`}
                              inputMode="numeric"
                              value={d.jangkaBulan ?? ""}
                              onChange={(e) => ubah("jangkaBulan", angkaDari(e.target.value))}
                              aria-label="Jangka waktu (bulan)"
                            />
                          </td>
                          {indeksTahun.map((i) => (
                            <td key={i} className={`${td} min-w-[130px]`}>
                              <input
                                className={`${INPUT} text-right tabular-nums`}
                                inputMode="numeric"
                                value={d.dana[i] == null ? "" : d.dana[i]!.toLocaleString("id-ID")}
                                onChange={(e) => ubahDana(i, e.target.value)}
                                aria-label={`Dana tahun ${i + 1}`}
                              />
                            </td>
                          ))}
                          <td className={`${angka} font-bold`} title="Dihitung otomatis dari seluruh dana tahun">
                            {rupiah(hitungTotal(d.dana))}
                          </td>
                          <td className={`${td} min-w-[150px]`}>
                            <input className={`${INPUT} mb-1`} value={d.nomorSK} onChange={(e) => ubah("nomorSK", e.target.value)} placeholder="Nomor SK" aria-label="Nomor SK" />
                            <input
                              className={INPUT}
                              type={ISO.test(d.tanggalSK) || !d.tanggalSK ? "date" : "text"}
                              value={d.tanggalSK}
                              onChange={(e) => ubah("tanggalSK", e.target.value)}
                              aria-label="Tanggal SK"
                            />
                          </td>
                          <td className={`${td} min-w-[260px] max-w-[320px]`}>
                            <span className="mb-0.5 block font-bold">Status</span>
                            <textarea className={`${INPUT} mb-2`} rows={3} value={d.status} onChange={(e) => ubah("status", e.target.value)} aria-label="Status" />
                            <span className="mb-0.5 block font-bold">Keterangan</span>
                            <textarea className={INPUT} rows={3} value={d.keterangan} onChange={(e) => ubah("keterangan", e.target.value)} aria-label="Keterangan" />
                          </td>
                          <td className={`${td} whitespace-nowrap`}>
                            <button
                              type="button"
                              onClick={simpan}
                              className="mb-1 block w-full rounded-full px-3.5 py-1 text-[11px] font-bold text-white shadow-md hover:brightness-110"
                              style={{ background: GRAD_BIRU }}
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={batalUbah}
                              className="mb-3 block w-full rounded-full border border-slate-300 bg-white px-3.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={tambahTahun}
                              className="mb-1 block w-full rounded-full border border-[#2a58a5] bg-white px-3.5 py-1 text-[11px] font-bold text-[#1f468c] hover:bg-[#eef3fb]"
                            >
                              + Tahun
                            </button>
                            <button
                              type="button"
                              onClick={kurangiTahun}
                              disabled={!bisaKurangi}
                              title={bisaKurangi ? "Hapus termin terakhir" : "Hanya bisa jika termin terakhir kosong dan lebih dari 3"}
                              className="block w-full rounded-full border border-slate-300 bg-white px-3.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              − Tahun
                            </button>
                          </td>
                          {selUpload(k)}
                        </tr>
                        <tr className="bg-[#f5f8fd]">
                          <td className="border-b border-slate-200" />
                          <td colSpan={kolom.length - 1} className="p-3 border-b border-slate-200">
                            <div className="sticky left-3 max-w-[820px] space-y-2">
                              <label className="block">
                                <span className="mb-1 block font-bold">Tautan folder / dokumen</span>
                                <input className={INPUT} value={d.link} onChange={(e) => ubah("link", e.target.value)} placeholder="https://..." />
                              </label>
                              <label className="block">
                                <span className="mb-1 block font-bold">Nama tautan (yang ditampilkan)</span>
                                <input
                                  className={INPUT}
                                  value={d.linkLabel ?? ""}
                                  onChange={(e) => ubah("linkLabel", e.target.value)}
                                  placeholder="Folder dokumen"
                                />
                              </label>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  }

                  /* ===== Baris biasa ===== */
                  return (
                    <tr key={k.no} className="hover:bg-[#eef3fb] transition-colors">
                      <td className={`${td} text-center whitespace-nowrap`}>{k.no}</td>
                      <td className={`${td} min-w-[170px]`}>{k.ketua}</td>
                      <td className={`${td} min-w-[300px] max-w-[420px]`}>{k.judul}</td>
                      <td className={`${td} min-w-[150px]`}>{k.pusatRiset}</td>
                      <td className={`${td} text-center whitespace-nowrap`}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${LENCANA[k.skema]}`}>{k.jenis}</span>
                      </td>
                      <td className={`${td} text-center tabular-nums whitespace-nowrap`}>{k.jangkaBulan ?? "—"}</td>
                      {indeksTahun.map((i) => (
                        <td key={i} className={angka}>
                          {rupiah(k.dana[i])}
                        </td>
                      ))}
                      <td className={angka}>{rupiah(k.total)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        <div>{k.nomorSK || "—"}</div>
                        <div className="text-slate-500">{tanggal(k.tanggalSK)}</div>
                      </td>
                      <td className={`${td} min-w-[260px] max-w-[320px]`}>
                        <div className="whitespace-pre-line">{k.status || "—"}</div>
                        {k.keterangan && <div className="mt-1.5 whitespace-pre-line text-[11px] text-slate-500">{k.keterangan}</div>}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        <button
                          type="button"
                          onClick={() => mulaiUbah(k)}
                          disabled={edit !== null}
                          className="mb-1 block w-full rounded-full border border-[#2a58a5] bg-white px-3.5 py-1 text-[11px] font-bold text-[#1f468c] hover:bg-[#eef3fb] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => hapus(k)}
                          disabled={edit !== null}
                          className="block w-full rounded-full border border-slate-300 bg-white px-3.5 py-1 text-[11px] font-bold text-slate-600 hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Hapus
                        </button>
                      </td>
                      {selUpload(k)}
                    </tr>
                  );
                })}

                <tr className="bg-[#e8effb] font-bold">
                  <td colSpan={5} className="px-3 py-2.5 border-b border-slate-300 text-right uppercase tracking-wide whitespace-nowrap">
                    Total {g.skema} · {g.list.length} kegiatan
                  </td>
                  <td className="border-b border-slate-300" />
                  {indeksTahun.map((i) => (
                    <td key={i} className="px-3 py-2.5 border-b border-slate-300 text-right tabular-nums whitespace-nowrap">
                      {rupiah(jumlah(g.list, i))}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 border-b border-slate-300 text-right tabular-nums whitespace-nowrap">
                    {rupiah(g.list.reduce((n, k) => n + k.total, 0))}
                  </td>
                  <td colSpan={4} className="border-b border-slate-300" />
                </tr>
              </Fragment>
            ))}

            {grup.length > 1 && (
              <tr className="text-white font-bold" style={{ background: GRAD_BIRU }}>
                <td colSpan={5} className="px-3 py-2.5 text-right uppercase tracking-wide whitespace-nowrap">
                  Total seluruhnya · {tampil.length} kegiatan
                </td>
                <td />
                {indeksTahun.map((i) => (
                  <td key={i} className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                    {rupiah(jumlah(tampil, i))}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{rupiah(tampil.reduce((n, k) => n + k.total, 0))}</td>
                <td colSpan={4} />
              </tr>
            )}

            {tampil.length === 0 && (
              <tr>
                <td colSpan={kolom.length} className="p-6 text-center text-xs text-slate-500">
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
export default function RekapPendanaanPage() {
  return (
    <div className="mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden" translate="no">
      <InstansiBar />
      <div className="p-6 md:p-8">
        <RekapPendanaanTable />
      </div>
    </div>
  );
}