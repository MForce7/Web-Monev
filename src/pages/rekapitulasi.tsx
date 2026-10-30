import { useState } from "react";
import Sidebar from "../components/rekapitulasi/Sidebar.tsx";
import InstansiBar from "../components/rekapitulasi/InstansiBar.tsx";
import DropdownBulan from "../components/rekapitulasi/DropdownBulan.tsx";
import DropdownPusatRiset from "../components/rekapitulasi/DropdownPusatRiset.tsx";
import { CFC, RIIM, PRIS, Pemantauan, Purwarupa, Model, Publikasi, KI, Paten, HakCipta } from "../config/Index.ts";

const logbook = { CFC, RIIM, PRIS, Pemantauan } as const; // menu yang memakai dropdown
const output = { Purwarupa, Model, Publikasi, KI, Paten, "Hak Cipta": HakCipta } as const;

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
        <Sidebar active={menu} onChange={setMenu} />
        <main className="flex-1 min-w-0">
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