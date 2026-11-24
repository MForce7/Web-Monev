import { pilihanAkhir, type Aktivitas, type PerisetTujuan } from "./shared";
import { OPSI_UNIT_PENGAMPU_DIFA, SEMUA_PROGRAM_SKEMA } from "./AktivitasCard";

type PratinjauPanelProps = {
  perisetTujuan: PerisetTujuan | null;
  namaPratinjau: string;
  emailBersih: string;
  unitPratinjau: string;
  aktivitas: Aktivitas[];
  teksTarget: (a: Aktivitas) => string;
};

export function PratinjauPanel({
  perisetTujuan,
  namaPratinjau,
  emailBersih,
  unitPratinjau,
  aktivitas,
  teksTarget,
}: PratinjauPanelProps) {
  return (
    <aside className="hidden min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_rgba(27,63,120,0.14)] lg:block">
      <div className="bg-[#1f4e8c] px-5 py-3 text-sm font-bold text-white">Pratinjau</div>
      <dl className="grid gap-3 border-b border-[#e5edf8] px-5 py-4 text-sm">
        {(
          [
            ["Nama ketua", namaPratinjau || "–"],
            ...(perisetTujuan ? [] : [["Email aktif", emailBersih || "–"]]),
            ["Unit kerja", unitPratinjau || "–"],
          ] as string[][]
        ).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-medium text-slate-500">{k}</dt>
            <dd className="font-semibold wrap-anywhere">{v}</dd>
          </div>
        ))}
      </dl>

      {aktivitas.map((a, i) => (
        <dl key={a.id} className="grid gap-3 border-b border-[#e5edf8] px-5 py-4 text-sm last:border-b-0">
          <dt className="text-xs font-extrabold uppercase tracking-wide text-[#1f4e8c]">Aktivitas {i + 1}</dt>
          {[
            ["Judul", a.judul.trim() || "–"],
            ["Target output", teksTarget(a)],
            ["Status", a.status || "–"],
            ["Kategori pendanaan", pilihanAkhir(a.kategori, a.kategoriLain) || "–"],
            [
              "Unit Pengampu DIFA",
              OPSI_UNIT_PENGAMPU_DIFA.find((u) => u.value === a.unitPengampuDifa)?.label || "–",
            ],
            [
              "Program / Skema Pendanaan",
              SEMUA_PROGRAM_SKEMA.find((p) => p.value === a.programSkemaPendanaan)?.label || "–",
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium text-slate-500">{k}</dt>
              <dd className="whitespace-pre-line font-semibold wrap-anywhere">{v}</dd>
            </div>
          ))}
          <div>
            <dt className="mb-1 flex justify-between text-xs font-medium text-slate-500">
              <span>Progres total</span>
              <span className="font-bold text-[#1b3560]">{a.progres}%</span>
            </dt>
            <dd className="h-2 overflow-hidden rounded-full bg-[#dbe6f7]">
              <div className="h-full bg-[#1f4e8c]" style={{ width: `${a.progres}%` }} />
            </dd>
          </div>
        </dl>
      ))}
    </aside>
  );
}