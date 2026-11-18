import { useState } from "react";

import {
  GayaDropdown,
  KelompokRisetToolbar,
  KelompokRisetTable,
  ImportDataModal,
  useKelompokRiset,
  cetakPdf,
  parseFileKelompokRiset,
} from "../components/kelompokRiset";

export default function KelompokRisetPage() {
  const [mencetak, setMencetak] = useState(false);
  const [showImport, setShowImport] = useState(false);

    const {
    memuat,
    errorMuat,
    muatUlang,
    menyimpan,
    errorSimpan,

    modeEdit,
    pusat,
    setPusat,
    cari,
    setCari,
    tampil,
    total,
    opsiPusat,
    opsiKelompok,
    mulaiEdit,
    batalEdit,
    simpanEdit,

    tambahKelompok,
    hapusKelompok,
    ubahNamaKelompok,

    updatePeriset,
    tambahPeriset,
    hapusPeriset,
    gantiKoordinator,
    pindahPeriset,
    terapkanImportData,
  } = useKelompokRiset();

  async function handleCetak() {
    if (mencetak || modeEdit) return;

    try {
      setMencetak(true);
      await cetakPdf(pusat, cari, tampil);
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      alert("PDF gagal dibuat. Silakan coba kembali.");
    } finally {
      setMencetak(false);
    }
  }

  async function handleImportFile(file: File, mode: "ganti" | "tambah") {
    const dataBaru = await parseFileKelompokRiset(file);
    const hasil = terapkanImportData(dataBaru, mode);

    if (mode === "tambah" && hasil.dilewati > 0) {
      alert(
        `${hasil.ditambahkan} periset baru ditambahkan.\n${hasil.dilewati} periset dilewati karena NIP sudah terdaftar sebelumnya.`,
      );
    }
  }

  if (memuat) {
    return (
      <div className="mt-20 min-h-screen w-full bg-[#f4f4f4] flex items-center justify-center">
        <p className="text-sm text-slate-500">Memuat data kelompok riset...</p>
      </div>
    );
  }

  if (errorMuat) {
    return (
      <div className="mt-20 min-h-screen w-full bg-[#f4f4f4] flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">Gagal memuat data: {errorMuat}</p>

        <button
          type="button"
          onClick={muatUlang}
          className="px-4 py-2 rounded-full bg-[#1c3d85] text-white text-xs font-bold"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div
      className="mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden"
      translate="no"
    >
      <div className="p-6 md:p-8">
        <div className="bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 w-full max-w-full min-w-0">
          <GayaDropdown />

          {errorSimpan && (
            <p className="px-4 pt-4 text-xs text-red-600 bg-red-50 border-b border-red-100">
              Gagal menyimpan: {errorSimpan}
            </p>
          )}

          <KelompokRisetToolbar
            pusat={pusat}
            setPusat={setPusat}
            cari={cari}
            setCari={setCari}
            total={total}
            opsiPusat={opsiPusat}
            modeEdit={modeEdit}
            mencetak={mencetak}
            menyimpan={menyimpan}
            onMulaiEdit={mulaiEdit}
            onBatalEdit={batalEdit}
            onSimpanEdit={simpanEdit}
            onUpdateData={() => setShowImport(true)}
            onCetak={handleCetak}
          />

          <KelompokRisetTable
            tampil={tampil}
            modeEdit={modeEdit}
            opsiKelompok={opsiKelompok}
            onTambahKelompok={tambahKelompok}
            onHapusKelompok={hapusKelompok}
            onUbahNamaKelompok={ubahNamaKelompok}
            onUpdate={updatePeriset}
            onTambah={tambahPeriset}
            onHapus={hapusPeriset}
            onKoordinator={gantiKoordinator}
            onPindah={pindahPeriset}
          />

          <ImportDataModal
            open={showImport}
            onClose={() => setShowImport(false)}
            onImport={handleImportFile}
          />
        </div>
      </div>
    </div>
  );
}