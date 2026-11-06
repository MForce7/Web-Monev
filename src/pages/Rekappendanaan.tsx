import { Fragment, useMemo, useState } from "react";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import raw from "../data/Rekappendanaan.json";

/* ---------- Data: ada di src/data/Rekappendanaan.json ----------
   (Rekap pendanaan PRIS dan RIIM ORPA). File ini hanya menampilkan. */
type Kegiatan = {
  no: number;
  skema: "PRIS" | "RIIM";
  jenis: string;
  ketua: string;
  judul: string;
  pusatRiset: string;
  jangkaBulan: number | null;
  dana: (number | null)[]; // Tahun 1, 2, 3
  total: number;
  nomorSK: string;
  tanggalSK: string; // "2026-08-04" atau teks bebas
  status: string;
  keterangan: string;
  link: string;
};

const DATA: Kegiatan[] = (raw as { pendanaan: Kegiatan[] }).pendanaan;

/* ---------- Tampilan ---------- */
/** Font, warna, dan sudut disamakan dengan halaman Rekapitulasi / Kelompok Riset */
const FONT = "font-['Inter',ui-sans-serif,system-ui,sans-serif]";
const GRAD_BIRU = "linear-gradient(90deg, #1c3d85 0%, #2a58a5 100%)";
const GRAD_BIRU_TUA = "linear-gradient(90deg, #14306b 0%, #1f468c 100%)";
const BIRU_TEKS = "text-[#1f468c]";

const KOLOM = [
  "No",
  "Ketua Periset",
  "Judul",
  "Pusat Riset",
  "Jenis / Gelombang",
  "Jangka (Bln)",
  "Dana Tahun 1 (Rp)",
  "Dana Tahun 2 (Rp)",
  "Dana Tahun 3 (Rp)",
  "Total Pendanaan (Rp)",
  "Nomor SK",
  "Status",
  "Upload Data Dukung",
];

const SEMUA_SKEMA = "Semua Skema";
const SEMUA_PUSAT = "Semua Pusat Riset";
const URUTAN_SKEMA: Kegiatan["skema"][] = ["PRIS", "RIIM"];
const NAMA_SKEMA: Record<Kegiatan["skema"], string> = {
  PRIS: "PRIS — Riset Inovasi Strategis",
  RIIM: "RIIM — Riset dan Inovasi untuk Indonesia Maju",
};

const LENCANA = {
  PRIS: "bg-[#e8effb] text-[#1f468c] border-[#c3d3ee]",
  RIIM: "bg-slate-100 text-slate-600 border-slate-200",
};

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const rupiah = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("id-ID") : "—");
const tanggal = (t: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : t || "—";
};
const ukuranFile = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const jumlah = (list: Kegiatan[], t: 0 | 1 | 2) => list.reduce((n, k) => n + (k.dana[t] ?? 0), 0);

