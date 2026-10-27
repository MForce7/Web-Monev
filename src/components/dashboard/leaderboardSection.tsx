import { useState } from "react";
import { LEADERBOARD } from "../../data/dashboardData.ts";
import LeaderboardPanel, { PANEL_WIDTH } from "./leaderBoardPanel.tsx";

const PANEL_GAP = 60; // jarak antar panel (supaya panel sebelah tidak mengintip)
const PANEL_STRIDE = PANEL_WIDTH + PANEL_GAP;

const arrowBase =
  "absolute top-0 grid h-[72px] w-[72px] place-items-center rounded-full border-0 bg-white/80 text-[#f22838] transition";
const arrowOn = "cursor-pointer hover:bg-white";
const arrowOff = "cursor-not-allowed opacity-40";

const ArrowIcon = ({ dir }: { dir: "l" | "r" }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={dir === "l" ? { transform: "scaleX(-1)" } : undefined}
  >
    <path d="M6 20h27M22 9l11 11-11 11" />
  </svg>
);

/* Peringkat kepatuhan logbook (tertinggi <-> terendah) */
export default function LeaderboardSection() {
  // 0 = Tertinggi, 1 = Terendah
  const [view, setView] = useState<0 | 1>(0);

  return (
    <section className="mt-[109px] bg-[#f22838] pb-[151px] pt-[30px]">
      <div className="mx-auto w-[1440px]">
        <div className="ml-[140px] w-[1190px]">
          <div className="relative flex h-[72px] items-center justify-center">
            <button
              aria-label="Lihat kepatuhan tertinggi"
              disabled={view === 0}
              onClick={() => setView(0)}
              className={`${arrowBase} left-[-2px] ${view === 0 ? arrowOff : arrowOn}`}
            >
              <ArrowIcon dir="l" />
            </button>
            <h2 key={view} aria-live="polite" className="m-0 text-[40px] font-bold text-white">
              {LEADERBOARD[view].judul}
            </h2>
            <button
              aria-label="Lihat kepatuhan terendah"
              disabled={view === 1}
              onClick={() => setView(1)}
              className={`${arrowBase} right-0 ${view === 1 ? arrowOff : arrowOn}`}
            >
              <ArrowIcon dir="r" />
            </button>
          </div>

          {/* Jendela geser: dua panel berjajar, digeser lewat translateX */}
          <div className="-mx-[16px] mt-[33px] -mb-[24px] overflow-hidden px-[16px] pb-[24px]">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                gap: PANEL_GAP,
                transform: `translateX(-${view * PANEL_STRIDE}px)`,
              }}
            >
              {LEADERBOARD.map((l, i) => (
                <LeaderboardPanel
                  key={l.judul}
                  kepatuhan={l.kepatuhan}
                  peringkat={l.peringkat}
                  aktif={view === i}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}