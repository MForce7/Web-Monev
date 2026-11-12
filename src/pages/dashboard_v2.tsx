import { useEffect, useMemo, useState } from "react";
import Jumbotron from "../components/dashboard_2/jumbotron.tsx";
import CalendarBox, { toKey, type Agenda } from "../components/dashboard_2/calendarbox";
import CalendarDesc from "../components/dashboard_2/calendardesc";
import TriwulanStat from "../components/dashboard_2/triwulanStat";
import Leaderboard, { type LeaderboardData } from "../components/dashboard_2/leaderboard";
import type { DashboardData } from "../types/dashboard";
import { useAuth } from "../lib/AuthContext";
import { fetchAgendas } from "../lib/supabaseAgendaData";
import { fetchLeaderboardData, fetchTriwulanDashboardData } from "../lib/analyticsData";

export default function DashboardV2() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgendas().then(setAgendas).catch(() => {});

    Promise.all([fetchTriwulanDashboardData(), fetchLeaderboardData()])
      .then(([dash, leaderboard]) => {
        setDashboardData(dash);
        setLeaderboardData(leaderboard);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

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
    <div className="flex min-h-dvh w-full flex-col items-center overflow-x-hidden">
      <Jumbotron />

      <div className="w-full bg-[#F6F6F6] px-4 py-8 font-sans text-[#353535] sm:px-8 sm:py-10">
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
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {loadError && (
        <p className="px-6 py-4 text-sm text-red-600">Gagal memuat data statistik: {loadError}</p>
      )}

      {dashboardData && <TriwulanStat statData={dashboardData} />}
      {leaderboardData && <Leaderboard data={leaderboardData} />}
    </div>
  );
}