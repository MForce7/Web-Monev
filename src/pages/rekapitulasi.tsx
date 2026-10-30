import { useState } from "react";
import Sidebar, { type PaletSidebar } from "../components/rekapitulasi/Sidebar.tsx";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import DropdownBulan from "../components/rekapitulasi/DropdownBulan.tsx";
import DropdownPusatRiset from "../components/rekapitulasi/DropdownPusatRiset.tsx";
import { CFC, RIIM, PRIS, Pemantauan, Purwarupa, Model, Publikasi, KI, Paten, HakCipta } from "../config/Index.ts";

const logbook = { CFC, RIIM, PRIS, Pemantauan } as const; // menu yang memakai dropdown
const output = { Purwarupa, Model, Publikasi, KI, Paten, "Hak Cipta": HakCipta } as const;

/* ---------- Warna sidebar: ganti di sini saja ----------
   Satu keluarga biru yang sama dengan isi halaman (navy -> biru kobalt -> biru cornflower),
   dibuat kalem supaya nyaman di mata. */
const WARNA_SIDEBAR: PaletSidebar = {
  logbook: {
    grad: "linear-gradient(90deg, #1c3d89 0%, #3f68b5 60%, #6a8bd0 100%)",
    bg: "#eef2fb", // latar daftar
    hover: "#dde6f7",
    aktif: "#c8d6f2", // item terpilih
    bar: "#244fa2", // garis penanda di kiri item terpilih
    ring: "#244fa2", // cincin saat aktif
  },
  output: {
    grad: "linear-gradient(90deg, #172b66 0%, #244fa2 60%, #4a72c0 100%)",
    bg: "#eef2fb",
    hover: "#dde6f7",
    aktif: "#c8d6f2",
    bar: "#1c3d89",
    ring: "#1c3d89",
  },
  pemantauan: {
    grad: "linear-gradient(90deg, #101c44 0%, #1c3d89 100%)",
    bg: "#eef2fb",
    hover: "#dde6f7",
    aktif: "#c8d6f2",
    bar: "#101c44",
    ring: "#101c44",
  },
  teks: "#14264f", // tulisan item di dalam daftar
};

/* ---------- Tema biru untuk seluruh isi halaman ----------
   Komponen di dalam <main> (InstansiBar, dropdown, tabel) warnanya merah. Daripada mengubah
   satu-satu, hue-nya diputar dari merah ke biru, lalu saturasinya diturunkan supaya kalem.
   Putih & abu-abu tidak terpengaruh.
   - HUE: 220 = biru terang (cerah), 235 = biru kobalt (dipakai), 245 = biru keunguan
   - SATURASI: 1 = pekat, 0.6 = kalem (dipakai), 0.4 = makin pudar */
const HUE_BIRU = 235;
const SATURASI = 0.6;

export default function Rekapitulasi() {
  const [menu, setMenu] = useState("CFC");
  const [bulan, setBulan] = useState<string | null>(null);
  const [pusatRiset, setPusatRiset] = useState<string | null>(null);

  const Logbook = logbook[menu as keyof typeof logbook];
  const Output = output[menu as keyof typeof output];
  const pakaiBulan = menu !== "Pemantauan"; // Pemantauan: hanya pilih pusat riset

  return (
    <div className="flex mt-20 min-h-screen w-full flex-col bg-[#f4f4f4] overflow-hidden" translate="no">
      <div className="flex flex-1">
        <Sidebar active={menu} onChange={setMenu} warna={WARNA_SIDEBAR} />
        <main
          className="flex-1 min-w-0"
          style={{ filter: `hue-rotate(${HUE_BIRU}deg) saturate(${SATURASI})` }}
        >
          <InstansiBar />
          <div className="p-6 md:p-8">
            {Logbook ? (
              <>
                <div
                  className={`mx-auto mb-5 grid w-full grid-cols-1 gap-4 sm:gap-6 ${
                    pakaiBulan ? "max-w-3xl sm:grid-cols-2" : "max-w-sm"
                  }`}
                >
                  {pakaiBulan && <DropdownBulan value={bulan} onChange={setBulan} />}
                  <DropdownPusatRiset value={pusatRiset} onChange={setPusatRiset} />
                </div>
                <Logbook bulan={pakaiBulan ? bulan : null} pusatRiset={pusatRiset} />
              </>
            ) : (
              <Output />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}