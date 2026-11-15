import { useState } from "react";
import type { Periset, PusatRiset } from "../../types/periset";

type EditTarget = { periset: Periset; pusatRiset: string; kelompokRiset: string };

type EditPeristModalProps = {
  target: EditTarget | null;
  data: PusatRiset[];
  onClose: () => void;
  onSave: (updated: Periset, pusatBaru: string, kelompokBaru: string) => void;
  onKick: () => void;
};

export default function EditPeristModal({ target, data, onClose, onSave, onKick }: EditPeristModalProps) {
  const [draft, setDraft] = useState<Periset | null>(target?.periset ?? null);
  const [pusatBaru, setPusatBaru] = useState(target?.pusatRiset ?? "");
  const [kelompokBaru, setKelompokBaru] = useState(target?.kelompokRiset ?? "");
  const [confirmKick, setConfirmKick] = useState(false);

  // Sinkronkan draft setiap kali target berganti
  if (target && draft?.nip !== target.periset.nip) {
    setDraft(target.periset);
    setPusatBaru(target.pusatRiset);
    setKelompokBaru(target.kelompokRiset);
    setConfirmKick(false);
  }

  if (!target || !draft) return null;

  const kelompokOptions = data.find((p) => p.nama === pusatBaru)?.kelompok.map((k) => k.nama) ?? [];

  const setField = <K extends keyof Periset>(key: K, value: Periset[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const pilihPusat = (nama: string) => {
    const kelompokPertama = data.find((p) => p.nama === nama)?.kelompok[0]?.nama ?? "";
    setPusatBaru(nama);
    setKelompokBaru(kelompokPertama);
  };

  const handleSave = () => {
    onSave(draft, pusatBaru, kelompokBaru);
    onClose();
  };

  const handleKick = () => {
    onKick();
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
            <h2 className="text-lg font-bold text-[#1b3560]">Edit Periset</h2>
            <p className="text-xs text-slate-500 mt-1">{target.periset.nama}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 text-xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#1b3560]">Nama</label>
            <input
              value={draft.nama}
              onChange={(e) => setField("nama", e.target.value)}
              className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#1b3560]">NIP</label>
              <input
                value={draft.nip}
                onChange={(e) => setField("nip", e.target.value)}
                className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#1b3560]">Jabatan</label>
              <input
                value={draft.jabatan}
                onChange={(e) => setField("jabatan", e.target.value)}
                className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#1b3560]">Keterangan</label>
            <input
              value={draft.keterangan}
              onChange={(e) => setField("keterangan", e.target.value)}
              placeholder="mis. Koordinator, Ketua, Anggota"
              className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#1b3560]">Pusat Riset</label>
              <select
                value={pusatBaru}
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
                value={kelompokBaru}
                onChange={(e) => setKelompokBaru(e.target.value)}
                className="w-full rounded-lg border border-[#9db8e0] bg-white px-3 py-2 text-sm text-[#1b3560] focus:outline-none focus:ring-2 focus:ring-[#2a5aa8]"
              >
                {kelompokOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {(pusatBaru !== target.pusatRiset || kelompokBaru !== target.kelompokRiset) && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Periset akan dipindahkan ke "{kelompokBaru}" di "{pusatBaru}".
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {confirmKick ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[#991b1b]">Keluarkan periset ini?</span>
              <button type="button" onClick={handleKick} className="rounded-full bg-[#991b1b] px-3 py-1.5 font-bold text-white hover:brightness-110">
                Ya, keluarkan
              </button>
              <button type="button" onClick={() => setConfirmKick(false)} className="rounded-full px-3 py-1.5 font-semibold text-slate-600 hover:bg-white">
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmKick(true)}
              className="rounded-full border border-[#991b1b] px-4 py-2 text-xs font-bold text-[#991b1b] hover:bg-[#fee2e2]"
            >
              Keluarkan Periset
            </button>
          )}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-white">
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110"
              style={{ background: "linear-gradient(90deg, #1c3d85, #2a58a5)" }}
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}