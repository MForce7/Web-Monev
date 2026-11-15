import Dropdown from "../../rekapitulasi/Dropdown";

import {
  GRAD_BIRU,
  GRAD_BIRU_TUA,
  LEBAR_DROPDOWN,
} from "../constants";

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
  onMulaiEdit,
  onBatalEdit,
  onSimpanEdit,
  onUpdateData,
  onCetak,
}: Props) {
  return (
    <div className="p-4 bg-slate-50 border-b border-slate-200 rounded-t-3xl flex flex-wrap items-center gap-3">
      <h3 className="font-bold text-[#1b3560] text-sm min-w-[220px] flex-1">
        Kelompok Riset ORPA Tahun Anggaran 2026

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

        <div
          className="dd-kecil max-w-full"
          style={LEBAR_DROPDOWN}
        >
          <Dropdown
            label="Semua Pusat Riset"
            options={opsiPusat}
            value={pusat}
            onChange={setPusat}
          />
        </div>

        {!modeEdit ? (
          <button
            type="button"
            onClick={onMulaiEdit}
            className="h-9 px-4 text-white rounded-full text-xs font-bold shadow-md transition hover:brightness-110"
            style={{ background: GRAD_BIRU_TUA }}
          >
            Edit Data
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onBatalEdit}
              className="h-9 px-4 border border-slate-300 bg-white text-slate-600 rounded-full text-xs font-bold hover:bg-slate-100"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={onSimpanEdit}
              className="h-9 px-4 text-white rounded-full text-xs font-bold shadow-md hover:brightness-110"
              style={{ background: GRAD_BIRU_TUA }}
            >
              Simpan Perubahan
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onUpdateData}
          className="h-9 px-4 text-white rounded-full text-xs font-bold shadow-md transition hover:brightness-110"
          style={{ background: GRAD_BIRU_TUA }}
        >
          + Update Data
        </button>

        <button
          type="button"
          onClick={onCetak}
          disabled={mencetak || modeEdit}
          title="Unduh data sebagai backup PDF"
          className="h-9 px-4 text-white rounded-full text-xs font-bold shadow-md transition disabled:cursor-not-allowed disabled:opacity-50 hover:brightness-110"
          style={{ background: GRAD_BIRU }}
        >
          {mencetak ? "Membuat PDF..." : "Backup PDF"}
        </button>
      </div>
    </div>
  );
}