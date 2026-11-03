import Jumbotron from "../components/dashboard_2/jumbotron.tsx";
import TriwulanStat from "../components/dashboard_2/triwulanStat";
import Leaderboard, { type LeaderboardData } from "../components/dashboard_2/leaderboard";
// import { rawDataPr, rawDataChart, rawData } from "../data/dashboardData.json";
import dashboardData from "../data/dashboardData.json";
import type { DashboardData } from "../types/dashboard";
import data from "../data/leaderboard.json";

export default function DashboardV2() {

    return (
        <div className="min-h-screen w-screen flex flex-col items-center overflow-hidden"  >
            <Jumbotron />
            {/* <TriwulanStat statData={    } /> */}
            <TriwulanStat statData={dashboardData as unknown as DashboardData} />;
            <Leaderboard data={data as LeaderboardData} />
        </div>
    )
}


// export default function Page() {
//   return 
// }

 
