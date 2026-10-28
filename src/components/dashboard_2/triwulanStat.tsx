import { useState } from "react";
import MetricCard from "./monevChart/metricCardList.tsx";

import TriwulanNav, { type Triwulan } from "./monevChart/triwulanNav.tsx";
import OrpaChartsSection from "./monevChart/orpachartssection.tsx";
import PrChart from "./monevChart/prChart.tsx";

import type { MetricsData, PusatRisetData, OrpaChartsData } from "../../types/index.ts";



// import rawDataPr from "../data/pusatRiset.json";
// import rawDataChart from "../data/orpaCharts.json";
// import rawData from "../data/metrics.json";
// import { rawDataPr, rawDataChart, rawData } from "../../data/index.ts";
export interface DashboardProps {
  rawDataPr: PusatRisetData;
  rawDataChart: OrpaChartsData;
  rawData: MetricsData;
}

export default function TriwulanStat({ rawDataPr, rawDataChart, rawData }: DashboardProps) {
    const data: MetricsData = rawData;
    const [triwulan, setTriwulan] = useState<Triwulan>("III");
    const dataCharts: OrpaChartsData = rawDataChart;
    const dataPrChart: PusatRisetData = rawDataPr;
    return (
        <div className="min-h-screen w-screen flex flex-col items-center overflow-hidden"  >
            <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-360">
                <TriwulanNav value={triwulan} onChange={setTriwulan} />
                <MetricCard data={data} />
                <OrpaChartsSection data={dataCharts} />
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
                <PrChart data={dataPrChart} />
    
            </div>
        </div>
    )
}
