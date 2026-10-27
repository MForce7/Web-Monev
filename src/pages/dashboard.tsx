import { useState } from "react";
import type { Periode } from "../data/dashboardData.ts";
import { DESIGN_WIDTH, useViewportWidth } from "../hooks/useViewportWidth.ts";

import Hero from "../components/dashboard/hero";
import StatCards from "../components/dashboard/statCards";
import ChartGrid from "../components/dashboard/chartGrids";
import LeaderboardSection from "../components/dashboard/leaderboardSection";

// Makin kecil angkanya, makin kecil tampilan halaman. Coba 0.65 / 0.75 / 0.85
const ZOOM = 0.75;

export default function Dashboard() {
  const [periode, setPeriode] = useState<Periode>("III");
  const vw = useViewportWidth();

  // Tidak lebih besar dari ZOOM, dan otomatis mengecil kalau layar sempit
  const scale = Math.min(ZOOM, vw / DESIGN_WIDTH);

  return (
    <div
      style={{ zoom: scale, width: vw / scale }}
      className="overflow-hidden bg-white text-[#353535] [font-family:Helvetica_Neue,Helvetica,Arial,sans-serif]"
    >
      <Hero periode={periode} onPeriodeChange={setPeriode} />

      <main className="mx-auto w-[1216px] pt-[99px]">
        <div className="flex h-[87px] items-center justify-center rounded-3xl bg-[#f22838] text-[40px] font-bold text-white shadow-[0_6px_14px_rgba(0,0,0,0.25)]">
          Capaian MONEV Triwulan {periode} Tahun 2026
        </div>

        <StatCards />

        <ChartGrid
          className="mt-[88px]"
          ids={["chart-1", "chart-2", "chart-3", "chart-4"]}
        />

        <div className="mx-auto mt-[125px] max-w-[980px] text-center">
          <h2 className="m-0 text-[32px] font-bold leading-[40px] text-[#353535]">
            Komposisi Capaian Kinerja Pusat Riset
          </h2>
          <p className="mx-0 mb-0 mt-[15px] text-[24px] font-semibold leading-[28px] text-[#737373]">
            Diagram berikut menampilkan proporsi dan perbandingan realisasi capaian kinerja
            <br />
            dari setiap Pusat Riset pada periode ini.
          </p>
        </div>

        <ChartGrid
          className="mt-[86px]"
          ids={["chart-5", "chart-6", "chart-7", "chart-8"]}
        />
      </main>

      <LeaderboardSection />
    </div>
  );
}