import { useState } from "react";

import { unduhTemplateRekapPendanaan } from "../../lib/excelRekapPendanaan";

type ModeImport = "tambah" | "ganti";

type Props = {
  open: boolean;
  menyimpan: boolean;
  onClose: () => void;
  onImport: (file: File, mode: ModeImport) => Promise<void>;
};

const EKSTENSI_DIDUKUNG = [".xlsx", ".xls", ".csv"];
const UKURAN_MAKSIMUM = 10 * 1024 * 1024;

export default function ImportRekapPendanaanModal({
  open,
  menyimpan,
  onClose,
  onImport,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ModeImport>("tambah");
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState("");

  if (!open) return null;

  const pilihFile = (selected?: File) => {
    if (!selected) return;

    const extension = selected.name
      .slice(selected.name.lastIndexOf("."))
      .toLowerCase();

    if (!EKSTENSI_DIDUKUNG.includes(extension)) {
      setGalat("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv.");
      setFile(null);
      return;
    }

    if (selected.size > UKURAN_MAKSIMUM) {
      setGalat("Ukuran file maksimal 10 MB.");
      setFile(null);
      return;
    }

    setGalat("");
    setFile(selected);
  };

  const prosesImport = async () => {
    if (!file || memproses || menyimpan) return;

    try {
      setMemproses(true);
      setGalat("");
      await onImport(file, mode);
      onClose();
    } catch (error) {
      setGalat(
        error instanceof Error
          ? error.message
          : "Import gagal. Silakan coba kembali.",
      );
    } finally {
      setMemproses(false);
    }
  };

  const sibuk = memproses || menyimpan;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !sibuk) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-import-rekap-pendanaan"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="judul-import-rekap-pendanaan"
              className="text-lg font-bold text-[#1b3560]"
            >
              Import Rekap Pendanaan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Import dari Excel atau CSV. Unduh template untuk format kolom.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sibuk}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-[#1b3560]">
              Kolom wajib
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Skema, Ketua Periset, Judul, dan Pusat Riset. Kolom lain boleh
              kosong. Gunakan header yang tersedia di template.
            </p>
            <button
              type="button"
              onClick={unduhTemplateRekapPendanaan}
              disabled={sibuk}
              className="mt-3 rounded-full border border-[#2a58a5] bg-white px-4 py-2 text-xs font-bold text-[#1f468c] hover:bg-[#eef3fb] disabled:opacity-50"
            >
              Unduh Template Excel
            </button>
          </div>

          <fieldset disabled={sibuk} className="space-y-2">
            <legend className="mb-2 text-xs font-semibold text-[#1b3560]">
              Mode import
            </legend>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <input
                type="radio"
                name="mode-import-rekap-pendanaan"
                checked={mode === "tambah"}
                onChange={() => setMode("tambah")}
                className="mt-0.5"
              />
              <span>
                <span className="block text-xs font-semibold text-[#1b3560]">
                  Tambahkan ke data yang ada
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                  Baris dari file ditambahkan tanpa menghapus rekap yang sudah
                  tersimpan.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <input
                type="radio"
                name="mode-import-rekap-pendanaan"
                checked={mode === "ganti"}
                onChange={() => setMode("ganti")}
                className="mt-0.5"
              />
              <span>
                <span className="block text-xs font-semibold text-[#1b3560]">
                  Ganti seluruh data rekap pendanaan
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                  Hanya data di tabel rekap pendanaan yang diganti. Data
                  aktivitas dan logbook tidak diubah.
                </span>
              </span>
            </label>
          </fieldset>

          <label className="block cursor-pointer">
            <input
              type="file"
              accept={EKSTENSI_DIDUKUNG.join(",")}
              className="hidden"
              onChange={(event) => {
                pilihFile(event.target.files?.[0]);
                event.target.value = "";
              }}
              disabled={sibuk}
            />
            <span className="block rounded-xl border-2 border-dashed border-slate-300 p-7 text-center transition hover:border-[#2a58a5] hover:bg-blue-50/40">
              <span className="block text-sm font-semibold text-[#1b3560]">
                Klik untuk memilih file
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Excel (.xlsx, .xls) atau CSV (.csv), maksimal 10 MB
              </span>
            </span>
          </label>

          {file && (
            <p className="truncate rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              {file.name}
            </p>
          )}

          {galat && (
            <p
              role="alert"
              className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700"
            >
              {galat}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={sibuk}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void prosesImport()}
            disabled={!file || sibuk}
            className="rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "linear-gradient(90deg, #1c3d85, #2a58a5)" }}
          >
            {sibuk ? "Memproses..." : "Proses Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
