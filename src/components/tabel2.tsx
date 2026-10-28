import type { ReactNode } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";
import rekapOutput from "../../config/rekapOutput.json";
import type { BarisOutput } from "../../config/Tipe.ts";

const kolom = ["No", "Nama Ketua", "Judul", "Status", "Presentase Progress (%)", "Data Dukung"];
const semua = rekapOutput.output as unknown as Record<string, BarisOutput[]>; // jenis -> baris
const grid = { gridTemplateColumns: "40px 1.1fr 1.6fr 0.9fr 1fr 1.1fr" };

function Sel({ children }: { children?: ReactNode }) {
  return (
    <span className="flex items-center justify-center border-r border-gray-300 px-2 py-1.5 text-center text-xs leading-tight text-gray-800 last:border-r-0 [overflow-wrap:anywhere]">
      {children}
    </span>
  );
}

export default function Tabel2({ jenis }: { jenis: string }) {
  const data = (semua[jenis] ?? []).filter((r) => r.ketua || r.judul); // baris template kosong disembunyikan
  const jumlahBaris = Math.max(data.length, JUMLAH_BARIS_KOSONG); // sisa baris tetap kosong seperti desain

  return (
    <section className="w-full overflow-hidden rounded-xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
      <div className="grid items-stretch text-center text-xs font-bold text-white" style={{ ...grid, background: GRAD_CARD }}>
        {kolom.map((k) => (
          <span key={k} className="flex items-center justify-center border-r border-white/30 px-2 py-2 last:border-r-0">
            {k}
          </span>
        ))}
      </div>

      <ul>
        {Array.from({ length: jumlahBaris }).map((_, i) => {
          const d = data[i];
          return (
            <li key={i} className="grid min-h-[38px] border-b border-gray-300 last:border-b-0" style={grid}>
              <Sel>{d ? i + 1 : null}</Sel>
              <Sel>{d?.ketua}</Sel>
              <Sel>{d?.judul}</Sel>
              <Sel>{d?.status}</Sel>
              <Sel>{d ? `${d.progres}%` : null}</Sel>
              <Sel>
                {d &&
                  (d.dataDukung.length ? (
                    <ul className="space-y-0.5">
                      {d.dataDukung.map((l, j) => (
                        <li key={j}>
                          <a href={l.url} target="_blank" rel="noreferrer" className="text-[#e8202f] hover:underline">
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">–</span>
                  ))}
              </Sel>
            </li>
          );
        })}
      </ul>
    </section>
  );
}