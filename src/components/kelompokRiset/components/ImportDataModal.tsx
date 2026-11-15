import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
};

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".xls",
  ".csv",
  ".txt",
  ".json",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function ImportDataModal({
  open,
  onClose,
  onImport,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function handleFile(selected?: File) {
    if (!selected) return;

    const extension = selected.name
      .slice(selected.name.lastIndexOf("."))
      .toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Format file tidak didukung.");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 20 MB.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  }

  async function handleImport() {
    if (!file || loading) return;

    try {
      setLoading(true);
      setError("");

      await onImport(file);

      setFile(null);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Import gagal. Silakan coba kembali.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1b3560]">
              Update Data Kelompok Riset
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Import dokumen untuk memperbarui data
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 text-xl disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <div className="flex gap-3">
              <div className="text-[#2a58a5] text-xl">
                ⓘ
              </div>

              <div>
                <p className="text-sm font-semibold text-[#1b3560]">
                  Import dengan bantuan AI
                </p>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  File akan diproses untuk mengambil
                  informasi dan menyusunnya ke dalam
                  format data Kelompok Riset. Periksa
                  hasilnya sebelum memperbarui data.
                </p>
              </div>
            </div>
          </div>

          <label className="block cursor-pointer">
            <input
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) =>
                handleFile(e.target.files?.[0])
              }
              disabled={loading}
            />

            <div className="border-2 border-dashed border-slate-300 hover:border-[#2a58a5] hover:bg-blue-50/40 rounded-xl p-8 text-center transition">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-[#2a58a5] text-2xl">
                ↑
              </div>

              <p className="text-sm font-semibold text-[#1b3560] mt-3">
                Klik untuk memilih file
              </p>

              <p className="text-xs text-slate-500 mt-1">
                PDF, Word, Excel, CSV, JSON, PPTX,
                atau gambar
              </p>

              <p className="text-[11px] text-slate-400 mt-2">
                Maksimal 20 MB
              </p>
            </div>
          </label>

          {file && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#1b3560] flex items-center justify-center text-xs font-bold">
                FILE
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1b3560] truncate">
                  {file.name}
                </p>

                <p className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={loading}
                className="text-slate-400 hover:text-red-500 text-lg"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-white disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!file || loading}
            className="px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{
              background:
                "linear-gradient(90deg, #1c3d85, #2a58a5)",
            }}
          >
            {loading ? "Memproses..." : "Proses Import"}
          </button>
        </div>
      </div>
    </div>
  );
}