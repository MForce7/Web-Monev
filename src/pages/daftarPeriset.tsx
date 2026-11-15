import { Fragment, useMemo, useState } from "react";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import Dropdown from "../components/rekapitulasi/Dropdown.tsx";
import type { Periset, PusatRiset } from "../types/periset";
import rawData from "../data/kelompokriset.json";
import FormTambahPeriset from "../components/daftarPeriset/FormTambahPeriset";
import EditPeristModal from "../components/daftarPeriset/EditPeristModal";
import RenameKelompokModal from "../components/daftarPeriset/RenameKelompokModal";

const AWAL_DATA: PusatRiset[] = (rawData as { pusatRiset: PusatRiset[] }).pusatRiset;

const GRAD_BIRU = "linear-gradient(90deg, #1c3d85 0%, #2a58a5 100%)";
const GRAD_BIRU_TUA = "linear-gradient(90deg, #14306b 0%, #1f468c 100%)";
const WIDTHS = [5, 18, 23, 14, 9, 17, 14];
const KOLOM = ["No", "Nama Kelompok Riset", "Nama Periset", "NIP", "Keterangan", "Jabatan Fungsional", "Aksi"];
const SEMUA = "Semua Pusat Riset";
const WRAP = "break-words whitespace-normal";

const LENCANA = {
  pimpinan: "bg-[#e8effb] text-[#1b3560] border-[#c3d3ee]",
  anggota: "bg-slate-100 text-[#1b3560] border-slate-200",
};
const lencana = (ket: string) => (ket === "Anggota" ? LENCANA.anggota : LENCANA.pimpinan);

/** Anggota tampil + referensi posisi aslinya di `data`, supaya aksi edit/kick selalu tepat sasaran
    walau baris ini sedang dalam keadaan terfilter. */
type AnggotaTampil = Periset & { no: number; pi: number; ki: number; ai: number };
type KelompokTampil = { nama: string; no: number; pi: number; ki: number; anggota: AnggotaTampil[] };
type PusatTampil = { nama: string; pi: number; kelompok: KelompokTampil[] };

type EditTarget = { periset: Periset; pusatRiset: string; kelompokRiset: string; ref: { pi: number; ki: number; ai: number } };

