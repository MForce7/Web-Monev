import { useState } from "react";
import MetricCard from "../components/dashboard_2/metricCardList.tsx";
import Jumbotron from "../components/dashboard_2/jumbotron.tsx";
import TriwulanNav, { type Triwulan } from "../components/dashboard_2/triwulanNav.tsx";
// import TriwulanNavbar, { type Triwulan } from "../components/TriwulanNavbar";
import rawData from "../data/metrics.json";
import type { MetricsData } from "../types/monev.ts";


export default function DashboardV2() {
    const data: MetricsData = rawData;
    const [triwulan, setTriwulan] = useState<Triwulan>("III");
    return (
        <div className="min-h-screen w-screen flex flex-col items-center overflow-hidden"  >
            <Jumbotron />
            <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-[1440px]">
                <TriwulanNav value={triwulan} onChange={setTriwulan} />
                <MetricCard data={data} />
            </div>
        </div>
    )
}

