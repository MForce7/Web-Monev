import type { ReactNode } from "react";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";
import type { BarisLogbook, Tautan } from "../../config/Tipe.ts";

const awal = ["No", "Nama Ketua"];
const kemajuan = ["Uraian Kemajuan Aktivitas", "Kendala Ditemui", "Mitigasi / Rencana Tindak Lanjut", "Data Dukung Progres"];
const output = ["Jenis Output", "Judul Output", "Status", "Presentase Progress (%)", "Output Data Dukung"];
const kolom = [...awal, ...kemajuan, ...output];

// Lebar kolom (px) dikunci supaya tabel CFC, RIIM, dan PRIS ukurannya sama persis, apa pun isinya.
const lebar: Record<string, number> = {
  "No": 36,
  "Nama Ketua": 150,
  "Uraian Kemajuan Aktivitas": 170,
  "Kendala Ditemui": 140,
  "Mitigasi / Rencana Tindak Lanjut": 160,
  "Data Dukung Progres": 110,
  "Jenis Output": 90,
  "Judul Output": 160,
  "Status": 80,
  "Presentase Progress (%)": 70,
  "Output Data Dukung": 110,
};
const lebarTotal = kolom.reduce((n, label) => n + lebar[label], 0);

// Kolom beku (tetap terlihat saat scroll ke samping): No dan Nama Ketua.
const kiri = (k: number) => (k === 0 ? 0 : lebar["No"]);
const bayangan = (k: number) => (k === awal.length - 1 ? " shadow-[3px_0_5px_-2px_rgba(0,0,0,0.25)]" : "");

const th = "border-b border-r border-white/30 px-2 py-1.5 text-center text-[10px] font-bold text-white last:border-r-0";
const td = "border-b border-r border-gray-300 px-2 py-1 text-center text-[11px] leading-tight text-gray-800 last:border-r-0 [overflow-wrap:anywhere]";

function Tautans({ list }: { list: Tautan[] }) {
  if (!list.length) return <span className="text-gray-400">–</span>;
  return (
    <ul className="space-y-0.5">
      {list.map((l, j) => (
        <li key={j}>
          <a href={l.url} target="_blank" rel="noreferrer" className="text-[#e8202f] hover:underline">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Tabel({ rows = [] }: { rows?: BarisLogbook[] }) {
  const jumlahBaris = Math.max(rows.length, JUMLAH_BARIS_KOSONG); // sisa baris tetap kosong seperti desain

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-300 shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
      <table className="w-full table-fixed border-separate border-spacing-0 bg-white" style={{ minWidth: lebarTotal }}>
        <colgroup>
          {kolom.map((label) => (
            <col key={label} style={{ width: lebar[label] }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {awal.map((label, k) => (
              <th
                key={label}
                rowSpan={2}
                style={{ left: kiri(k) }}
                className={`${th} sticky z-20 bg-[#e8202f] uppercase${bayangan(k)}`}
              >
                {label}
              </th>
            ))}
            <th colSpan={kemajuan.length} className={`${th} bg-[#e8202f] uppercase`}>
              Kemajuan Aktivitas / Kegiatan
            </th>
            <th colSpan={output.length} className={`${th} bg-[#c4161f] uppercase`}>
              Output Presentase Progres
            </th>
          </tr>
          <tr>
            {[...kemajuan, ...output].map((label) => (
              <th key={label} className={`${th} bg-[#f25c6a]`}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: jumlahBaris }).map((_, i) => {
            const d = rows[i];
            const sel: ReactNode[] = d
              ? [
                  i + 1,
                  d.ketua,
                  d.aktivitas.uraian,
                  d.aktivitas.kendala,
                  d.aktivitas.mitigasi,
                  <Tautans list={d.aktivitas.dataDukung} />,
                  d.output.jenis,
                  d.output.judul,
                  d.output.status,
                  `${d.output.progres}%`,
                  <Tautans list={d.output.dataDukung} />,
                ]
              : kolom.map(() => null);
            return (
              <tr key={i} className="h-[34px] [&:last-child>td]:border-b-0">
                {sel.map((isi, k) =>
                  k < awal.length ? (
                    <td key={k} style={{ left: kiri(k) }} className={`${td} sticky z-10 bg-white${bayangan(k)}`}>
                      {isi}
                    </td>
                  ) : (
                    <td key={k} className={td}>{isi}</td>
                  )
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}