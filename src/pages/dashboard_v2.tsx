import { useMemo, useState } from "react";
import Jumbotron from "../components/dashboard_2/jumbotron.tsx";
import CalendarBox, { toKey, type Agenda } from "../components/dashboard_2/calendarbox";
import CalendarDesc from "../components/dashboard_2/calendardesc";
import TriwulanStat from "../components/dashboard_2/triwulanStat";
import Leaderboard, { type LeaderboardData } from "../components/dashboard_2/leaderboard";
import dashboardData from "../data/dashboardData.json";
import calendarData from "../data/calendar.json";
import type { DashboardData } from "../types/dashboard";
import data from "../data/leaderboard.json";

export default function DashboardV2() {
  /* ---------- state kalender (dipakai CalendarBox & CalendarDesc) ---------- */
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [agendas, setAgendas] = useState<Agenda[]>(calendarData as Agenda[]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map: Record<string, Agenda[]> = {};
    [...agendas]
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .forEach((a) => {
        (map[a.date] ||= []).push(a);
      });
    return map;
  }, [agendas]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pickDate = (key: string) => {
    setSelectedDate(key);
    setActiveId(null);
  };

  const pickAgenda = (a: Agenda) => {
    const [y, m] = a.date.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    setSelectedDate(a.date);
    setActiveId(a.id);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center overflow-x-hidden">
      <Jumbotron />

      {/* ================= KALENDER ================= */}
      <div className="w-full bg-[#F6F6F6] px-4 py-10 font-sans text-[#353535] sm:px-8">
        <div className="mx-auto grid max-w-[1320px] items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
          <CalendarBox
            viewYear={viewYear}
            viewMonth={viewMonth}
            selectedDate={selectedDate}
            todayKey={todayKey}
            byDate={byDate}
            onShiftMonth={shiftMonth}
            onChangeMonth={setViewMonth}
            onChangeYear={(delta) => setViewYear((y) => y + delta)}
            onPickDate={pickDate}
          />
          <CalendarDesc
            selectedDate={selectedDate}
            byDate={byDate}
            activeId={activeId}
            setActiveId={setActiveId}
            setAgendas={setAgendas}
            onPickAgenda={pickAgenda}
          />
        </div>
      </div>

      <TriwulanStat statData={dashboardData as unknown as DashboardData} />
      <Leaderboard data={data as LeaderboardData} />
    </div>
  );
}