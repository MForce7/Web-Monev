import Jumbotron from "../components/dashboard_2/jumbotron.tsx";
import TriwulanStat from "../components/dashboard_2/triwulanStat";
import Leaderboard, { type LeaderboardData } from "../components/dashboard_2/leaderboard";
import { rawDataPr, rawDataChart, rawData } from "../data/index.ts";
import data from "../data/leaderboard.json";

export default function DashboardV2() {

    return (
        <div className="min-h-screen w-screen flex flex-col items-center overflow-hidden"  >
            <Jumbotron />
            <TriwulanStat rawDataPr={rawDataPr} rawDataChart={rawDataChart} rawData={rawData} />
            <Leaderboard data={data as LeaderboardData} />
        </div>
    )
}



 
