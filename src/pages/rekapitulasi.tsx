import { useEffect, useMemo, useState } from "react";
import Sidebar, { type PaletSidebar } from "../components/rekapitulasi/Sidebar.tsx";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import DropdownBulan from "../components/rekapitulasi/DropdownBulan.tsx";
import DropdownPusatRiset from "../components/rekapitulasi/DropdownPusatRiset.tsx";
import { CFC, RIIM, PRIS, Purwarupa, Model, Publikasi, KI, Paten, HakCipta } from "../config/Index.ts";
import {
  fetchRekapitulasi,
  type DataRekapitulasi,
} from "../lib/supabaseRekapitulasi";

const logbook = { CFC, RIIM, PRIS } as const; // menu yang memakai dropdown
const output = { Purwarupa, Model, Publikasi, KI, Paten, "Hak Cipta": HakCipta } as const;

/* ---------- Palet: ganti di sini saja ---------- */
const HEADER = "linear-gradient(90deg, #1b3f78 0%, #2a5aa8 100%)"; // header sidebar

const itemSidebar = {
  bg: "#f5f8fd",       // latar daftar
  hover: "#eaf0fa",    // hover item
  aktif: "#dbe6f7",    // item terpilih
  bar: "transparent",  // garis vertikal dimatikan
  ring: "transparent", // cincin dimatikan
};

const WARNA_SIDEBAR: PaletSidebar = {
  logbook: { grad: HEADER, ...itemSidebar },
  output: { grad: HEADER, ...itemSidebar },
  teks: "#1b3560",
};

const NAVY = "#1b3560";
const KOBALT = "#2a5aa8";

/* ---------- Jaring pengaman ----------
   Warna tabel 2, tabel 3, dan dropdown sudah diatur di komponennya masing-masing.
   Bagian ini hanya menangkap sisa kelas merah bawaan Tailwind di komponen lain
   (misalnya tabel Rekap Logbook) supaya tidak ada merah yang lolos. */
const CSS_TEMA = `
.tabel-biru [class~="bg-red-50"], .tabel-biru [class~="bg-red-100"], .tabel-biru [class~="bg-red-200"],
.tabel-biru [class~="bg-rose-50"], .tabel-biru [class~="bg-rose-100"], .tabel-biru [class~="bg-rose-200"] {
  background-color: ${itemSidebar.aktif} !important;
}
.tabel-biru [class~="bg-red-300"], .tabel-biru [class~="bg-red-400"], .tabel-biru [class~="bg-red-500"],
.tabel-biru [class~="bg-rose-300"], .tabel-biru [class~="bg-rose-400"], .tabel-biru [class~="bg-rose-500"] {
  background-color: ${KOBALT} !important;
}
.tabel-biru [class~="bg-red-600"], .tabel-biru [class~="bg-red-700"], .tabel-biru [class~="bg-red-800"],
.tabel-biru [class~="bg-rose-600"], .tabel-biru [class~="bg-rose-700"] {
  background-color: #1b3f78 !important;
}
.tabel-biru [class*="text-red-"], .tabel-biru [class*="text-rose-"] { color: ${NAVY} !important; }
.tabel-biru [class*="border-red-"], .tabel-biru [class*="border-rose-"] { border-color: ${itemSidebar.aktif} !important; }
`;

export default function Rekapitulasi() {
  const [menu, setMenu] = useState("CFC");
  const [bulan, setBulan] = useState<string | null>(null);
  const [pusatRiset, setPusatRiset] = useState<string | null>(null);
  const [dataRekap, setDataRekap] = useState<DataRekapitulasi>({
    logbook: [],
    output: [],
  });
  const [memuatRekap, setMemuatRekap] = useState(true);
  const [galatRekap, setGalatRekap] = useState<string | null>(null);
  const [percobaanMuat, setPercobaanMuat] = useState(0);

  useEffect(() => {
    let aktif = true;

    fetchRekapitulasi()
      .then((data) => {
        if (aktif) {
          setDataRekap(data);
          setGalatRekap(null);
        }
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat rekapitulasi:", error);
        if (aktif) {
          setGalatRekap(
            error instanceof Error
              ? error.message
              : "Data rekapitulasi gagal dimuat dari Supabase.",
          );
        }
      })
      .finally(() => {
        if (aktif) setMemuatRekap(false);
      });

    return () => {
      aktif = false;
    };
  }, [percobaanMuat]);

  const opsiPusatRiset = useMemo(
    () => [
      ...Array.from(
        new Set(dataRekap.logbook.map((baris) => baris.pusatRiset).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "id")),
      "Semua Pusat Riset",
    ],
    [dataRekap.logbook],
  );

  const cobaMuatUlang = () => {
    setMemuatRekap(true);
    setGalatRekap(null);
    setPercobaanMuat((nilai) => nilai + 1);
  };

  // `null` kalau menu yang dipilih bukan milik kelompok itu (memperbaiki error TS 2774)
  const Logbook = menu in logbook ? logbook[menu as keyof typeof logbook] : null;
  const Output = menu in output ? output[menu as keyof typeof output] : null;

  return (
    <div className="mt-20 flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-[#f2f5fa]" translate="no">
      <style>{CSS_TEMA}</style>
      {/* HP: sidebar di atas (menumpuk), tablet ke atas: sidebar di kiri */}
      <div className="flex min-w-0 flex-1 flex-col md:flex-row">
        <Sidebar active={menu} onChange={setMenu} warna={WARNA_SIDEBAR} />
        <main className="min-w-0 flex-1">
          {/* Bilah instansi: dipakai apa adanya, sama persis dengan Rekap Pendanaan */}
          <InstansiBar />

          <div className="min-w-0 px-3 pb-4 pt-3 sm:px-4 md:px-6 md:pt-4">
            {Logbook && (
              <div className="mx-auto mb-3 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                <DropdownBulan value={bulan} onChange={setBulan} />
                <DropdownPusatRiset
                  value={pusatRiset}
                  onChange={setPusatRiset}
                  opsi={opsiPusatRiset}
                />
              </div>
            )}
            <div className="tabel-biru min-w-0">
              {Logbook ? (
                memuatRekap ? (
                  <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
                    Memuat rekapitulasi dari Supabase...
                  </p>
                ) : galatRekap ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 text-center">
                    <p role="alert" className="text-sm text-red-600">
                      Gagal memuat data: {galatRekap}
                    </p>
                    <button
                      type="button"
                      onClick={cobaMuatUlang}
                      className="rounded-full bg-[#1b3f78] px-4 py-2 text-xs font-bold text-white"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : (
                  <Logbook
                    bulan={bulan}
                    pusatRiset={pusatRiset}
                    data={dataRekap.logbook}
                  />
                )
              ) : Output ? (
                memuatRekap ? (
                  <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
                    Memuat rekapitulasi dari Supabase...
                  </p>
                ) : galatRekap ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 text-center">
                    <p role="alert" className="text-sm text-red-600">
                      Gagal memuat data: {galatRekap}
                    </p>
                    <button
                      type="button"
                      onClick={cobaMuatUlang}
                      className="rounded-full bg-[#1b3f78] px-4 py-2 text-xs font-bold text-white"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : (
                  <Output data={dataRekap.output} />
                )
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}