import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";

const kemajuan = ["Uraian Kemajuan Aktivitas", "Kendala Ditemui", "Mitigasi / Rencana Tindak Lanjut", "Data Dukung Progres"];
const output = ["Jenis Output", "Judul Output", "Status", "Presentase Progress (%)", "Output Data Dukung"];
const kolom = [...kemajuan, ...output];

const th = "border-b border-r border-white/25 px-3 py-2 text-center text-xs font-bold text-white last:border-r-0";

export default function Tabel() {
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
                <th key={label} className={`${th} bg-white/10`}>{label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: JUMLAH_BARIS_KOSONG }).map((_, i) => (
              <tr
                key={i}
                className={`h-[47px] transition-colors hover:bg-[#eaf0fa] [&:last-child>td]:border-b-0 ${
                  i % 2 === 1 ? "bg-[#f5f8fd]" : "bg-white"
                }`}
              >
                {kolom.map((label) => (
                  <td key={label} className="border-b border-r border-[#dbe6f7] text-sm text-[#1b3560] last:border-r-0" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}