import { Fragment, useState } from "react";
import type { PerisetRingkas } from "../../lib/supabaseLogbookData";
import { kecil, kelasInput, PER_HALAMAN, type TargetHapus } from "./shared";

type DaftarPerisetTableProps = {
  dbList: PerisetRingkas[];
  dbMemuat: boolean;
  dbGalat: string;
  onRetry: () => void;
  onTambahAktivitas: (p: PerisetRingkas) => void;
  onRequestDelete: (target: TargetHapus) => void;
};

export function DaftarPerisetTable({
  dbList,
  dbMemuat,
  dbGalat,
  onRetry,
  onTambahAktivitas,
  onRequestDelete,
}: DaftarPerisetTableProps) {
  const [cari, setCari] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [terbuka, setTerbuka] = useState<Set<PerisetRingkas["id"]>>(() => new Set());

  const q = kecil(cari);
  const dbTampil = q
    ? dbList.filter(
        (p) =>
          kecil(p.nama).includes(q) ||
          kecil(p.unitKerja).includes(q) ||
          p.aktivitas.some((a) => kecil(a.judul).includes(q))
      )
    : dbList;

  const totalHalaman = Math.max(1, Math.ceil(dbTampil.length / PER_HALAMAN));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const awalHalaman = (halamanAktif - 1) * PER_HALAMAN;
  const dbHalaman = dbTampil.slice(awalHalaman, awalHalaman + PER_HALAMAN);

  const ubahTerbuka = (id: PerisetRingkas["id"]) =>
    setTerbuka((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
      <div className="border-b border-[#e5edf8] px-4 py-3 sm:px-5">
        <input
          type="search"
          value={cari}
          onChange={(e) => {
            setCari(e.target.value);
            setHalaman(1);
          }}
          placeholder="Cari nama, unit, atau judul aktivitas…"
          aria-label="Cari periset"
          className={`${kelasInput()} sm:max-w-md`}
        />
      </div>

      {dbGalat && (
        <div role="alert" className="border-b border-[#fecaca] bg-[#fee2e2] px-5 py-2 text-xs font-semibold text-[#991b1b]">
          <p className="[overflow-wrap:anywhere]">Gagal memuat daftar: {dbGalat}</p>
          <button type="button" onClick={onRetry} className="mt-1 underline">
            Coba lagi
          </button>
        </div>
      )}

      {dbMemuat ? (
        <p className="px-5 py-6 text-sm text-slate-500">Memuat daftar periset…</p>
      ) : dbTampil.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500">
          {dbList.length === 0
            ? "Belum ada periset di database. Klik “+ Periset baru” untuk menambahkan."
            : "Tidak ada yang cocok dengan pencarian."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#eaf0fa] text-xs font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                  <th scope="col" className="w-12 px-4 py-3 text-center">No</th>
                  <th scope="col" className="px-4 py-3">Periset</th>
                  <th scope="col" className="hidden px-4 py-3 md:table-cell">Unit kerja</th>
                  <th scope="col" className="w-24 px-4 py-3 text-center">Aktivitas</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dbHalaman.map((p, idx) => {
                  const buka = terbuka.has(p.id);
                  return (
                    <Fragment key={p.id}>
                      <tr className="border-t border-[#e5edf8] align-top hover:bg-[#f9fbfe]">
                        <td className="px-4 py-3 text-center text-xs text-slate-500">{awalHalaman + idx + 1}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => ubahTerbuka(p.id)}
                            aria-expanded={buka}
                            aria-label={`${buka ? "Sembunyikan" : "Lihat"} aktivitas ${p.nama}`}
                            className="flex items-start gap-2 text-left"
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-0.5 inline-block text-[10px] text-[#1f4e8c] transition-transform ${buka ? "rotate-90" : ""}`}
                            >
                              ▶
                            </span>
                            <span className="font-extrabold [overflow-wrap:anywhere]">{p.nama || "(tanpa nama)"}</span>
                          </button>
                          <p className="ml-[18px] text-xs text-slate-500 md:hidden [overflow-wrap:anywhere]">
                            {p.unitKerja || "Tanpa unit kerja"}
                          </p>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell [overflow-wrap:anywhere]">
                          {p.unitKerja || "–"}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{p.aktivitas.length}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onTambahAktivitas(p)}
                              aria-label={`Tambah aktivitas untuk ${p.nama}`}
                              className="rounded-full border border-[#9db8e0] px-3 py-1 text-xs font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
                            >
                              + Aktivitas
                            </button>
                            {p.aktivitas.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRequestDelete({
                                    sumber: "db",
                                    tipe: "periset",
                                    nama: p.nama,
                                    aktivitas: p.aktivitas.map((a) => ({ id: a.id, judul: a.judul })),
                                  })
                                }
                                aria-label={`Hapus semua aktivitas ${p.nama}`}
                                className="rounded-full border border-[#fecaca] px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                              >
                                Hapus aktivitas
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                onRequestDelete({
                                  sumber: "db",
                                  tipe: "akun",
                                  id: p.id,
                                  nama: p.nama,
                                  jumlahAktivitas: p.aktivitas.length,
                                })
                              }
                              aria-label={`Hapus akun ${p.nama}`}
                              className="rounded-full bg-[#991b1b] px-3 py-1 text-xs font-bold text-white hover:bg-[#7f1d1d]"
                            >
                              Hapus akun
                            </button>
                          </div>
                        </td>
                      </tr>

                      {buka && (
                        <tr className="bg-[#f5f8fd]">
                          <td colSpan={5} className="px-4 pb-4 pt-1 sm:pl-16">
                            {p.aktivitas.length === 0 ? (
                              <p className="text-xs italic text-slate-400">Belum ada aktivitas.</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {p.aktivitas.map((a) => (
                                  <li key={a.id} className="flex items-start gap-2 rounded-lg border border-[#e5edf8] bg-white px-3 py-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[13px] font-semibold [overflow-wrap:anywhere]">
                                        {a.judul || "(tanpa judul)"}
                                      </p>
                                      <p className="text-[11px] text-slate-500">
                                        {a.status || "Status belum diisi"} · {a.progres}%
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onRequestDelete({ sumber: "db", tipe: "aktivitas", id: a.id, judul: a.judul, nama: p.nama })
                                      }
                                      aria-label={`Hapus aktivitas ${a.judul}`}
                                      className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
                                    >
                                      Hapus
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#e5edf8] px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>
              Menampilkan {awalHalaman + 1}–{awalHalaman + dbHalaman.length} dari {dbTampil.length} periset
            </span>
            {totalHalaman > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHalaman(halamanAktif - 1)}
                  disabled={halamanAktif <= 1}
                  className="rounded-full border border-[#9db8e0] px-3 py-1 font-bold text-[#1f4e8c] hover:bg-[#f5f8fd] disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="font-semibold text-[#1b3560]">{halamanAktif} / {totalHalaman}</span>
                <button
                  type="button"
                  onClick={() => setHalaman(halamanAktif + 1)}
                  disabled={halamanAktif >= totalHalaman}
                  className="rounded-full border border-[#9db8e0] px-3 py-1 font-bold text-[#1f4e8c] hover:bg-[#f5f8fd] disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}