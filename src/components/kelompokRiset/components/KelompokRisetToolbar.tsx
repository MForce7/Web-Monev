import type { CSSProperties } from "react";

import Dropdown from "../../rekapitulasi/Dropdown";

import { GRAD_BIRU, GRAD_BIRU_TUA } from "../constants";

type Props = {
  pusat: string;
  setPusat: (value: string) => void;

  cari: string;
  setCari: (value: string) => void;

  total: {
    kelompok: number;
    periset: number;
  };

  opsiPusat: string[];

  modeEdit: boolean;
  mencetak: boolean;
  menyimpan: boolean;

  onMulaiEdit: () => void;
  onBatalEdit: () => void;
  onSimpanEdit: () => void;
  onUpdateData: () => void;
  onCetak: () => void;
};

export default function KelompokRisetToolbar({
  pusat,
  setPusat,
  cari,
  setCari,
  total,
  opsiPusat,
  modeEdit,
  mencetak,
  menyimpan,
  onMulaiEdit,
  onBatalEdit,
  onSimpanEdit,
  onUpdateData,
  onCetak,
}: Props) {
  // Lebar dropdown mengikuti pilihan terpanjang (ch) + ruang panah.
  // Dipasang lewat variabel CSS supaya hanya berlaku dari layar sm ke atas;
  // di HP dropdown selebar layar.
  const lebarDd = {
    "--w": `calc(${Math.max(...opsiPusat.map((o) => o.length))}ch + 4.75rem)`,
  } as CSSProperties;

  const tombol =
    "h-10 sm:h-9 px-4 text-white rounded-full text-xs font-bold shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100";

  return (
    <>
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 rounded-t-2xl sm:rounded-t-3xl flex flex-wrap items-center gap-3">
        <h3 className="font-bold text-[#1b3560] text-sm w-full md:w-auto md:flex-1 md:min-w-[220px]">
          Kelompok Riset ORPA Tahun Anggaran 2026
          <span className="block sm:inline sm:ml-2 text-xs font-normal text-slate-500">
            {total.kelompok} kelompok · {total.periset} periset
          </span>
          {modeEdit && (
            <span className="mt-1 block text-[11px] font-semibold text-amber-700">
              Mode edit: perubahan baru tersimpan setelah klik Simpan Perubahan.
            </span>
          )}
        </h3>

        {/* HP: grid 2 kolom. sm ke atas: baris fleksibel yang menempel di kanan */}
        <div className="w-full md:w-auto md:ml-auto grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari kelompok, nama, NIP, jabatan..."
            className="col-span-2 h-10 sm:h-9 w-full sm:w-52 min-w-0 px-4 border border-[#dbe6f7] rounded-full text-xs text-[#1b3560] bg-white focus:outline-none focus:border-[#2a5aa8] focus:ring-2 focus:ring-[#2a5aa8]/30"
          />

          <div
            className="dd-kecil col-span-2 sm:col-span-1 min-w-0 sm:w-[var(--w)]"
            style={lebarDd}
          >
            Edit Data
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onBatalEdit}
              disabled={menyimpan}
              className="h-9 px-4 border border-slate-300 bg-white text-slate-600 rounded-full text-xs font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>

          {!modeEdit ? (
            <button
              type="button"
              onClick={onSimpanEdit}
              disabled={menyimpan}
              className="h-9 px-4 text-white rounded-full text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: GRAD_BIRU_TUA }}
            >
              {menyimpan ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          ) : (
            // Di HP, tombol Batal/Simpan ada di bar bawah layar (lihat di bawah)
            <>
              <button
                type="button"
                onClick={onBatalEdit}
                className="hidden md:inline-flex items-center justify-center h-9 px-4 border border-slate-300 bg-white text-slate-600 rounded-full text-xs font-bold hover:bg-slate-100"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={onSimpanEdit}
                className={`hidden md:inline-flex items-center justify-center ${tombol}`}
                style={{ background: GRAD_BIRU_TUA }}
              >
                Simpan Perubahan
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onUpdateData}
            className={tombol}
            style={{ background: GRAD_BIRU_TUA }}
          >
            + Update Data
          </button>

          <button
            type="button"
            onClick={onCetak}
            disabled={mencetak || modeEdit}
            title="Unduh data sebagai backup PDF"
            className={`${modeEdit ? "" : "col-span-2 sm:col-span-1"} ${tombol}`}
            style={{ background: GRAD_BIRU }}
          >
            {mencetak ? "Membuat PDF..." : "Backup PDF"}
          </button>
        </div>
      </div>

      {/* Bar bawah layar khusus HP saat mode edit, supaya tidak perlu scroll ke atas untuk menyimpan */}
      {modeEdit && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-slate-200 bg-white/95 px-3 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.10)] backdrop-blur md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={onBatalEdit}
            className="h-10 flex-1 rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSimpanEdit}
            className="h-10 flex-[2] rounded-full text-xs font-bold text-white shadow-md hover:brightness-110"
            style={{ background: GRAD_BIRU_TUA }}
          >
            Simpan Perubahan
          </button>
        </div>
      )}
    </>
  );
}