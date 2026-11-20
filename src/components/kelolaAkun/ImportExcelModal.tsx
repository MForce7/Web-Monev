import { useState, type ChangeEvent } from "react";
import TombolGradasi from "../importjson/TombolGradasi";
import {
  parseExcelPeriset,
  unduhTemplate,
  type HasilParse,
  type OpsiExcel,
  type PerisetImport,
} from "../../lib/excelPeriset";

const MAKS_GALAT_TAMPIL = 15;

type PropsImportExcel = {
  opsi: OpsiExcel;
  /** true jika nama periset sudah terdaftar di database */
  sudahAda: (nama: string) => boolean;
  onSimpan: (data: PerisetImport[]) => Promise<void>;
  onClose: () => void;
};

export function ImportExcelModal({ opsi, sudahAda, onSimpan, onClose }: PropsImportExcel) {
  const [namaFile, setNamaFile] = useState("");
  const [hasil, setHasil] = useState<HasilParse | null>(null);
  const [membaca, setMembaca] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState("");
  const [selesai, setSelesai] = useState<number | null>(null);

  const pilihFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // boleh memilih file yang sama lagi setelah diperbaiki
    if (!file) return;

    setNamaFile(file.name);
    setHasil(null);
    setGalat("");
    setMembaca(true);
    try {
      setHasil(await parseExcelPeriset(file, opsi));
    } catch (err) {
      setGalat((err as Error).message || "File tidak bisa dibaca.");
    } finally {
      setMembaca(false);
    }
  };

  const jumlahAktivitas = hasil?.periset.reduce((n, p) => n + p.aktivitas.length, 0) ?? 0;
  const bisaSimpan = !!hasil && hasil.galat.length === 0 && hasil.periset.length > 0 && !menyimpan;

  const simpan = async () => {
    if (!hasil || !bisaSimpan) return;
    setMenyimpan(true);
    setGalat("");
    try {
      await onSimpan(hasil.periset);
      setSelesai(hasil.periset.length);
    } catch (err) {
      setGalat((err as Error).message || "Gagal menyimpan data import.");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-import-excel"
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#dbe6f7] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="judul-import-excel" className="text-lg font-extrabold text-[#1b3560] sm:text-xl">
              Import periset dari Excel
            </h2>
            <p className="text-[13px] text-slate-500">
              Unggah file template yang sudah diisi periset. Satu baris = satu aktivitas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={menyimpan}
            aria-label="Tutup"
            className="shrink-0 rounded-full px-3 py-1.5 text-lg font-bold leading-none text-slate-500 hover:bg-[#eaf0fa] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6">
          {selesai !== null ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#166534" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </div>
              <p className="text-lg font-extrabold text-[#1b3560]">{selesai} periset berhasil diimport</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-full border border-[#9db8e0] px-5 py-2.5 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#f5f8fd]"
              >
                Tutup
              </button>
            </div>
          ) : (
            <div className="grid gap-4 text-[#1b3560]">
              <div className="flex flex-col gap-3 rounded-xl bg-[#f5f8fd] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Belum punya template? Unduh, bagikan ke periset, lalu unggah hasil isiannya di sini.
                </p>
                <button
                  type="button"
                  onClick={() => unduhTemplate(opsi)}
                  className="shrink-0 rounded-full border border-[#9db8e0] bg-white px-4 py-2 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#eaf0fa]"
                >
                  Unduh template Excel
                </button>
              </div>

              <div>
                <label htmlFor="file-excel" className="mb-1 block text-[13px] font-bold">
                  File Excel (.xlsx)
                </label>
                <input
                  id="file-excel"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => void pilihFile(e)}
                  disabled={membaca || menyimpan}
                  className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#1f4e8c] file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-white hover:file:bg-[#2a5aa8]"
                />
                {namaFile && <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">{namaFile}</p>}
              </div>

              {membaca && <p className="text-sm text-slate-500">Membaca file…</p>}

              {galat && (
                <p role="alert" className="rounded-lg bg-[#fee2e2] px-3 py-2 text-xs font-semibold text-[#991b1b] [overflow-wrap:anywhere]">
                  {galat}
                </p>
              )}

              {hasil && (
                <>
                  <p className="text-sm">
                    Terbaca <b>{hasil.jumlahBaris} baris</b>: <b>{hasil.periset.length} periset</b> dengan{" "}
                    <b>{jumlahAktivitas} aktivitas</b> valid.
                  </p>

                  {hasil.galat.length > 0 && (
                    <div role="alert" className="rounded-lg border border-[#fecaca] bg-[#fee2e2] px-3 py-2 text-xs text-[#991b1b]">
                      <p className="font-bold">
                        {hasil.galat.length} masalah ditemukan. Perbaiki file Excel lalu unggah ulang.
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {hasil.galat.slice(0, MAKS_GALAT_TAMPIL).map((g, i) => (
                          <li key={i} className="[overflow-wrap:anywhere]">
                            Baris {g.baris}: {g.pesan}
                          </li>
                        ))}
                      </ul>
                      {hasil.galat.length > MAKS_GALAT_TAMPIL && (
                        <p className="mt-1">dan {hasil.galat.length - MAKS_GALAT_TAMPIL} masalah lainnya.</p>
                      )}
                    </div>
                  )}

                  {hasil.periset.length > 0 && (
                    <div className="max-h-[260px] overflow-auto rounded-xl border border-[#dbe6f7]">
                      <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                        <thead className="sticky top-0 bg-[#eaf0fa] font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                          <tr>
                            <th scope="col" className="px-3 py-2">Periset</th>
                            <th scope="col" className="px-3 py-2">Email</th>
                            <th scope="col" className="px-3 py-2">Unit kerja</th>
                            <th scope="col" className="px-3 py-2 text-center">Aktivitas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hasil.periset.map((p) => (
                            <tr key={p.nama} className="border-t border-[#e5edf8] align-top">
                              <td className="px-3 py-2 font-bold [overflow-wrap:anywhere]">
                                {p.nama}
                                {sudahAda(p.nama) && (
                                  <span className="ml-2 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">
                                    sudah terdaftar
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 [overflow-wrap:anywhere]">{p.email}</td>
                              <td className="px-3 py-2 [overflow-wrap:anywhere]">{p.unitKerja}</td>
                              <td className="px-3 py-2 text-center font-bold">{p.aktivitas.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {selesai === null && (
          <div className="flex flex-col-reverse gap-2 border-t border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={menyimpan}
              className="rounded-full px-[18px] py-2.5 text-[13px] font-bold hover:bg-white disabled:opacity-60"
            >
              Batal
            </button>
            {bisaSimpan ? (
              <TombolGradasi besar onClick={() => void simpan()}>
                Simpan {hasil?.periset.length} periset
              </TombolGradasi>
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-400"
              >
                {menyimpan ? "Menyimpan…" : "Simpan"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}