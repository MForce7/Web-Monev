import type { ReactNode } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";
import rekapOutput from "../../data/rekapOutput.json";

/* ---------- Tipe data (sama dengan tabel logbook) ---------- */
type LinkDukung = { label: string; url: string };
type BarisOutput = {
  jenis?: string;
  ketua?: string;
  judul?: string;
  status?: string;
  progres?: number;
  dataDukung?: LinkDukung[];
};
type BarisLogbook = {
  bulan?: string;
  ketua?: string;
  aktivitas?: {
    uraian?: string;
    kendala?: string;
    mitigasi?: string;
    dataDukung?: LinkDukung[];
  };
  output?: BarisOutput;
};
type RekapJson = {
  logbook?: Record<string, Record<string, BarisLogbook[]>>; // { CFC: { PRA: [item, ...] } }
  output?: Record<string, BarisOutput[]>; // { Purwarupa: [...], Model: [...] }
};

const json = rekapOutput as unknown as RekapJson;

/* ---------- Kolom ---------- */
const kolom = [
  "No",
  "Nama Ketua Tim",
  "Uraian Kemajuan Aktivitas",
  "Kendala Ditemui",
  "Mitigasi / Rencana Tindak Lanjut",
  "Data Dukung Progres",
  "Jenis Output",
  "Judul Output",
  "Status",
  "Presentase Progress (%)",
  "Output Data Dukung",
];
const grid = {
  gridTemplateColumns:
    "56px minmax(0,1.2fr) minmax(0,1.6fr) minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,1.2fr)",
};

// Baris template yang masih kosong (belum diisi) tidak ditampilkan
const terisi = (b: BarisLogbook) =>
  [b.ketua, b.aktivitas?.uraian, b.aktivitas?.kendala, b.aktivitas?.mitigasi, b.output?.judul, b.output?.status].some(
    (v) => v && v.trim() !== ""
  );

function ambilData(jenis: string): BarisLogbook[] {
  // Utama: ambil dari logbook, hanya yang jenis outputnya cocok
  const dariLogbook = Object.values(json.logbook ?? {})
    .flatMap((perPusat) => Object.values(perPusat).flat())
    .filter((b) => b.output?.jenis === jenis)
    .filter(terisi);
  if (dariLogbook.length) return dariLogbook;

  // Cadangan: struktur { output: { <jenis>: [...] } } (tanpa data aktivitas)
  return (json.output?.[jenis] ?? [])
    .map((o): BarisLogbook => ({ ketua: o.ketua, output: o }))
    .filter(terisi);
}

/* ---------- Komponen kecil ---------- */
function DaftarLink({ links }: { links?: LinkDukung[] }) {
  if (!links || links.length === 0) return <span className="text-slate-400">–</span>;
  return (
    <ul className="space-y-1">
      {links.map((l, i) => (
        <li key={i}>
          <a href={l.url} target="_blank" rel="noreferrer" className="text-[#2a5aa8] hover:underline">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Sel({ children, kiri }: { children?: ReactNode; kiri?: boolean }) {
  return (
    <span
      className={`flex items-center border-r border-[#dbe6f7] px-3 py-2 text-xs leading-snug text-[#1b3560] last:border-r-0 [overflow-wrap:break-word] ${
        kiri ? "justify-start text-left" : "justify-center text-center"
      }`}
    >
      {children}
    </span>
  );
}

/* ---------- Tabel ---------- */
export default function Tabel2({ jenis }: { jenis: string }) {
  const data = ambilData(jenis);
  const jumlahBaris = Math.max(data.length, JUMLAH_BARIS_KOSONG); // sisa baris tetap kosong seperti desain

  return (
    <section className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
      <div className="overflow-x-auto [scrollbar-color:#2a5aa8_#eaf0fa] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#eaf0fa] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a5aa8]">
        <div className="min-w-[1500px]">
          <div
            className="grid items-stretch text-center text-xs font-bold text-white"
            style={{ ...grid, background: GRAD_CARD }}
          >
            {kolom.map((k) => (
              <span key={k} className="flex items-center justify-center border-r border-white/25 px-3 py-3 last:border-r-0">
                {k}
              </span>
            ))}
          </div>

          <ul>
            {Array.from({ length: jumlahBaris }).map((_, i) => {
              const d = data[i];
              return (
                <li
                  key={`${jenis}-${i}`}
                  className={`grid min-h-[52px] border-b border-[#dbe6f7] transition-colors last:border-b-0 hover:bg-[#eaf0fa] ${
                    i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"
                  }`}
                  style={grid}
                >
                  <Sel>{d ? i + 1 : null}</Sel>
                  <Sel kiri>
                    <span className="font-medium">{d?.ketua ?? d?.output?.ketua}</span>
                  </Sel>
                  <Sel kiri>{d?.aktivitas?.uraian}</Sel>
                  <Sel kiri>{d?.aktivitas?.kendala}</Sel>
                  <Sel kiri>{d?.aktivitas?.mitigasi}</Sel>
                  <Sel>{d && <DaftarLink links={d.aktivitas?.dataDukung} />}</Sel>
                  <Sel>{d?.output?.jenis}</Sel>
                  <Sel kiri>{d?.output?.judul}</Sel>
                  <Sel>{d?.output?.status}</Sel>
                  <Sel>{d ? `${d.output?.progres ?? 0}%` : null}</Sel>
                  <Sel>{d && <DaftarLink links={d.output?.dataDukung} />}</Sel>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}