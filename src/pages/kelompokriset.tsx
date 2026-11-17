import { useState } from "react";

import {
  GayaDropdown,
  KelompokRisetToolbar,
  KelompokRisetTable,
  ImportDataModal,
  useKelompokRiset,
  cetakPdf,
} from "../components/kelompokRiset";

export default function KelompokRisetPage() {
  const [mencetak, setMencetak] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const {
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
    // terapkanImportData dipakai di handleImportFile setelah integrasi selesai
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

  async function handleImportFile(file: File) {
    console.log("File yang akan diimport:", file);

    // TODO:
    // Hubungkan ke Supabase Edge Function.
    // Kirim file ke Gemini untuk dikonversi menjadi JSON.
    // Setelah JSON diterima, panggil:
    //   terapkanImportData(hasilJson, "ganti" | "tambah");
    // (validasi struktur sudah dilakukan di dalam hook)

    throw new Error(
      "Integrasi Gemini dan Supabase belum dihubungkan.",
    );
  }

  return (
    <div className="mt-20 min-h-screen w-full bg-[#f4f4f4] overflow-hidden" translate="no">
      <div className="p-6 md:p-8">
        <div className="bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] border border-slate-200 w-full max-w-full min-w-0">
          <GayaDropdown />

          <KelompokRisetToolbar
            pusat={pusat}
            setPusat={setPusat}
            cari={cari}
            setCari={setCari}
            total={total}
            opsiPusat={opsiPusat}
            modeEdit={modeEdit}
            mencetak={mencetak}
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