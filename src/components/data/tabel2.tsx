import { GRAD_CARD } from "../../config/Warna.ts";
import { JUMLAH_BARIS_KOSONG } from "../../config/Datacontoh.ts";

const kolom = ["No", "Judul", "Status", "Presentase Progress (%)", "Data Dukung"];
const grid = { gridTemplateColumns: "64px 1.5fr 1fr 1.2fr 1.3fr" };

export default function Tabel2() {
  return (
    <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
      <div className="grid items-stretch text-center text-sm font-bold text-white" style={{ ...grid, background: GRAD_CARD }}>
        {kolom.map((k) => (
          <span key={k} className="flex items-center justify-center border-r border-white/30 px-3 py-3 last:border-r-0">
            {k}
          </span>
        ))}
      </div>

      <ul>
        {Array.from({ length: JUMLAH_BARIS_KOSONG }).map((_, i) => (
          <li key={i} className="grid h-[60px] border-b border-gray-300 last:border-b-0" style={grid}>
            {kolom.map((k) => (
              <span key={k} className="border-r border-gray-300 last:border-r-0" />
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}