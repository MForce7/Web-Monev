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
    <div className="min-h-screen w-[80%] flex flex-col items-center overflow-hidden">
        <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-360">
        <TriwulanNav value={triwulan} onChange={setTriwulan} options={TRIWULAN_OPTIONS} />

        {!view ? (
            <p className="mt-10 text-[20px] font-semibold text-[#737373]">
            Data Triwulan {triwulan} belum tersedia.
            </p>
        ) : (
            <div
            key={triwulan}
            className="flex w-full flex-col items-center gap-6 animate-triwulan-in"
            >
            <MetricCard data={view.metrics} />
            <OrpaChartsSection data={view.orpaCharts} />

            <div className="mx-auto mt-31.25 max-w-245 text-center">
                <h2 className="m-0 text-[32px] font-bold leading-10 text-[#353535]">
                Komposisi Capaian Kinerja Pusat Riset
                </h2>
                <p className="mx-0 mb-0 mt-3.75 text-[24px] font-semibold leading-7 text-[#737373]">
                Diagram berikut menampilkan proporsi dan perbandingan realisasi capaian kinerja
                <br />
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