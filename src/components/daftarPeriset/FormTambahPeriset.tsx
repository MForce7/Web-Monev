import { useState } from "react";
import type { Periset, PusatRiset } from "../../types/periset";

type FormTambahPeristProps = {
  open: boolean;
  data: PusatRiset[];
  onClose: () => void;
  onAdd: (periset: Periset, pusatRiset: string, kelompokRiset: string) => void;
};

const AWAL = { nama: "", nip: "", jabatan: "", keterangan: "Anggota" };

export default function FormTambahPeriset({ open, data, onClose, onAdd }: FormTambahPeristProps) {
  const [form, setForm] = useState(AWAL);
  const [pusat, setPusat] = useState(data[0]?.nama ?? "");
  const [kelompok, setKelompok] = useState(data[0]?.kelompok[0]?.nama ?? "");
  const [error, setError] = useState("");

  if (!open) return null;

  const setField = <K extends keyof typeof AWAL>(key: K, value: typeof AWAL[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const kelompokOptions = data.find((p) => p.nama === pusat)?.kelompok.map((k) => k.nama) ?? [];

  const pilihPusat = (nama: string) => {
    setPusat(nama);
    setKelompok(data.find((p) => p.nama === nama)?.kelompok[0]?.nama ?? "");
  };

  const handleSubmit = () => {
    if (!form.nama.trim()) {
      setError("Nama periset wajib diisi.");
      return;
    }
    if (!pusat || !kelompok) {
      setError("Pusat riset dan kelompok riset wajib dipilih.");
      return;
    }

    onAdd(
      { nama: form.nama.trim(), nip: form.nip.trim(), jabatan: form.jabatan.trim(), keterangan: form.keterangan.trim() || "Anggota" },
      pusat,
      kelompok
    );

    setForm(AWAL);
    setError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1b3560]">Tambah Periset Baru</h2>
            <p className="text-xs text-slate-500 mt-1">Masukkan data periset dan kelompok risetnya</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 text-xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#1b3560]">
              Nama Periset <span className="text-[#991b1b]">*</span>
            </label>
            <input
              value={form.nama}
              onChange={(e) => setField("nama", e.target.value)}
              placeholder="mis. Dr. Nama Lengkap, M.Si."
              className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#1b3560]">NIP</label>
              <input
                value={form.nip}
                onChange={(e) => setField("nip", e.target.value)}
                className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#1b3560]">Jabatan</label>
              <input
                value={form.jabatan}
                onChange={(e) => setField("jabatan", e.target.value)}
                placeholder="mis. Peneliti Ahli Muda"
                className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#1b3560]">Keterangan</label>
            <input
              value={form.keterangan}
              onChange={(e) => setField("keterangan", e.target.value)}
              placeholder="mis. Koordinator, Ketua, Anggota"
              className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#1b3560]">Pusat Riset</label>
              <select
                value={pusat}
                onChange={(e) => pilihPusat(e.target.value)}
                className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              >
                {data.map((p) => (
                  <option key={p.nama} value={p.nama}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#1b3560]">Kelompok Riset</label>
              <select
                value={kelompok}
                onChange={(e) => setKelompok(e.target.value)}
                className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              >
                {kelompokOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-white">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110"
            style={{ background: "linear-gradient(90deg, #1c3d85, #2a58a5)" }}
          >
            Tambah Periset
          </button>
        </div>
      </div>
    </div>
  );
}