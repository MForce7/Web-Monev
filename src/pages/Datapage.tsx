import { useState } from "react";
import Navbar from "../components/data/Navbar";
import Sidebar from "../components/data/Sidebar";
import InstansiBar from "../components/data/InstansiBar";
import DropdownBulan from "../components/data/DropdownBulan";
import DropdownPusatRiset from "../components/data/DropdownPusatRiset";
import { CFC, RIIM, PRIS, Purwarupa, Model, Publikasi, KI, Paten, HakCipta } from "../config/Index.ts";

const logbook = { CFC, RIIM, PRIS } as const;
const output = { Purwarupa, Model, Publikasi, KI, Paten, "Hak Cipta": HakCipta } as const;

export default function DataPage() {
  const [menu, setMenu] = useState("CFC");
  const [bulan, setBulan] = useState<string | null>(null);
  const [pusatRiset, setPusatRiset] = useState<string | null>(null);

  const Logbook = logbook[menu as keyof typeof logbook]; // ada kalau menu = CFC / RIIM / PRIS
  const Output = output[menu as keyof typeof output]; // ada kalau menu = Rekap Output

  return (
    <div className="flex mt-20 min-h-screen w-full flex-col bg-[#f4f4f4] overflow-hidden" translate="no">
      {/* <Navbar /> */}
      <div className="flex flex-1">
        <Sidebar active={menu} onChange={setMenu} />
        <main className="flex-1">
          <InstansiBar />
          <div className="p-6 md:p-8">
            {Logbook ? (
              <>
                <div className="mx-auto mb-5 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <DropdownBulan value={bulan} onChange={setBulan} />
                  <DropdownPusatRiset value={pusatRiset} onChange={setPusatRiset} />
                </div>
                <Logbook bulan={bulan} pusatRiset={pusatRiset} />
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