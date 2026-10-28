import { STATS, type Stat } from "../../data/dashboardData.ts";

const ROWS = [
  { key: "t", suffix: "Target", pick: (s: Stat) => s.target },
  { key: "r", suffix: "Realisasi", pick: (s: Stat) => s.realisasi },
];

/* Baris 1 = target, baris 2 = realisasi */
export default function StatCards() {
  return (
    <section className="ml-[137px] mt-[69px] grid w-[995px] grid-cols-[repeat(4,206px)] gap-x-[57px] gap-y-[23px]">
      {ROWS.map((row) =>
        STATS.map((s) => (
          <div
            key={`${row.key}-${s.label}`}
            className="h-[126px] rounded-xl bg-white px-[15px] text-center shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
          >
            <p
              className={`m-0 flex h-[36px] items-center justify-center border-b border-[#d9d9d9] text-[16px] font-semibold [text-shadow:0_1px_3px_currentColor] ${s.color}`}
            >
              {s.label === "Ketua Tim" ? "Ketua Tim" : `${s.label} (${row.suffix})`}
            </p>
            <p
              className={`m-0 text-[48px] font-bold leading-[78px] [text-shadow:0_2px_5px_rgba(0,0,0,0.25)] ${s.color}`}
            >
              {row.pick(s)}
            </p>
          </div>
        ))
      )}
    </section>
  );
}