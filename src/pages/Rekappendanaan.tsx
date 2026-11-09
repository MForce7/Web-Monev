import { Fragment, useMemo, useState } from "react";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
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

const DATA: Kegiatan[] = (raw as { pendanaan: Kegiatan[] }).pendanaan;

/* ---------- Tampilan ---------- */
/** Font, warna, dan sudut disamakan dengan halaman Rekapitulasi / Kelompok Riset */
const FONT = "font-['Inter',ui-sans-serif,system-ui,sans-serif]";
const GRAD_BIRU = "linear-gradient(90deg, #1c3d85 0%, #2a58a5 100%)";
const GRAD_BIRU_TUA = "linear-gradient(90deg, #14306b 0%, #1f468c 100%)";
const BIRU_TEKS = "text-[#1f468c]";

/** Jumlah kolom dana tahun minimal */
const MIN_TAHUN = 3;
/** Kolom sebelum dan sesudah kolom dana tahun */
const KOLOM_AWAL = ["No", "Ketua Periset", "Judul", "Pusat Riset", "Jenis / Gelombang", "Jangka (Bln)"];
const KOLOM_AKHIR = ["Total Pendanaan (Rp)", "Nomor SK", "Status / Keterangan", "Tindakan", "Upload Data Dukung"];
/** Kolom yang tidak ikut tercetak */
const TANPA_CETAK = ["Tindakan", "Upload Data Dukung"];

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
  "w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30";

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

