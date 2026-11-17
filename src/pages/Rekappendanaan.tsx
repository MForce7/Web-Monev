import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ReactNode } from "react";
import type { UserOptions } from "jspdf-autotable";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import Dropdown from "../components/rekapitulasi/Dropdown.tsx";
import raw from "../data/rekappendanaan.json";

/* ---------- Data: isi awal ada di src/data/rekappendanaan.json ----------
   (Rekap pendanaan PRIS dan RIIM ORPA). Isi tabel bisa diubah lewat tombol "Ubah" di tiap baris,
   dan data baru ditambah lewat tombol "+ Tambah Data" (form lengkap dalam pop up). */
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
/** Isi form tambah data (nomor dan total diisi otomatis saat disimpan) */
type DataBaru = Omit<Kegiatan, "no" | "total">;

const DATA: Kegiatan[] = (raw as { pendanaan: Kegiatan[] }).pendanaan;

/* ---------- Tampilan ----------
   Isi tabel text-xs, judul kolom text-xs (HP) / text-sm (sm ke atas) bold, warna #1b3560. */
const GRAD_BIRU = "linear-gradient(90deg, #1c3d85 0%, #2a58a5 100%)";
const GRAD_BIRU_TUA = "linear-gradient(90deg, #14306b 0%, #1f468c 100%)";

/** Jumlah kolom dana tahun minimal di tabel (dan default isian di form tambah data) */
const MIN_TAHUN = 3;
/** Jumlah termin minimal yang boleh disimpan lewat form tambah data */
const MIN_TAHUN_FORM = 1;
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
/** Nama panjang tanpa singkatan, dipakai di pop up tambah data */
const KETERANGAN_SKEMA: Record<Skema, string> = {
  PRIS: "Riset Inovasi Strategis",
  RIIM: "Riset dan Inovasi untuk Indonesia Maju",
};

