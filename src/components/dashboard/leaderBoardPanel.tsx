import type { Kepatuhan } from "../../data/dashboardData.ts";

const BAR_MAX_HEIGHT = 274; // tinggi batang untuk 90% (sesuai desain)
const BAR_SCALE = BAR_MAX_HEIGHT / 90;

export const PANEL_WIDTH = 1190; // lebar satu panel

type Props = {
  kepatuhan: readonly Kepatuhan[];
  peringkat: readonly string[];
  aktif: boolean;
};

/* Satu panel leaderboard: grafik batang + daftar periset */
export default function LeaderboardPanel({ kepatuhan, peringkat, aktif }: Props) {
  return (
    <div className="flex-none" style={{ width: PANEL_WIDTH }} aria-hidden={!aktif}>
      <div className="relative h-[445px] rounded-2xl bg-white shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
        <div className="absolute bottom-[45px] left-[109px] flex items-end gap-[47px]">
          {kepatuhan.map((k) => (
            <div key={k.kode} className="flex w-[200px] flex-col items-center">
              <div className="text-[32px] font-bold leading-[40px] text-[#353535]">
                {k.kode}
              </div>
              <div className="mb-1 mt-2 w-[140px] text-center text-[16px] font-bold leading-[18px] text-[#737373]">
                {k.persen}% Periset telah mengisi logbook
              </div>
              <div
                className="w-[200px] bg-[linear-gradient(180deg,#54a0ff_0%,#326099_100%)] transition-[height] duration-700 ease-out"
                style={{ height: aktif ? k.persen * BAR_SCALE : 0 }}
              />
            </div>
          ))}
        </div>
      </div>

      <ol className="m-0 ml-[7px] mt-[55px] w-[1183px] list-none overflow-hidden rounded-2xl bg-white p-0 shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
        {peringkat.map((nama, i) => (
          <li
            key={i}
            className="flex h-[78px] items-center border-b-2 border-[#d9d9d9] pl-[34px] text-[28px] font-bold text-[#737373] last:border-b-0"
          >
            <span className="mr-[29px] grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-[#54a0ff] text-[28px] font-bold text-white">
              {i + 1}
            </span>
            {nama}
          </li>
        ))}
      </ol>
    </div>
  );
}