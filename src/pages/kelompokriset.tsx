import { Fragment, useMemo, useState } from "react";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";

import raw from "../data/kelompokriset.json";

/* ---------- Data: ada di src/data/kelompokriset.json ----------
   (Draft Kepka ORPA tentang Kelompok Riset Tahun 2026). File ini hanya menampilkan. */
type Periset = { nama: string; nip: string; keterangan: string; jabatan: string };
type Kelompok = { nama: string; anggota: Periset[] };
type PusatRiset = { nama: string; kelompok: Kelompok[] };

const DATA: PusatRiset[] = (raw as { pusatRiset: PusatRiset[] }).pusatRiset;

/* ---------- Tampilan ----------
   Mengikuti tabel Rekapitulasi: 10px, header bold, isi normal berwarna #1b3560. */
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

/** Gaya cetak: hanya tabel yang tercetak (landscape), bilah alat disembunyikan */
function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        .kr-print, .kr-print * { visibility: visible; }
        .kr-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
        .no-print { display: none !important; }
        @page { size: A4 landscape; margin: 10mm; }
      }
    `}</style>
  );
}

function KelompokRisetTable() {
  const [pusat, setPusat] = useState(SEMUA);
  const [cari, setCari] = useState("");

  const total = useMemo(
    () => ({
      kelompok: DATA.reduce((n, p) => n + p.kelompok.length, 0),
      periset: DATA.reduce((n, p) => n + p.kelompok.reduce((m, k) => m + k.anggota.length, 0), 0),
    }),
    [],
  );

  /** Terapkan filter pusat riset + pencarian. Nomor anggota dihitung sebelum difilter supaya tidak bergeser. */
  const tampil = useMemo(() => {
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

  const td = "px-3 py-2 border-r border-b border-slate-200 align-top break-words text-[10px] font-normal text-[#1b3560]";

  return (
    <div className="kr-print bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
      <PrintStyles />

      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 no-print">
        <h3 className="font-bold text-[#1b3560] text-base min-w-0">
          Kelompok Riset ORPA Tahun Anggaran 2026
          <span className="ml-2 text-[11px] font-normal text-slate-500">
            {total.kelompok} kelompok · {total.periset} periset
          </span>
        </h3>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari kelompok, nama, NIP, jabatan..."
            className="w-64 max-w-full px-4 py-1.5 border border-slate-300 rounded-full text-[11px] text-[#1b3560] focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30"
          />
          <select
            value={pusat}
            onChange={(e) => setPusat(e.target.value)}
            className="px-4 py-1.5 border border-slate-300 rounded-full text-[11px] text-[#1b3560] bg-white focus:outline-none focus:border-[#2a58a5] focus:ring-2 focus:ring-[#2a58a5]/30"
          >
            <option>{SEMUA}</option>
            {DATA.map((p) => (
              <option key={p.nama}>{p.nama}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-1.5 hover:brightness-110 text-white rounded-full text-[11px] font-bold shadow-md transition"
            style={{ background: GRAD_BIRU }}
          >
            Cetak Daftar
          </button>
        </div>
      </div>

      <table className="w-full max-w-full table-fixed text-left text-[10px] font-normal text-[#1b3560] border-collapse">
        <colgroup>
          {WIDTHS.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>

        <thead>
          <tr className="text-white text-center text-[10px] font-bold" style={{ background: GRAD_BIRU }}>
            {KOLOM.map((l) => (
              <th key={l} className={`px-3 py-2 text-[10px] font-bold border-r border-white/25 last:border-r-0 ${WRAP}`}>
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
                  className="px-3 py-2 text-white text-center text-[10px] font-bold uppercase tracking-wider"
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
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-normal ${lencana(a.keterangan)}`}
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
              <td colSpan={KOLOM.length} className="p-6 text-center text-[10px] text-slate-500">
                Tidak ada data yang cocok dengan pencarian.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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