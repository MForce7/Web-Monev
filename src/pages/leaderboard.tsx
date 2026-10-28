
// import Leaderboard, { type LeaderboardData } from "../components/dashboard_2/leaderboard";
// import data from "../data/leaderboard.json";




// export default function LeaderboardPage() {


//     return (
//         <>
//         <Leaderboard data={data as LeaderboardData} />;
//         </>
//     );
// }




import TriwulanStat from "../components/dashboard_2/triwulanStat";
// import data from "../data/leaderboard.json";
import { rawDataPr, rawDataChart, rawData } from "../data/index.ts";




export default function LeaderboardPage() {


    return (
        <>
        <TriwulanStat rawDataPr={rawDataPr} rawDataChart={rawDataChart} rawData={rawData} />;
        </>
    );
}






// import { useState } from "react";
// import MetricCard from "../components/dashboard_2/metricCardList.tsx";

// import TriwulanNav, { type Triwulan } from "../components/dashboard_2/monevChart/triwulanNav.tsx";
// import OrpaChartsSection from "../components/dashboard_2/monevChart/orpachartssection.tsx";
// import PrChart from "../components/dashboard_2/monevChart/prChart.tsx";


// import type { OrpaChartsData } from "../types/orpaCharts";
// import type { PusatRisetData } from "../types/pusatRiset";
// import type { MetricsData } from "../types/monev.ts";



// import rawDataPr from "../data/pusatRiset.json";
// import rawDataChart from "../data/orpaCharts.json";
// import rawData from "../data/metrics.json";



// export default function DashboardV2() {
//     const data: MetricsData = rawData;
//     const [triwulan, setTriwulan] = useState<Triwulan>("III");
//     const dataCharts: OrpaChartsData = rawDataChart;
//     const dataPrChart: PusatRisetData = rawDataPr;
//     return (
//         <div className="min-h-screen w-screen flex flex-col items-center overflow-hidden"  >
//             <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-[1440px]">
//                 <TriwulanNav value={triwulan} onChange={setTriwulan} />
//                 <MetricCard data={data} />
//                 <OrpaChartsSection data={dataCharts} />
//                 <div className="mx-auto mt-[125px] max-w-[980px] text-center">
//                     <h2 className="m-0 text-[32px] font-bold leading-[40px] text-[#353535]">
//                         Komposisi Capaian Kinerja Pusat Riset
//                     </h2>
//                     <p className="mx-0 mb-0 mt-[15px] text-[24px] font-semibold leading-[28px] text-[#737373]">
//                         Diagram berikut menampilkan proporsi dan perbandingan realisasi capaian kinerja
//                         <br />
//                         dari setiap Pusat Riset pada periode ini.
//                     </p>
//                 </div>
//                 <PrChart data={dataPrChart} />
    
//             </div>
//         </div>
//     )
// }



 

 