/** Gaya cetak: hanya tabel yang tercetak (landscape), bilah alat dan kolom tindakan disembunyikan */
function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        .rp-print, .rp-print * { visibility: visible; }
        .rp-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
        .no-print { display: none !important; }
        @page { size: A4 landscape; margin: 10mm; }
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

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return rows
      .filter((k) => (skema === SEMUA_SKEMA || k.skema === skema) && (pusat === SEMUA_PUSAT || k.pusatRiset === pusat))
      .filter(
        (k) =>
          !q || [k.ketua, k.judul, k.pusatRiset, k.jenis, k.nomorSK, k.status, k.keterangan].some((t) => (t ?? "").toLowerCase().includes(q)),
      );
  }, [rows, skema, pusat, cari]);

  const grup = URUTAN_SKEMA.map((s) => ({ skema: s, list: tampil.filter((k) => k.skema === s) })).filter((g) => g.list.length > 0);

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
    <td className={`${td} border-r-0 min-w-[220px] no-print`} onClick={(e) => e.stopPropagation()}>
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
              className="max-w-[190px] truncate font-semibold text-[#2a58a5] underline"
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
              className="max-w-[150px] truncate text-left font-semibold text-[#2a58a5] underline"
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
    <div
      className={`rp-print ${FONT} bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 overflow-hidden w-full max-w-full min-w-0`}
    >
      <PrintStyles />

      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 no-print">
        <h3 className="font-extrabold text-slate-800 text-base min-w-0">
          Rekap Pendanaan PRIS dan RIIM ORPA
          <span className="ml-2 text-xs font-semibold text-slate-500">{rows.length} kegiatan</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari ketua, judul, nomor SK..."
            className="w-64 max-w-full px-4 py-1.5 border border-slate-300 rounded-full text-xs focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30"
          />
          <select
            value={skema}
            onChange={(e) => setSkema(e.target.value)}
            className="px-4 py-1.5 border border-slate-300 rounded-full text-xs bg-white focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30"
          >
            <option>{SEMUA_SKEMA}</option>
            {URUTAN_SKEMA.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={pusat}
            onChange={(e) => setPusat(e.target.value)}
            className="px-4 py-1.5 border border-slate-300 rounded-full text-xs bg-white focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30"
          >
            <option>{SEMUA_PUSAT}</option>
            {daftarPusat.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-1.5 hover:brightness-110 text-white rounded-full text-xs font-bold shadow-md transition"
            style={{ background: GRAD_BIRU }}
          >
            Cetak Rekap
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-max min-w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="text-white text-center font-extrabold" style={{ background: GRAD_BIRU }}>
              {kolom.map((l) => (
                <th
                  key={l}
                  className={`p-2.5 px-3 border-r border-white/25 last:border-r-0 whitespace-nowrap ${TANPA_CETAK.includes(l) ? "no-print" : ""}`}
                >
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
                    className="p-2 text-white text-center font-extrabold uppercase tracking-wider"
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
                          <td className={`${td} text-center font-bold text-slate-600 whitespace-nowrap`}>{k.no}</td>
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
                          <td className={`${angka} font-extrabold text-slate-800`} title="Dihitung otomatis dari seluruh dana tahun">
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
                            <span className="mb-0.5 block font-extrabold text-[#1f468c]">Status</span>
                            <textarea className={`${INPUT} mb-2`} rows={3} value={d.status} onChange={(e) => ubah("status", e.target.value)} aria-label="Status" />
                            <span className="mb-0.5 block font-extrabold text-[#1f468c]">Keterangan</span>
                            <textarea className={INPUT} rows={3} value={d.keterangan} onChange={(e) => ubah("keterangan", e.target.value)} aria-label="Keterangan" />
                          </td>
                          <td className={`${td} whitespace-nowrap no-print`}>
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
                        <tr className="bg-[#f5f8fd] no-print">
                          <td className="border-b border-slate-200" />
                          <td colSpan={kolom.length - 1} className="p-3 border-b border-slate-200">
                            <div className="sticky left-3 max-w-[820px] space-y-2">
                              <label className="block">
                                <span className="mb-1 block font-extrabold text-[#1f468c]">Tautan folder / dokumen</span>
                                <input className={INPUT} value={d.link} onChange={(e) => ubah("link", e.target.value)} placeholder="https://..." />
                              </label>
                              <label className="block">
                                <span className="mb-1 block font-extrabold text-[#1f468c]">Nama tautan (yang ditampilkan)</span>
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
                      <td className={`${td} text-center font-bold text-slate-600 whitespace-nowrap`}>{k.no}</td>
                      <td className={`${td} font-bold min-w-[170px]`}>{k.ketua}</td>
                      <td className={`${td} font-semibold ${BIRU_TEKS} min-w-[300px] max-w-[420px]`}>{k.judul}</td>
                      <td className={`${td} min-w-[150px]`}>{k.pusatRiset}</td>
                      <td className={`${td} text-center whitespace-nowrap`}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${LENCANA[k.skema]}`}>{k.jenis}</span>
                      </td>
                      <td className={`${td} text-center tabular-nums whitespace-nowrap`}>{k.jangkaBulan ?? "—"}</td>
                      {indeksTahun.map((i) => (
                        <td key={i} className={angka}>
                          {rupiah(k.dana[i])}
                        </td>
                      ))}
                      <td className={`${angka} font-extrabold text-slate-800`}>{rupiah(k.total)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        <div className="font-semibold">{k.nomorSK || "—"}</div>
                        <div className="text-slate-500">{tanggal(k.tanggalSK)}</div>
                      </td>
                      <td className={`${td} min-w-[260px] max-w-[320px]`}>
                        <div className="whitespace-pre-line text-slate-700">{k.status || "—"}</div>
                        {k.keterangan && <div className="mt-1.5 whitespace-pre-line text-[10px] text-slate-500">{k.keterangan}</div>}
                      </td>
                      <td className={`${td} whitespace-nowrap no-print`}>
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

                <tr className="bg-[#e8effb] font-extrabold text-slate-800">
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
              <tr className="text-white font-extrabold" style={{ background: GRAD_BIRU }}>
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
                <td colSpan={kolom.length} className="p-6 text-center text-slate-500">
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
    <div className={`mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden ${FONT}`} translate="no">
      <InstansiBar />
      <div className="p-6 md:p-8">
        <RekapPendanaanTable />
      </div>
    </div>
  );
}