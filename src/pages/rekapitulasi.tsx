import { useState } from "react";
import Sidebar, { type PaletSidebar } from "../components/rekapitulasi/Sidebar.tsx";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import DropdownBulan from "../components/rekapitulasi/DropdownBulan.tsx";
import DropdownPusatRiset from "../components/rekapitulasi/DropdownPusatRiset.tsx";
import { CFC, RIIM, PRIS, Pemantauan, Purwarupa, Model, Publikasi, KI, Paten, HakCipta } from "../config/Index.ts";

const logbook = { CFC, RIIM, PRIS, Pemantauan } as const; // menu yang memakai dropdown
const output = { Purwarupa, Model, Publikasi, KI, Paten, "Hak Cipta": HakCipta } as const;

/* ---------- Palet: ganti di sini saja ---------- */
const HEADER = "linear-gradient(90deg, #1b3f78 0%, #2a5aa8 100%)"; // sidebar + bilah instansi

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
  pemantauan: { grad: HEADER, ...itemSidebar },
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

  // `null` kalau menu yang dipilih bukan milik kelompok itu (memperbaiki error TS 2774)
  const Logbook = menu in logbook ? logbook[menu as keyof typeof logbook] : null;
  const Output = menu in output ? output[menu as keyof typeof output] : null;
  const pakaiBulan = menu !== "Pemantauan"; // Pemantauan: hanya pilih pusat riset

  return (
    <div className="flex mt-20 min-h-screen w-full flex-col bg-[#f2f5fa] overflow-hidden" translate="no">
      <style>{CSS_TEMA}</style>
      <div className="flex flex-1">
        <Sidebar active={menu} onChange={setMenu} warna={WARNA_SIDEBAR} />
        <main className="flex-1 min-w-0">
          {/* Bilah instansi: gradasi sama dengan header sidebar */}
          <div
            style={{ background: HEADER }}
            className="[&>*]:!bg-none [&>*]:!bg-transparent [&>*]:!shadow-none"
          >
            <InstansiBar />
          </div>

          {/* Padding dirapatkan: sebelumnya p-6 md:p-8 */}
          <div className="px-4 pt-3 pb-4 md:px-6 md:pt-4">
            {Logbook && (
              <div
                className={`mx-auto mb-3 grid w-full grid-cols-1 gap-3 ${
                  pakaiBulan ? "max-w-3xl sm:grid-cols-2" : "max-w-sm"
                }`}
              >
                {pakaiBulan && <DropdownBulan value={bulan} onChange={setBulan} />}
                <DropdownPusatRiset value={pusatRiset} onChange={setPusatRiset} />
              </div>
            )}
            <div className="tabel-biru">
              {Logbook ? (
                <Logbook bulan={pakaiBulan ? bulan : null} pusatRiset={pusatRiset} />
              ) : Output ? (
                <Output />
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}