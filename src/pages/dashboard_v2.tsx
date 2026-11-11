import { useEffect, useMemo, useState } from "react";
import Jumbotron from "../components/dashboard_2/jumbotron.tsx";
import CalendarBox, { toKey, type Agenda } from "../components/dashboard_2/calendarbox";
import CalendarDesc from "../components/dashboard_2/calendardesc";
import TriwulanStat from "../components/dashboard_2/triwulanStat";
import Leaderboard, { type LeaderboardData } from "../components/dashboard_2/leaderboard";
import dashboardData from "../data/dashboardData.json";
import type { DashboardData } from "../types/dashboard";
import data from "../data/leaderboard.json";
import { useAuth } from "../lib/AuthContext";
import { fetchAgendas } from "../lib/supabaseAgendaData";

export default function DashboardV2() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgendas()
      .then(setAgendas)
      .catch((err: Error) => setAgendaError(err.message));
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
    <div className="min-h-screen w-full flex flex-col items-center overflow-x-hidden">
      <Jumbotron />

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
          {agendaError ? (
            <div className="rounded-3xl bg-white px-7 py-8 text-sm text-red-600 shadow-[3px_5px_8px_rgba(0,0,0,0.25)]">
              Gagal memuat agenda: {agendaError}
            </div>
          ) : (
            <CalendarDesc
              selectedDate={selectedDate}
              byDate={byDate}
              activeId={activeId}
              setActiveId={setActiveId}
              setAgendas={setAgendas}
              onPickAgenda={pickAgenda}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>

      <TriwulanStat statData={dashboardData as unknown as DashboardData} />
      <Leaderboard data={data as LeaderboardData} />
    </div>
  );
}