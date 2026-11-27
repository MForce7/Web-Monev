
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

type HasilImportDb = {
  total: number;
  berhasil: number;
  gagal: number;
  hasil: {
    email: string;
    nama: string;
    success: boolean;
    message: string;
    jumlahAktivitas?: number;
  }[];
};

type PropsImportExcel = {
  opsi: OpsiExcel;

  /**
   * Menerima EMAIL dan mengembalikan true
   * jika email sudah terdaftar.
   */
  sudahAda: (email: string) => boolean;

  /**
   * Wajib mengembalikan hasil proses import dari server.
   */
  onSimpan: (data: PerisetImport[]) => Promise<HasilImportDb>;

  onClose: () => void;
};

export function ImportExcelModal({
  opsi,
  sudahAda,
  onSimpan,
  onClose,
}: PropsImportExcel) {
  const [namaFile, setNamaFile] = useState("");
  const [hasil, setHasil] = useState<HasilParse | null>(null);

  const [membaca, setMembaca] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  const [galat, setGalat] = useState("");
  const [hasilSimpan, setHasilSimpan] =
    useState<HasilImportDb | null>(null);

  // =========================================================
  // MEMBACA FILE EXCEL
  // =========================================================

  const pilihFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Mengizinkan pengguna memilih file yang sama kembali.
    e.target.value = "";

    if (!file) return;

    setNamaFile(file.name);
    setHasil(null);
    setHasilSimpan(null);
    setGalat("");

    setMembaca(true);

    try {
      const hasilParse = await parseExcelPeriset(file, opsi);
      setHasil(hasilParse);
    } catch (err) {
      const pesan =
        err instanceof Error
          ? err.message
          : "File tidak bisa dibaca.";

      setGalat(pesan);
    } finally {
      setMembaca(false);
    }
  };

  // =========================================================
  // PERHITUNGAN DATA
  // =========================================================

  const jumlahAktivitas =
    hasil?.periset.reduce(
      (total, periset) => total + periset.aktivitas.length,
      0
    ) ?? 0;

  const bisaSimpan =
    !!hasil &&
    hasil.galat.length === 0 &&
    hasil.periset.length > 0 &&
    !menyimpan &&
    !membaca;

  const sudahSelesai = hasilSimpan !== null;

  // =========================================================
  // MENYIMPAN DATA KE SUPABASE
  // =========================================================

  const simpan = async () => {
    if (!hasil || !bisaSimpan) return;

    setMenyimpan(true);
    setGalat("");

    try {
      const hasilApi = await onSimpan(hasil.periset);

      // Jangan menganggap semua akun berhasil jika
      // callback tidak mengembalikan hasil server.
      if (!hasilApi) {
        throw new Error(
          "Proses import tidak mengembalikan hasil dari server."
        );
      }

      // Validasi struktur respons dasar.
      if (
        typeof hasilApi.total !== "number" ||
        typeof hasilApi.berhasil !== "number" ||
        typeof hasilApi.gagal !== "number" ||
        !Array.isArray(hasilApi.hasil)
      ) {
        throw new Error(
          "Format hasil import dari server tidak valid."
        );
      }

      setHasilSimpan(hasilApi);
    } catch (err) {
      const pesan =
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data import.";

      setGalat(pesan);
    } finally {
      setMenyimpan(false);
    }
  };

  // =========================================================
  // TAMPILAN
  // =========================================================

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-import-excel"
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-[#dbe6f7] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2
              id="judul-import-excel"
              className="text-lg font-extrabold text-[#1b3560] sm:text-xl"
            >
              Import periset dari Excel
            </h2>

            <p className="text-sm text-slate-600">
              Unduh template terbaru, isi seluruh kolom wajib,
              lalu unggah file Excel di sini. Kolom aktivitas
              dan informasi tambahan boleh dikosongkan.
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

        {/* KONTEN */}
        <div className="overflow-y-auto px-4 py-4 sm:px-6">
          {sudahSelesai ? (
            // =================================================
            // HASIL IMPORT
            // =================================================
            <div className="grid gap-4 py-3">
              <div className="rounded-xl border border-[#dbe6f7] p-4 text-center">
                <p className="text-lg font-extrabold text-[#1b3560]">
                  Import selesai
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {hasilSimpan.berhasil} berhasil dari{" "}
                  {hasilSimpan.total} akun;{" "}
                  {hasilSimpan.gagal} gagal.
                </p>
              </div>

              {hasilSimpan.hasil.length > 0 && (
                <div className="max-h-[360px] overflow-auto rounded-xl border border-[#dbe6f7]">
                  <table className="w-full min-w-[540px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-[#eaf0fa] font-bold text-[#1f4e8c]">
                      <tr>
                        <th className="px-3 py-2">Periset</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Keterangan</th>
                      </tr>
                    </thead>

                    <tbody>
                      {hasilSimpan.hasil.map((r, i) => (
                        <tr
                          key={`${r.email}-${i}`}
                          className="border-t border-[#e5edf8] align-top"
                        >
                          <td className="px-3 py-2 font-semibold">
                            {r.nama}
                          </td>

                          <td className="px-3 py-2">
                            {r.email}
                          </td>

                          <td
                            className={`px-3 py-2 font-bold ${
                              r.success
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {r.success ? "Berhasil" : "Gagal"}
                          </td>

                          <td className="px-3 py-2">
                            {r.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // =================================================
            // FORM IMPORT
            // =================================================
            <div className="grid gap-4 text-[#1b3560]">
              {/* DOWNLOAD TEMPLATE */}
              <div className="flex flex-col gap-3 rounded-xl bg-[#f5f8fd] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Unduh template terbaru, isi seluruh kolom
                  wajib, lalu unggah file Excel di sini.
                </p>

                <button
                  type="button"
                  onClick={() => unduhTemplate(opsi)}
                  disabled={membaca || menyimpan}
                  className="shrink-0 rounded-full border border-[#9db8e0] bg-white px-4 py-2 text-[13px] font-bold text-[#1f4e8c] hover:bg-[#eaf0fa] disabled:opacity-50"
                >
                  Unduh template Excel
                </button>
              </div>

              {/* FILE INPUT */}
              <div>
                <label
                  htmlFor="file-excel"
                  className="mb-1 block text-[13px] font-bold"
                >
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

                {namaFile && (
                  <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">
                    {namaFile}
                  </p>
                )}
              </div>

              {/* LOADING */}
              {membaca && (
                <p className="text-sm text-slate-500">
                  Membaca file…
                </p>
              )}

              {/* ERROR */}
              {galat && (
                <p
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3 py-2 text-xs font-semibold text-[#991b1b] [overflow-wrap:anywhere]"
                >
                  {galat}
                </p>
              )}

              {/* HASIL PARSING */}
              {hasil && (
                <>
                  <p className="text-sm">
                    Terbaca <b>{hasil.jumlahBaris} baris</b> dan
                    ditemukan{" "}
                    <b>{hasil.periset.length} akun periset</b>.
                    Aktivitas yang akan diimpor:{" "}
                    <b>{jumlahAktivitas}</b>.
                  </p>

                  {/* VALIDASI PARSER */}
                  {hasil.galat.length > 0 && (
                    <div
                      role="alert"
                      className="rounded-lg border border-[#fecaca] bg-[#fee2e2] px-3 py-2 text-xs text-[#991b1b]"
                    >
                      <p className="font-bold">
                        {hasil.galat.length} masalah ditemukan.
                        Perbaiki file Excel lalu unggah ulang.
                      </p>

                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {hasil.galat
                          .slice(0, MAKS_GALAT_TAMPIL)
                          .map((g, i) => (
                            <li key={i}>
                              Baris {g.baris}: {g.pesan}
                            </li>
                          ))}
                      </ul>

                      {hasil.galat.length > MAKS_GALAT_TAMPIL && (
                        <p className="mt-1">
                          dan{" "}
                          {hasil.galat.length - MAKS_GALAT_TAMPIL}{" "}
                          masalah lainnya.
                        </p>
                      )}
                    </div>
                  )}

                  {/* PREVIEW DATA */}
                  {hasil.periset.length > 0 && (
                    <div className="max-h-[280px] overflow-auto rounded-xl border border-[#dbe6f7]">
                      <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                        <thead className="sticky top-0 bg-[#eaf0fa] font-extrabold uppercase tracking-wide text-[#1f4e8c]">
                          <tr>
                            <th className="px-3 py-2">
                              Periset
                            </th>

                            <th className="px-3 py-2">
                              Email
                            </th>

                            <th className="px-3 py-2">
                              Unit kerja
                            </th>

                            <th className="px-3 py-2 text-center">
                              Aktivitas
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {hasil.periset.map((p) => {
                            const duplikat = sudahAda(p.email);

                            return (
                              <tr
                                key={p.email}
                                className="border-t border-[#e5edf8] align-top"
                              >
                                <td className="px-3 py-2 font-bold [overflow-wrap:anywhere]">
                                  {p.nama}

                                  {duplikat && (
                                    <span className="ml-2 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">
                                      email sudah terdaftar
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-2 [overflow-wrap:anywhere]">
                                  {p.email}
                                </td>

                                <td className="px-3 py-2 [overflow-wrap:anywhere]">
                                  {p.unitKerja}
                                </td>

                                <td className="px-3 py-2 text-center font-bold">
                                  {p.aktivitas.length}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <p className="text-xs text-slate-500">
                    Akun dengan email yang sudah terdaftar akan
                    ditandai oleh sistem ketika proses penyimpanan
                    berlangsung. Akun tersebut tidak akan ditimpa.
                  </p>

                  {hasil.periset.length === 0 &&
                    hasil.galat.length === 0 && (
                      <p className="text-xs text-amber-700">
                        Tidak ditemukan akun yang dapat diimpor.
                      </p>
                    )}
                </>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {sudahSelesai ? (
          <div className="flex justify-end border-t border-[#dbe6f7] bg-[#f5f8fd] px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#9db8e0] px-5 py-2.5 text-[13px] font-bold text-[#1f4e8c]"
            >
              Tutup
            </button>
          </div>
        ) : (
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
              <TombolGradasi
                besar
                onClick={() => void simpan()}
              >
                {menyimpan
                  ? "Menyimpan…"
                  : `Import ${hasil?.periset.length} akun`}
              </TombolGradasi>
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-400"
              >
                {menyimpan ? "Menyimpan…" : "Import"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
