import { useState } from "react";
// import Navbar from "../components/navbar.tsx";
import Sidebar from "../components/data/Sidebar";
import InstansiBar from "../components/data/InstansiBar";
import DropdownBulan from "../components/data/DropdownBulan";
import DropdownPusatRiset from "../components/data/DropdownPusatRiset";
import { CFC, RIIM, PRIS, Purwarupa, Model, Publikasi, KI, Paten, HakCipta } from "../config/Index.ts";

const logbook = { CFC, RIIM, PRIS } as const;
const output = { Purwarupa, Model, Publikasi, KI, Paten, "Hak Cipta": HakCipta } as const;

// Ukuran font tabel diatur dari sini (semua isi tabel 11px, header 10px). Ubah angkanya kalau mau lebih kecil/besar.
const ukuranTabel = "[&_*]:text-[11px] [&_th]:text-[10px]";

export default function DataPage() {
  const [menu, setMenu] = useState("CFC");
  const [bulan, setBulan] = useState<string | null>(null);
  const [pusatRiset, setPusatRiset] = useState<string | null>(null);

  const Logbook = logbook[menu as keyof typeof logbook]; // ada kalau menu = CFC / RIIM / PRIS
  const Output = output[menu as keyof typeof output]; // ada kalau menu = Rekap Output

  return (
    <div className="flex mt-20 min-h-screen w-full flex-col bg-[#f4f4f4] text-sm overflow-hidden" translate="no">
      {/* <Navbar /> */}
      <div className="flex flex-1">
        <Sidebar active={menu} onChange={setMenu} />
        <main className="min-w-0 flex-1">
          <InstansiBar />
          <div className="p-4 md:p-5">
            {Logbook ? (
              <>
                <div className="mx-auto mb-3 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <DropdownBulan value={bulan} onChange={setBulan} />
                  <DropdownPusatRiset value={pusatRiset} onChange={setPusatRiset} />
                </div>
                <div className={ukuranTabel}>
                  <Logbook bulan={bulan} pusatRiset={pusatRiset} />
                </div>
              </>
            ) : (
              <div className={ukuranTabel}>
                <Output />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}