const LENCANA: Record<Skema, string> = {
  PRIS: "bg-[#e8effb] text-[#1f468c] border-[#c3d3ee]",
  RIIM: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Gaya kotak isian saat mengubah baris */
const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs leading-snug text-[#1b3560] focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30";

/** Lebar dropdown mengikuti pilihan terpanjang (satuan ch) + ruang panah di kiri-kanan.
    Disimpan sebagai CSS variable --w; hanya dipakai dari layar sm ke atas (sm:w-[var(--w)]),
    di HP dropdown mengikuti lebar kolom grid. */
const lebarDropdown = (opsi: string[]) =>
  ({ "--w": `calc(${Math.max(...opsi.map((o) => o.length))}ch + 4.75rem)` }) as CSSProperties;

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const rupiah = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("id-ID") : "—");
const tanggal = (t: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : t || "—";
};
const ukuranFile = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const jumlah = (list: Kegiatan[], t: number) => list.reduce((n, k) => n + (k.dana[t] ?? 0), 0);
const hitungTotal = (dana: (number | null)[]) => dana.reduce<number>((n, v) => n + (v ?? 0), 0);
/** Buang termin kosong di ujung, tapi sisakan minimal `min` termin (bawaan MIN_TAHUN) */
const rapikanDana = (dana: (number | null)[], min: number = MIN_TAHUN) => {
  const hasil = [...dana];
  while (hasil.length > min && hasil[hasil.length - 1] == null) hasil.pop();
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

/** Panah bulat kecil untuk menggeser tabel ke kiri / kanan */
function PanahGulir({ arah, onClick }: { arah: "kiri" | "kanan"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arah === "kanan" ? "Geser tabel ke kanan" : "Geser tabel ke kiri"}
      title={arah === "kanan" ? "Geser ke kanan" : "Geser ke kiri"}
      className={`absolute top-[10px] z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition hover:scale-110 ${
        arah === "kanan" ? "right-2" : "left-2"
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="#1f468c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {arah === "kanan" ? <path d="M4.5 2.5l3.5 3.5-3.5 3.5" /> : <path d="M7.5 2.5L4 6l3.5 3.5" />}
      </svg>
    </button>
  );
}

/** Label + isian dalam form pop up */
function Isian({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-[#1b3560]">{label}</span>
      {children}
    </label>
  );
}

const PUSAT_LAIN = "__lain__";

/** Pop up form tambah data: semua isian ada di sini, skema dipilih paling atas */
function FormTambahData({
  daftarPusat,
  pusatAwal,
  skemaAwal,
  onSimpan,
  onTutup,
}: {
  daftarPusat: string[];
  pusatAwal: string;
  skemaAwal: Skema | null;
  onSimpan: (d: DataBaru) => void;
  onTutup: () => void;
}) {
  const [skema, setSkema] = useState<Skema | null>(skemaAwal);
  const [jenis, setJenis] = useState("");
  const [ketua, setKetua] = useState("");
  const [judul, setJudul] = useState("");
  const [pusatPilih, setPusatPilih] = useState(pusatAwal || daftarPusat[0] || PUSAT_LAIN);
  const [pusatBaru, setPusatBaru] = useState("");
  const [jangka, setJangka] = useState("");
  /** Awalnya tampil 3 termin, bisa dikurangi sampai 1 */
  const [dana, setDana] = useState<(number | null)[]>(() => Array.from({ length: MIN_TAHUN }, () => null));
  const [nomorSK, setNomorSK] = useState("");
  const [tanggalSK, setTanggalSK] = useState("");
  const [status, setStatus] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [galat, setGalat] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onTutup]);

  const bisaKurangi = dana.length > MIN_TAHUN_FORM;

  const simpan = () => {
    const pusatRiset = pusatPilih === PUSAT_LAIN ? pusatBaru.trim() : pusatPilih;
    if (!skema) return setGalat("Pilih skema dulu: PRIS atau RIIM.");
    if (!ketua.trim()) return setGalat("Ketua periset wajib diisi.");
    if (!judul.trim()) return setGalat("Judul wajib diisi.");
    if (!pusatRiset) return setGalat("Pusat riset wajib diisi.");
    onSimpan({
      skema,
      jenis: jenis.trim(),
      ketua: ketua.trim(),
      judul: judul.trim(),
      pusatRiset,
      jangkaBulan: angkaDari(jangka),
      // Termin kosong di ujung dibuang, minimal tersisa 1 tahun
      dana: rapikanDana(dana, MIN_TAHUN_FORM),
      nomorSK: nomorSK.trim(),
      tanggalSK,
      status: status.trim(),
      keterangan: keterangan.trim(),
      link: link.trim(),
      linkLabel: linkLabel.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f3d]/50 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-tambah-data"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
      >
        {/* Kepala */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h4 id="judul-tambah-data" className="text-base font-bold text-[#1b3560]">
              Tambah Data Pendanaan
            </h4>
            <p className="mt-0.5 text-xs text-slate-500">Isi data kegiatan, lalu klik Simpan.</p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Isi form */}
        <div className="space-y-5 overflow-y-auto px-6 py-5">
          {/* Pilih skema */}
          <div>
            <span className="mb-1.5 block text-xs font-bold text-[#1b3560]">
              Skema <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              {URUTAN_SKEMA.map((s) => {
                const aktif = skema === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSkema(s)}
                    aria-pressed={aktif}
                    className={`rounded-2xl border px-4 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a58a5]/40 ${
                      aktif
                        ? "border-[#1f468c] bg-[#1f468c] text-white shadow-md"
                        : "border-[#c3d3ee] bg-[#f5f8fd] text-[#1f468c] hover:border-[#2a58a5] hover:bg-[#e8effb]"
                    }`}
                  >
                    <span className="block text-base font-extrabold">{s}</span>
                    <span className={`mt-0.5 block text-[11px] leading-snug ${aktif ? "text-white/80" : "text-slate-600"}`}>
                      {KETERANGAN_SKEMA[s]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Isian label="Ketua Periset *">
              <input className={INPUT} value={ketua} onChange={(e) => setKetua(e.target.value)} />
            </Isian>
            <Isian label="Jenis / Gelombang">
              <input className={INPUT} value={jenis} onChange={(e) => setJenis(e.target.value)} placeholder="Mis. Gelombang 1" />
            </Isian>
            <Isian label="Judul *" className="sm:col-span-2">
              <textarea className={INPUT} rows={3} value={judul} onChange={(e) => setJudul(e.target.value)} />
            </Isian>
            <Isian label="Pusat Riset *">
              <select className={INPUT} value={pusatPilih} onChange={(e) => setPusatPilih(e.target.value)}>
                {daftarPusat.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value={PUSAT_LAIN}>Lainnya (ketik sendiri)…</option>
              </select>
              {pusatPilih === PUSAT_LAIN && (
                <input
                  className={`${INPUT} mt-1.5`}
                  value={pusatBaru}
                  onChange={(e) => setPusatBaru(e.target.value)}
                  placeholder="Nama pusat riset"
                  aria-label="Nama pusat riset baru"
                />
              )}
            </Isian>
            <Isian label="Jangka waktu (bulan)">
              <input className={INPUT} inputMode="numeric" value={jangka} onChange={(e) => setJangka(e.target.value.replace(/\D/g, ""))} />
            </Isian>
          </div>

          {/* Dana per tahun */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1b3560]">Dana per tahun (Rp)</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDana((d) => [...d, null])}
                  className="rounded-full border border-[#2a58a5] bg-white px-3 py-0.5 text-[11px] font-bold text-[#1f468c] hover:bg-[#eef3fb]"
                >
                  + Tahun
                </button>
                <button
                  type="button"
                  onClick={() => setDana((d) => (d.length > MIN_TAHUN_FORM ? d.slice(0, -1) : d))}
                  disabled={!bisaKurangi}
                  title={bisaKurangi ? "Hapus tahun terakhir" : "Minimal 1 tahun"}
                  className="rounded-full border border-slate-300 bg-white px-3 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  − Tahun
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {dana.map((v, i) => (
                <Isian key={i} label={`Tahun ${i + 1}`}>
                  <input
                    className={`${INPUT} text-right tabular-nums`}
                    inputMode="numeric"
                    value={v == null ? "" : v.toLocaleString("id-ID")}
                    onChange={(e) =>
                      setDana((d) => {
                        const baru = [...d];
                        baru[i] = angkaDari(e.target.value);
                        return baru;
                      })
                    }
                  />
                </Isian>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-[#e8effb] px-3 py-2 text-xs font-bold text-[#1b3560]">
              <span>Total pendanaan</span>
              <span className="tabular-nums">Rp {rupiah(hitungTotal(dana))}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Isian label="Nomor SK">
              <input className={INPUT} value={nomorSK} onChange={(e) => setNomorSK(e.target.value)} />
            </Isian>
            <Isian label="Tanggal SK">
              <input
                className={INPUT}
                type={ISO.test(tanggalSK) || !tanggalSK ? "date" : "text"}
                value={tanggalSK}
                onChange={(e) => setTanggalSK(e.target.value)}
              />
            </Isian>
            <Isian label="Status">
              <textarea className={INPUT} rows={3} value={status} onChange={(e) => setStatus(e.target.value)} />
            </Isian>
            <Isian label="Keterangan">
              <textarea className={INPUT} rows={3} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
            </Isian>
            <Isian label="Tautan folder / dokumen">
              <input className={INPUT} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </Isian>
            <Isian label="Nama tautan (yang ditampilkan)">
              <input className={INPUT} value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Folder dokumen" />
            </Isian>
          </div>
        </div>

        {/* Kaki */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p className="min-h-[1rem] text-xs font-bold text-red-600" role="alert">
            {galat}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onTutup}
              className="rounded-full border border-slate-300 bg-white px-5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={simpan}
              className="rounded-full px-5 py-1.5 text-xs font-bold text-white shadow-md hover:brightness-110"
              style={{ background: GRAD_BIRU }}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  /** Dipanggil setiap kali isi tabel ditambah / diubah / dihapus (mis. untuk disimpan ke database) */
  onSave?(data: Kegiatan[]): void;
}

function RekapPendanaanTable({ onSave }: Props) {
  const [rows, setRows] = useState<Kegiatan[]>(DATA);
  const [skema, setSkema] = useState(SEMUA_SKEMA);
  const [pusat, setPusat] = useState(SEMUA_PUSAT);
  const [cari, setCari] = useState("");
  const [mencetak, setMencetak] = useState(false);
  /** Pop up form tambah data */
  const [formTambah, setFormTambah] = useState(false);
  /** Nomor baris yang baru ditambah: disorot sebentar dan digulir ke layar */
  const [sorot, setSorot] = useState<number | null>(null);
  /** Baris yang sedang diubah + salinan kerjanya */
  const [edit, setEdit] = useState<number | null>(null);
  const [draft, setDraft] = useState<Kegiatan | null>(null);
  /** Berkas data dukung yang dipilih, per nomor kegiatan. Disimpan di memori (hilang saat halaman dimuat ulang). */
  const [berkas, setBerkas] = useState<Record<number, File[]>>({});

  /* ----- petunjuk scroll horizontal ----- */
  const gulirRef = useRef<HTMLDivElement>(null);
  const [bisaKiri, setBisaKiri] = useState(false);
  const [bisaKanan, setBisaKanan] = useState(false);
  const cekGulir = useCallback(() => {
    const el = gulirRef.current;
    if (!el) return;
    setBisaKiri(el.scrollLeft > 4);
    setBisaKanan(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    cekGulir();
    const el = gulirRef.current;
    if (!el) return;
    // Pantau ukuran wadah dan tabel, karena lebar tabel berubah saat data / kolom tahun bertambah
    const ro = new ResizeObserver(cekGulir);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", cekGulir);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", cekGulir);
    };
  }, [cekGulir]);
  const geser = (arah: 1 | -1) => gulirRef.current?.scrollBy({ left: arah * 400, behavior: "smooth" });

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

  // Setelah data baru masuk: gulir ke barisnya, lalu hilangkan sorotan setelah beberapa detik
  useEffect(() => {
    if (sorot === null) return;
    document.getElementById(`baris-${sorot}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => setSorot(null), 3500);
    return () => window.clearTimeout(t);
  }, [sorot]);

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

  /* ----- tambah / ubah / simpan / hapus ----- */
  /** Simpan data dari pop up form tambah */
  const tambah = (d: DataBaru) => {
    const no = rows.reduce((m, r) => Math.max(m, r.no), 0) + 1;
    const baru: Kegiatan = { ...d, no, total: hitungTotal(d.dana) };
    const next = [...rows, baru];
    setRows(next);
    onSave?.(next);
    // Pastikan baris baru tidak tersembunyi oleh pencarian / filter
    setCari("");
    if (skema !== SEMUA_SKEMA && skema !== d.skema) setSkema(SEMUA_SKEMA);
    if (pusat !== SEMUA_PUSAT && pusat !== d.pusatRiset) setPusat(SEMUA_PUSAT);
    setFormTambah(false);
    setSorot(no);
  };
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
    if (!draft.ketua.trim() || !draft.judul.trim()) {
      alert("Ketua periset dan judul wajib diisi.");
      return;
    }
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

  // Padding sel lebih rapat di HP, normal dari sm ke atas
  const td = "px-2 py-1.5 sm:px-3 sm:py-2 border-r border-b border-slate-200 align-top";
  const angka = `${td} text-right tabular-nums whitespace-nowrap`;

  /** Kolom upload: dipakai baris biasa maupun baris yang sedang diubah */
  const selUpload = (k: Kegiatan) => (
    <td className={`${td} border-r-0 min-w-[190px] sm:min-w-[220px]`} onClick={(e) => e.stopPropagation()}>
      <label
        className="inline-block cursor-pointer rounded-full px-3.5 py-1.5 sm:py-1 text-[11px] font-bold text-white shadow-md transition hover:brightness-110"
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
              className="max-w-[170px] sm:max-w-[190px] truncate text-[#2a58a5] underline"
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
              className="max-w-[120px] sm:max-w-[150px] truncate text-left text-[#2a58a5] underline"
              title={`Buka ${f.name}`}
            >
              {f.name}
            </button>
            <span className="shrink-0 text-slate-500">{ukuranFile(f.size)}</span>
            <button
              type="button"
              onClick={() => hapusBerkas(k.no, i)}
              aria-label={`Hapus ${f.name}`}
              className="ml-auto shrink-0 rounded-full px-2 py-0.5 sm:px-1.5 sm:py-0 font-bold text-slate-500 hover:bg-white hover:text-red-600"
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
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 w-full max-w-full min-w-0">
      <GayaDropdown />
      {formTambah && (
        <FormTambahData
          daftarPusat={daftarPusat}
          pusatAwal={pusat !== SEMUA_PUSAT ? pusat : ""}
          skemaAwal={skema !== SEMUA_SKEMA ? (skema as Skema) : null}
          onSimpan={tambah}
          onTutup={() => setFormTambah(false)}
        />
      )}

      <div className="p-4 bg-slate-50 border-b border-slate-200 rounded-t-3xl flex flex-wrap items-center gap-3">
        {/* Judul mengisi sisa ruang di kiri */}
        <h3 className="font-bold text-[#1b3560] text-sm min-w-[220px] flex-1">
          Rekap Pendanaan PRIS dan RIIM ORPA
          <span className="ml-2 text-xs font-normal text-slate-500">{rows.length} kegiatan</span>
        </h3>
        {/* Pencarian, dropdown, tambah, dan cetak selalu menempel di kanan */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari ketua, judul, nomor SK..."
            className="h-9 w-full sm:w-52 px-4 border border-[#dbe6f7] rounded-full text-xs text-[#1b3560] bg-white focus:outline-none focus:border-[#2a5aa8] focus:ring-2 focus:ring-[#2a5aa8]/30"
          />
          <div className="dd-kecil w-full min-w-0 sm:w-[var(--w)]" style={lebarDropdown(opsiSkema)}>
            <Dropdown label="Semua Skema" options={opsiSkema} value={skema} onChange={setSkema} />
          </div>
          <div className="dd-kecil w-full min-w-0 sm:w-[var(--w)]" style={lebarDropdown(opsiPusat)}>
            <Dropdown label="Semua Pusat Riset" options={opsiPusat} value={pusat} onChange={setPusat} />
          </div>
          <button
            type="button"
            onClick={() => setFormTambah(true)}
            title="Tambah kegiatan baru"
            className="h-9 px-4 rounded-full border border-[#2a58a5] bg-white text-xs font-bold text-[#1f468c] shadow-sm transition hover:bg-[#eef3fb]"
          >
            + Tambah Data
          </button>
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

      {/* Pembungkus relatif: bayangan dan panah menempel di tepi area scroll */}
      <div className="relative rounded-b-3xl">
        {/* Bayangan dalam di tepi: hanya tampil kalau di sisi itu masih ada bagian tabel tersembunyi */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-bl-3xl transition-opacity duration-200 ${bisaKiri ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(to right, rgba(27,53,96,0.28), rgba(27,53,96,0))" }}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-br-3xl transition-opacity duration-200 ${bisaKanan ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(to left, rgba(27,53,96,0.28), rgba(27,53,96,0))" }}
        />
        {bisaKiri && <PanahGulir arah="kiri" onClick={() => geser(-1)} />}
        {bisaKanan && <PanahGulir arah="kanan" onClick={() => geser(1)} />}

        <div ref={gulirRef} onScroll={cekGulir} className="overflow-x-auto rounded-b-3xl">
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
                          <tr id={`baris-${k.no}`} className="bg-[#f5f8fd]">
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
                              <input className={INPUT} value={d.jenis} onChange={(e) => ubah("jenis", e.target.value)} placeholder="Jenis / gelombang" aria-label="Jenis atau gelombang" />
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
                      <tr
                        key={k.no}
                        id={`baris-${k.no}`}
                        className={`transition-colors duration-500 ${sorot === k.no ? "bg-[#fff6cc]" : "hover:bg-[#eef3fb]"}`}
                      >
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
    </div>
  );
}

/* ---------- Halaman ---------- */
export default function RekapPendanaanPage() {
  return (
    // overflow-x-hidden (bukan overflow-hidden) supaya dropdown tidak terpotong; mt-16 di HP, mt-20 dari md
    <div className="mt-16 md:mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-x-hidden" translate="no">
      <InstansiBar />
      <div className="p-3 sm:p-6 md:p-8">
        <RekapPendanaanTable />
      </div>
    </div>
  );
}