import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";

const kemajuan = ["Uraian Kemajuan Aktivitas", "Kendala Ditemui", "Mitigasi / Rencana Tindak Lanjut", "Data Dukung Progres"];
const output = ["Jenis Output", "Judul Output", "Status", "Presentase Progress (%)", "Output Data Dukung"];
const kolom = [...kemajuan, ...output];

const th = "border-b border-r border-white/30 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";

export default function Tabel() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-300 shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
      <table className="w-full min-w-[950px] border-separate border-spacing-0 bg-white">
        <colgroup>
          {kolom.map((label) => (
            <col key={label} style={label === "Presentase Progress (%)" ? { width: 90 } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th colSpan={kemajuan.length} className={`${th} bg-[#e8202f] uppercase`}>
              Kemajuan Aktivitas / Kegiatan
            </th>
            <th colSpan={output.length} className={`${th} bg-[#c4161f] uppercase`}>
              Output Presentase Progres
            </th>
          </tr>
          <tr>
            {kolom.map((label) => (
              <th key={label} className={`${th} bg-[#f25c6a]`}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: JUMLAH_BARIS_KOSONG }).map((_, i) => (
            <tr key={i} className="h-[47px] [&:last-child>td]:border-b-0">
              {kolom.map((label) => (
                <td key={label} className="border-b border-r border-gray-300 last:border-r-0" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}