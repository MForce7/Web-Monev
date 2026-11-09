import type { ReactNode } from "react";
import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";
import rekapOutput from "../../data/rekapOutput.json";

/* ---------- Tipe data (mengikuti rekapOutput.json -> "logbook") ---------- */
type LinkDukung = { label: string; url: string };
type BarisLogbook = {
  bulan?: string;
  ketua?: string;
  aktivitas?: {
    uraian?: string;
    kendala?: string;
    mitigasi?: string;
    dataDukung?: LinkDukung[];
  };
  output?: {
    jenis?: string;
    judul?: string;
    status?: string;
    progres?: number;
    dataDukung?: LinkDukung[];
  };
};
type RekapJson = {
  logbook?: Record<string, Record<string, BarisLogbook[]>>; // { CFC: { PRA: [baris x 12] } }
};

const json = rekapOutput as unknown as RekapJson;

/* ---------- Kolom ---------- */
const kemajuan = ["Uraian Kemajuan Aktivitas", "Kendala Ditemui", "Mitigasi / Rencana Tindak Lanjut", "Data Dukung Progres"];
const output = ["Jenis Output", "Judul Output", "Status", "Presentase Progress (%)", "Output Data Dukung"];
const kolom = [...kemajuan, ...output];

const th = "border-b border-r border-white/25 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";
const td =
  "border-b border-r border-[#dbe6f7] px-3 py-2 text-center text-sm text-[#1b3560] last:border-r-0 [overflow-wrap:anywhere]";

/* ---------- Ambil data ---------- */
// Nilai kosong atau diawali "Semua" dianggap belum memilih (tidak memfilter)
const pilih = (v?: string | null): v is string => !!v && !v.startsWith("Semua");

// Baris template yang masih kosong tidak ditampilkan
const terisi = (b: BarisLogbook) =>
  [b.ketua, b.aktivitas?.uraian, b.aktivitas?.kendala, b.aktivitas?.mitigasi, b.output?.jenis, b.output?.judul, b.output?.status].some(
    (v) => v && v.trim() !== ""
  );

function ambilData(menu?: string | null, pusatRiset?: string | null, bulan?: string | null): BarisLogbook[] {
  const perMenu = json.logbook ?? {};
  const daftarMenu = pilih(menu) ? [menu] : Object.keys(perMenu);

  return daftarMenu
    .flatMap((m) => {
      const perPusat = perMenu[m] ?? {};
      const daftarPusat = pilih(pusatRiset) ? [pusatRiset] : Object.keys(perPusat);
      return daftarPusat.flatMap((p) => perPusat[p] ?? []);
    })
    .filter(terisi)
    .filter((b) => !pilih(bulan) || b.bulan === bulan);
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

function Td({ children, kiri }: { children?: ReactNode; kiri?: boolean }) {
  return <td className={`${td} ${kiri ? "text-left" : ""}`}>{children}</td>;
}

/* ---------- Tabel ---------- */
type Props = {
  menu?: string | null; // CFC / RIIM / PRIS
  pusatRiset?: string | null; // PRA / PRTS / PRTR / PRTP
  bulan?: string | null; // Januari ... Desember
};

export default function Tabel({ menu, pusatRiset, bulan }: Props) {
  const data = ambilData(menu, pusatRiset, bulan);
  const jumlahBaris = Math.max(data.length, JUMLAH_BARIS_KOSONG);

  return (
    // Pembungkus luar membawa bayangan + sudut bulat; bagian dalam dipotong dengan clip-path
    <div className="w-full rounded-2xl shadow-[0_6px_18px_rgba(27,63,120,0.14)]">
      <div className="isolate w-full overflow-hidden rounded-2xl border border-[#dbe6f7] [clip-path:inset(0_round_1rem)]">
        <table className="w-full min-w-[950px] border-separate border-spacing-0 bg-white">
          <colgroup>
            {kolom.map((label) => (
              <col key={label} style={label === "Presentase Progress (%)" ? { width: 90 } : undefined} />
            ))}
          </colgroup>

          {/* SATU gradasi mengalir di seluruh baris judul, sama dengan header sidebar */}
          <thead style={{ background: GRAD_CARD }}>
            <tr>
              <th colSpan={kemajuan.length} className={`${th} uppercase`}>
                Kemajuan Aktivitas / Kegiatan
              </th>
              <th colSpan={output.length} className={`${th} uppercase`}>
                Output Presentase Progres
              </th>
            </tr>
            <tr>
              {kolom.map((label) => (
                <th key={label} className={`${th} bg-white/10`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: jumlahBaris }).map((_, i) => {
              const d = data[i];
              return (
                <tr
                  key={d ? `${d.bulan}-${i}` : `kosong-${i}`}
                  className={`h-[47px] transition-colors hover:bg-[#eaf0fa] [&:last-child>td]:border-b-0 ${
                    i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"
                  }`}
                >
                  <Td kiri>{d?.aktivitas?.uraian}</Td>
                  <Td kiri>{d?.aktivitas?.kendala}</Td>
                  <Td kiri>{d?.aktivitas?.mitigasi}</Td>
                  <Td>{d && <DaftarLink links={d.aktivitas?.dataDukung} />}</Td>
                  <Td>{d?.output?.jenis}</Td>
                  <Td kiri>{d?.output?.judul}</Td>
                  <Td>{d?.output?.status}</Td>
                  <Td>{d ? `${d.output?.progres ?? 0}%` : null}</Td>
                  <Td>{d && <DaftarLink links={d.output?.dataDukung} />}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}