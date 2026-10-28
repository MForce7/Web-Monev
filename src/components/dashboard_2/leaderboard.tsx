import { useState } from "react";
import PiktogramKepatuhan, { type StatusItem } from "./leaderboard/piktogramLead";
import LeaderboardSection from "./leaderboard/leaderboardSection";

export type LeaderboardData = {
  "Status Kelengkapan Data": StatusItem[];
};

export interface LeaderboardProps {
  data: LeaderboardData;
  className?: string;
}

export default function Leaderboard({ data, className = "mt-20" }: LeaderboardProps) {
  const [urutan, setUrutan] = useState<"tertinggi" | "terendah">("tertinggi");
  const items = data["Status Kelengkapan Data"];

  return (
    <div className={className}>
      <LeaderboardSection
        peringkat={items}
        urutan={urutan}
        onPrev={() => setUrutan("tertinggi")}
        onNext={() => setUrutan("terendah")}
      >
        <PiktogramKepatuhan data={items} urutan={urutan} />
      </LeaderboardSection>
    </div>
  );
}