export default function DaftarPeristPage() {
  const [data, setData] = useState<PusatRiset[]>(AWAL_DATA);
  const [pusat, setPusat] = useState(SEMUA);
  const [cari, setCari] = useState("");
  const [showTambah, setShowTambah] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ pi: number; ki: number; namaLama: string } | null>(null);

  const OPSI_PUSAT = useMemo(() => [SEMUA, ...data.map((p) => p.nama)], [data]);
  const LEBAR_DROPDOWN = useMemo(
    () => ({ width: `calc(${Math.max(...OPSI_PUSAT.map((o) => o.length), 1)}ch + 4.75rem)` }),
    [OPSI_PUSAT]
  );

  const total = useMemo(
    () => ({
      kelompok: data.reduce((n, p) => n + p.kelompok.length, 0),
      periset: data.reduce((n, p) => n + p.kelompok.reduce((m, k) => m + k.anggota.length, 0), 0),
    }),
    [data]
  );

  /** Sama seperti halaman tampilan, tapi tiap anggota membawa referensi (pi, ki, ai) ke `data` asli */
  const tampil: PusatTampil[] = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return data
      .map((p, pi) => ({ nama: p.nama, pi, kelompok: p.kelompok, pusatAsli: p }))
      .filter((p) => pusat === SEMUA || p.nama === pusat)
      .map(({ nama, pi, kelompok }) => ({
        nama,
        pi,
        kelompok: kelompok
          .map((k, ki) => {
            const semua = k.anggota.map((a, ai) => ({ ...a, no: ai + 1, pi, ki, ai }));
            const cocokKelompok = k.nama.toLowerCase().includes(q);
            return {
              nama: k.nama,
              no: ki + 1,
              pi,
              ki,
              anggota:
                q && !cocokKelompok
                  ? semua.filter((a) => [a.nama, a.nip, a.jabatan].some((t) => t.toLowerCase().includes(q)))
                  : semua,
            };
          })
          .filter((k) => k.anggota.length > 0),
      }))
      .filter((p) => p.kelompok.length > 0);
  }, [data, pusat, cari]);

  /* ---------- Aksi: tambah, edit, kick, rename kelompok ---------- */

  const handleAdd = (periset: Periset, pusatRiset: string, kelompokRiset: string) => {
    setData((prev) =>
      prev.map((p) => {
        if (p.nama !== pusatRiset) return p;
        return {
          ...p,
          kelompok: p.kelompok.map((k) =>
            k.nama === kelompokRiset ? { ...k, anggota: [...k.anggota, periset] } : k
          ),
        };
      })
    );
  };

  const openEdit = (a: AnggotaTampil, pusatNama: string, kelompokNama: string) => {
    setEditTarget({
      periset: { nama: a.nama, nip: a.nip, keterangan: a.keterangan, jabatan: a.jabatan },
      pusatRiset: pusatNama,
      kelompokRiset: kelompokNama,
      ref: { pi: a.pi, ki: a.ki, ai: a.ai },
    });
  };

  const handleSaveEdit = (updated: Periset, pusatBaru: string, kelompokBaru: string) => {
    if (!editTarget) return;
    const { pi, ki, ai } = editTarget.ref;

    setData((prev) => {
      // 1. Hapus dari posisi lama
      const tanpaLama = prev.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          kelompok: p.kelompok.map((k, j) => {
            if (j !== ki) return k;
            return { ...k, anggota: k.anggota.filter((_, idx) => idx !== ai) };
          }),
        };
      });

      // 2. Masukkan ke posisi baru (bisa sama dengan posisi lama kalau tidak dipindah)
      return tanpaLama.map((p) => {
        if (p.nama !== pusatBaru) return p;
        return {
          ...p,
          kelompok: p.kelompok.map((k) =>
            k.nama === kelompokBaru ? { ...k, anggota: [...k.anggota, updated] } : k
          ),
        };
      });
    });
  };

  const handleKick = () => {
    if (!editTarget) return;
    const { pi, ki, ai } = editTarget.ref;

    setData((prev) =>
      prev.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          kelompok: p.kelompok.map((k, j) => {
            if (j !== ki) return k;
            return { ...k, anggota: k.anggota.filter((_, idx) => idx !== ai) };
          }),
        };
      })
    );
  };

  const handleRenameKelompok = (namaBaru: string) => {
    if (!renameTarget) return;
    const { pi, ki } = renameTarget;

    setData((prev) =>
      prev.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          kelompok: p.kelompok.map((k, j) => (j === ki ? { ...k, nama: namaBaru } : k)),
        };
      })
    );
  };

  const td = "px-3 py-2 border-r border-b border-slate-200 align-top break-words text-xs font-normal leading-snug text-[#1b3560]";

  return (
    <div className="mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden" translate="no">
      <InstansiBar />

      <div className="p-6 md:p-8">
        <div className="bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 w-full max-w-full min-w-0">
          <div className="p-4 bg-slate-50 border-b border-slate-200 rounded-t-3xl flex flex-wrap items-center gap-3">
            <h3 className="font-bold text-[#1b3560] text-sm min-w-[220px] flex-1">
              Daftar Periset
              <span className="ml-2 text-xs font-normal text-slate-500">
                {total.kelompok} kelompok · {total.periset} periset
              </span>
            </h3>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari kelompok, nama, NIP, jabatan..."
                className="h-9 w-52 max-w-full px-4 border border-[#dbe6f7] rounded-full text-xs text-[#1b3560] bg-white focus:outline-none focus:border-[#2a5aa8] focus:ring-2 focus:ring-[#2a5aa8]/30"
              />
              <div className="max-w-full" style={LEBAR_DROPDOWN}>
                <Dropdown label="Semua Pusat Riset" options={OPSI_PUSAT} value={pusat} onChange={setPusat} />
              </div>

              <button
                type="button"
                onClick={() => setShowTambah(true)}
                className="h-9 px-4 text-white rounded-full text-xs font-bold shadow-md transition hover:brightness-110"
                style={{ background: GRAD_BIRU_TUA }}
              >
                + Tambah Periset
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-b-3xl overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed text-left text-xs font-normal leading-snug text-[#1b3560] border-collapse">
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
                        <tr key={`${p.nama}-${k.nama}-${a.nip}-${i}`} className="hover:bg-[#eef3fb] transition-colors">
                          {i === 0 && (
                            <>
                              <td rowSpan={k.anggota.length} className={`${td} text-center bg-white`}>
                                {k.no}.
                              </td>
                              <td rowSpan={k.anggota.length} className={`${td} bg-white`}>
                                <div className="flex items-start justify-between gap-1">
                                  <span>{k.nama}</span>
                                  <button
                                    type="button"
                                    onClick={() => setRenameTarget({ pi: k.pi, ki: k.ki, namaLama: k.nama })}
                                    title="Ubah nama kelompok"
                                    className="shrink-0 text-slate-400 hover:text-[#1f4e8c]"
                                  >
                                    ✎
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                          <td className={td}>
                            <span className="text-slate-400 mr-1">{a.no}.</span>
                            {a.nama}
                          </td>
                          <td className={`${td} text-center`}>{a.nip}</td>
                          <td className={`${td} text-center`}>
                            <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full border text-[11px] font-normal ${lencana(a.keterangan)}`}>
                              {a.keterangan}
                            </span>
                          </td>
                          <td className={td}>{a.jabatan}</td>
                          <td className={`${td} border-r-0 text-center`}>
                            <button
                              type="button"
                              onClick={() => openEdit(a, p.nama, k.nama)}
                              className="rounded-full px-3 py-1 text-[11px] font-bold text-[#1f4e8c] hover:bg-[#eaf0fa]"
                            >
                              Edit
                            </button>
                          </td>
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
      </div>

      <FormTambahPeriset open={showTambah} data={data} onClose={() => setShowTambah(false)} onAdd={handleAdd} />
      <EditPeristModal target={editTarget} data={data} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} onKick={handleKick} />
      <RenameKelompokModal
        namaLama={renameTarget?.namaLama ?? null}
        onClose={() => setRenameTarget(null)}
        onSave={handleRenameKelompok}
      />
    </div>
  );
}