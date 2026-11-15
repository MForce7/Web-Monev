import { useState } from "react";

type RenameKelompokModalProps = {
  namaLama: string | null;
  onClose: () => void;
  onSave: (namaBaru: string) => void;
};

export default function RenameKelompokModal({ namaLama, onClose, onSave }: RenameKelompokModalProps) {
  const [nama, setNama] = useState(namaLama ?? "");

  if (namaLama === null) return null;

  const handleSave = () => {
    if (!nama.trim()) return;
    onSave(nama.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-[#1b3560]">Ubah Nama Kelompok Riset</h2>
        </div>
        <div className="p-6">
          <input
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
          />
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-white">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110"
            style={{ background: "linear-gradient(90deg, #1c3d85, #2a58a5)" }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}