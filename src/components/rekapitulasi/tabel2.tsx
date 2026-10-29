import type { ReactNode } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";
import rekapOutput from "../../config/rekapOutput.json";

/* Bentuk satu baris di rekapOutput.json -> "output" -> <jenis> */
type LinkDukung = { label: string; url: string };
type BarisOutput = {
  ketua?: string;
  judul?: string;
  status?: string;
  progres?: number;
  dataDukung?: LinkDukung[];
};

const kolom = ["No", "Judul", "Status", "Presentase Progress (%)", "Data Dukung"];
const grid = { gridTemplateColumns: "56px 1.6fr 1fr 1.2fr 1.2fr" };

// JSON-nya berbentuk { logbook: {...}, output: { Purwarupa: [...], Model: [...], ... } }
const semua = (rekapOutput as unknown as { output?: Record<string, BarisOutput[]> }).output ?? {};

// Baris template yang masih kosong (belum diisi) tidak ditampilkan
const terisi = (d: BarisOutput) => [d.ketua, d.judul, d.status].some((v) => v && v.trim() !== "");

function Sel({ children }: { children?: ReactNode }) {
  return (
    <span className="flex items-center justify-center border-r border-gray-300 px-3 py-2 text-center text-sm text-gray-800 last:border-r-0 [overflow-wrap:anywhere]">
      {children}
    </span>
  );
}

export default function Tabel2({ jenis }: { jenis: string }) {
  const data = (semua[jenis] ?? []).filter(terisi);
  const jumlahBaris = Math.max(data.length, JUMLAH_BARIS_KOSONG); // sisa baris tetap kosong seperti desain

  return (
    <section className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
      <div className="grid items-stretch text-center text-sm font-bold text-white" style={{ ...grid, background: GRAD_CARD }}>
        {kolom.map((k) => (
          <span key={k} className="flex items-center justify-center border-r border-white/30 px-3 py-3 last:border-r-0">
            {k}
          </span>
        ))}
      </div>

      <ul>
        {Array.from({ length: jumlahBaris }).map((_, i) => {
          const d = data[i];
          const links = d?.dataDukung ?? [];
          return (
            <li key={`${jenis}-${i}`} className="grid min-h-[52px] border-b border-gray-300 last:border-b-0" style={grid}>
              <Sel>{d ? i + 1 : null}</Sel>
              <Sel>{d?.judul}</Sel>
              <Sel>{d?.status}</Sel>
              <Sel>{d ? `${d.progres ?? 0}%` : null}</Sel>
              <Sel>
                {d &&
                  (links.length ? (
                    <ul className="space-y-1">
                      {links.map((l, j) => (
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