/** Gaya cetak: hanya tabel yang tercetak (landscape), bilah alat disembunyikan */
function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        .rp-print, .rp-print * { visibility: visible; }
        .rp-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
        .no-print, .rp-detail { display: none !important; }
        @page { size: A4 landscape; margin: 10mm; }
      }
    `}</style>
  );
}

function RekapPendanaanTable() {
  const [skema, setSkema] = useState(SEMUA_SKEMA);
  const [pusat, setPusat] = useState(SEMUA_PUSAT);
  const [cari, setCari] = useState("");
  const [buka, setBuka] = useState<number | null>(null);
  /** Berkas data dukung yang dipilih, per nomor kegiatan. Disimpan di memori (hilang saat halaman dimuat ulang). */
  const [berkas, setBerkas] = useState<Record<number, File[]>>({});

  const tambahBerkas = (no: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    // TODO: kirim ke penyimpanan (mis. Supabase lewat lib/uploadSupportFile) lalu simpan alamat file-nya
    setBerkas((b) => ({ ...b, [no]: [...(b[no] ?? []), ...Array.from(files)] }));
  };
  const hapusBerkas = (no: number, idx: number) =>
    setBerkas((b) => ({ ...b, [no]: (b[no] ?? []).filter((_, i) => i !== idx) }));

  const daftarPusat = useMemo(() => Array.from(new Set(DATA.map((k) => k.pusatRiset))), []);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return DATA.filter((k) => (skema === SEMUA_SKEMA || k.skema === skema) && (pusat === SEMUA_PUSAT || k.pusatRiset === pusat)).filter(
      (k) => !q || [k.ketua, k.judul, k.pusatRiset, k.jenis, k.nomorSK, k.status].some((t) => t.toLowerCase().includes(q)),
    );
  }, [skema, pusat, cari]);

  const grup = URUTAN_SKEMA.map((s) => ({ skema: s, list: tampil.filter((k) => k.skema === s) })).filter((g) => g.list.length > 0);

  const td = "px-3 py-2 border-r border-b border-slate-200 align-top";
  const angka = `${td} text-right tabular-nums whitespace-nowrap`;

  return (
    <div
      className={`rp-print ${FONT} bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 overflow-hidden w-full max-w-full min-w-0`}
    >
      <PrintStyles />

      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 no-print">
        <h3 className="font-extrabold text-slate-800 text-base min-w-0">
          Rekap Pendanaan PRIS dan RIIM ORPA
          <span className="ml-2 text-xs font-semibold text-slate-500">{DATA.length} kegiatan</span>
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
              {KOLOM.map((l) => (
                <th key={l} className={`p-2.5 px-3 border-r border-white/25 last:border-r-0 whitespace-nowrap ${l === "Upload Data Dukung" ? "no-print" : ""}`}>
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
                    colSpan={KOLOM.length}
                    className="p-2 text-white text-center font-extrabold uppercase tracking-wider"
                    style={{ background: GRAD_BIRU_TUA }}
                  >
                    {NAMA_SKEMA[g.skema]}
                  </td>
                </tr>

                {g.list.map((k) => {
                  const terbuka = buka === k.no;
                  return (
                    <Fragment key={k.no}>
                      <tr
                        onClick={() => setBuka(terbuka ? null : k.no)}
                        className="hover:bg-[#eef3fb] transition-colors cursor-pointer"
                        title="Klik untuk melihat keterangan"
                      >
                        <td className={`${td} text-center font-bold text-slate-600 whitespace-nowrap`}>{k.no}</td>
                        <td className={`${td} font-bold min-w-[170px]`}>{k.ketua}</td>
                        <td className={`${td} font-semibold ${BIRU_TEKS} min-w-[300px] max-w-[420px]`}>{k.judul}</td>
                        <td className={`${td} min-w-[150px]`}>{k.pusatRiset}</td>
                        <td className={`${td} text-center whitespace-nowrap`}>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${LENCANA[k.skema]}`}>{k.jenis}</span>
                        </td>
                        <td className={`${td} text-center tabular-nums whitespace-nowrap`}>{k.jangkaBulan ?? "—"}</td>
                        <td className={angka}>{rupiah(k.dana[0])}</td>
                        <td className={angka}>{rupiah(k.dana[1])}</td>
                        <td className={angka}>{rupiah(k.dana[2])}</td>
                        <td className={`${angka} font-extrabold text-slate-800`}>{rupiah(k.total)}</td>
                        <td className={`${td} whitespace-nowrap`}>
                          <div className="font-semibold">{k.nomorSK || "—"}</div>
                          <div className="text-slate-500">{tanggal(k.tanggalSK)}</div>
                        </td>
                        <td className={`${td} text-slate-600 min-w-[260px] max-w-[320px]`}>
                          <div style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{k.status}</div>
                        </td>
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
                            {(berkas[k.no] ?? []).map((f, i) => (
                              <li key={`${f.name}-${i}`} className="flex items-center gap-1.5 rounded-lg bg-[#eef3fb] px-2 py-1">
                                <span className="max-w-[150px] truncate font-semibold text-[#1f468c]" title={f.name}>
                                  {f.name}
                                </span>
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
                      </tr>

                      {terbuka && (
                        <tr className="rp-detail bg-[#f5f8fd]">
                          <td className="border-b border-slate-200" />
                          <td colSpan={KOLOM.length - 1} className="p-3 border-b border-slate-200 text-slate-700">
                            <div className="sticky left-3 max-w-[820px] whitespace-normal">
                              <div className="font-extrabold text-[#1f468c] mb-1">Status</div>
                              <p className="mb-2 whitespace-pre-line">{k.status || "—"}</p>
                              <div className="font-extrabold text-[#1f468c] mb-1">Keterangan</div>
                              <p className="whitespace-pre-line">{k.keterangan || "—"}</p>
                              {k.link && (
                                <a
                                  href={k.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 inline-block font-bold text-[#2a58a5] underline"
                                >
                                  Buka folder dokumen
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

                <tr className="bg-[#e8effb] font-extrabold text-slate-800">
                  <td colSpan={5} className="p-2.5 border-b border-slate-300 text-right uppercase tracking-wide">
                    Total {g.skema} · {g.list.length} kegiatan
                  </td>
                  <td className="border-b border-slate-300" />
                  <td className="px-3 py-2.5 border-b border-slate-300 text-right tabular-nums whitespace-nowrap">{rupiah(jumlah(g.list, 0))}</td>
                  <td className="px-3 py-2.5 border-b border-slate-300 text-right tabular-nums whitespace-nowrap">{rupiah(jumlah(g.list, 1))}</td>
                  <td className="px-3 py-2.5 border-b border-slate-300 text-right tabular-nums whitespace-nowrap">{rupiah(jumlah(g.list, 2))}</td>
                  <td className="px-3 py-2.5 border-b border-slate-300 text-right tabular-nums whitespace-nowrap">{rupiah(g.list.reduce((n, k) => n + k.total, 0))}</td>
                  <td colSpan={3} className="border-b border-slate-300" />
                </tr>
              </Fragment>
            ))}

            {grup.length > 1 && (
              <tr className="text-white font-extrabold" style={{ background: GRAD_BIRU }}>
                <td colSpan={5} className="p-2.5 text-right uppercase tracking-wide">
                  Total seluruhnya · {tampil.length} kegiatan
                </td>
                <td />
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{rupiah(jumlah(tampil, 0))}</td>
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{rupiah(jumlah(tampil, 1))}</td>
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{rupiah(jumlah(tampil, 2))}</td>
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{rupiah(tampil.reduce((n, k) => n + k.total, 0))}</td>
                <td colSpan={3} />
              </tr>
            )}

            {tampil.length === 0 && (
              <tr>
                <td colSpan={KOLOM.length} className="p-6 text-center text-slate-500">
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