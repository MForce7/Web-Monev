"use client";

import { useEffect, useMemo, useState } from "react";
import MetricCard from "./monevChart/metricCardList";
import TriwulanNav from "./monevChart/triwulanNav";
import OrpaChartsSection from "./monevChart/orpachartssection";
import PrChart from "./monevChart/prChart";
import { buildDashboardView } from "../../lib/dashboardView";
import type { DashboardData, Triwulan } from "../../types/dashboard";

export interface DashboardProps {
  statData: DashboardData;
}

const TRIWULAN_OPTIONS: Triwulan[] = ["I", "II", "III", "IV"];

export default function TriwulanStat({ statData }: DashboardProps) {
  const [triwulan, setTriwulan] = useState<Triwulan>("III");

  // data otomatis menyesuaikan triwulan yang aktif
  const view = useMemo(() => {
    const current = statData.triwulan[triwulan];
    return current ? buildDashboardView(statData.kategori, current) : null;
  }, [statData, triwulan]);

  useEffect(() => {
    console.log("Triwulan aktif:", triwulan);
  }, [triwulan]);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center overflow-hidden sm:w-[92%] lg:w-[80%]">
      <div className="flex w-full max-w-360 flex-col items-center gap-6 px-4 py-6 sm:py-8">
        <TriwulanNav value={triwulan} onChange={setTriwulan} options={TRIWULAN_OPTIONS} />

        {!view ? (
          <p className="mt-10 text-center text-base font-semibold text-[#737373] sm:text-[20px]">
            Data Triwulan {triwulan} belum tersedia.
          </p>
        ) : (
          <div
            key={triwulan}
            className="flex w-full animate-triwulan-in flex-col items-center gap-6"
          >
            <MetricCard data={view.metrics} />
            <OrpaChartsSection data={view.orpaCharts} />

            <div className="mx-auto mt-10 max-w-245 text-center sm:mt-20 lg:mt-31.25">
              <h2 className="m-0 text-2xl font-bold leading-8 text-[#353535] sm:text-[32px] sm:leading-10">
                Komposisi Capaian Kinerja Pusat Riset
              </h2>
              <p className="mb-0 mt-3 text-base font-semibold leading-6 text-[#737373] sm:text-xl lg:mt-3.75 lg:text-[24px] lg:leading-7">
                Diagram berikut menampilkan proporsi dan perbandingan realisasi capaian kinerja
                <br className="hidden md:block" />{" "}
                dari setiap Pusat Riset pada periode ini.
              </p>
            </div>

            <PrChart data={view.prChart} />
          </div>
        )}
      </div>
    </div>
  );
}