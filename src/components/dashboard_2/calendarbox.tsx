import { useEffect, useRef, useState } from "react";

export type Agenda = {
  id: string;
  date: string; // format YYYY-MM-DD
  time: string; // format HH:MM
  name: string;
  place: string;
  zoomLink: string;
  description: string;
};

export const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n: number) => String(n).padStart(2, "0");

export const toKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

export const formatDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const UNDERLINE_GRADIENT = "linear-gradient(to right, #F22838, #FFB322)";

/* ------------------------------------------------------------------ */
/* Komponen                                                            */
/* ------------------------------------------------------------------ */

type CalendarBoxProps = {
  viewYear: number;
  viewMonth: number;
  selectedDate: string;
  todayKey: string;
  byDate: Record<string, Agenda[]>;
  onShiftMonth: (delta: number) => void;
  onChangeMonth: (month: number) => void;
  onChangeYear: (delta: number) => void;
  onPickDate: (key: string) => void;
};

export default function CalendarBox({
  viewYear,
  viewMonth,
  selectedDate,
  todayKey,
  byDate,
  onShiftMonth,
  onChangeMonth,
  onChangeYear,
  onPickDate,
}: CalendarBoxProps) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // tutup pemilih bulan saat klik di luar atau tekan Esc
  useEffect(() => {
    if (!showMonthPicker) return;
    const onDown = (e: MouseEvent) => {
      if (!monthPickerRef.current?.contains(e.target as Node)) setShowMonthPicker(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMonthPicker(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [showMonthPicker]);

  /* ---------- grid kalender ---------- */

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // selalu 6 baris supaya tinggi kotak kalender konsisten di semua bulan
  while (cells.length < 42) cells.push(null);

  return (
    <section
      aria-label="Kalender"
      className="rounded-3xl bg-white px-7 py-6 shadow-[3px_5px_8px_rgba(0,0,0,0.25)]"
    >
      <div ref={monthPickerRef} className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onShiftMonth(-1)}
              aria-label="Bulan sebelumnya"
              className="rounded px-1 text-lg leading-none text-[#8B0303] hover:bg-[#FADADA]"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setShowMonthPicker((v) => !v)}
              aria-haspopup="true"
              aria-expanded={showMonthPicker}
              aria-label="Pilih bulan dan tahun"
              className="min-w-[6.5rem] rounded-lg px-2 py-0.5 text-center text-base font-bold hover:bg-[#FADADA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F22838]"
            >
              {MONTHS[viewMonth]}
            </button>
            <button
              type="button"
              onClick={() => onShiftMonth(1)}
              aria-label="Bulan berikutnya"
              className="rounded px-1 text-lg leading-none text-[#8B0303] hover:bg-[#FADADA]"
            >
              ›
            </button>
          </div>
          <span className="text-base font-bold text-[#BF1818]">{viewYear}</span>
        </div>

        {showMonthPicker && (
          <div
            role="dialog"
            aria-label="Pilih bulan"
            className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl bg-white p-3 shadow-[3px_5px_12px_rgba(0,0,0,0.3)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onChangeYear(-1)}
                aria-label="Tahun sebelumnya"
                className="rounded px-2 text-lg leading-none text-[#8B0303] hover:bg-[#FADADA]"
              >
                ‹
              </button>
              <span className="text-sm font-bold text-[#BF1818]">{viewYear}</span>
              <button
                type="button"
                onClick={() => onChangeYear(1)}
                aria-label="Tahun berikutnya"
                className="rounded px-2 text-lg leading-none text-[#8B0303] hover:bg-[#FADADA]"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChangeMonth(i);
                    setShowMonthPicker(false);
                  }}
                  aria-pressed={i === viewMonth}
                  className={`rounded-lg px-1 py-1.5 text-xs font-bold transition hover:bg-[#FADADA] ${
                    i === viewMonth ? "bg-[#FADADA] text-[#8B0303]" : "text-[#353535]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-sm font-bold text-[#BF1818]">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="mb-2 mt-1.5 h-[2px] rounded-full"
        style={{ background: "linear-gradient(to right, #F22838, #8B0303)" }}
      />

      <div className="grid grid-cols-7 text-center">
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;

          const key = toKey(viewYear, viewMonth, day);
          const dayAgendas = byDate[key] ?? [];
          const isSelected = key === selectedDate;
          const isPast = key < todayKey;

          return (
            <div key={key} className="relative flex h-[37px] items-center justify-center">
              <button
                type="button"
                onClick={() => onPickDate(key)}
                aria-pressed={isSelected}
                aria-label={formatDate(key)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[17px] font-bold transition hover:bg-[#E9E9E9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F22838] ${
                  isSelected ? "bg-[#D9D9D9]" : ""
                } ${isPast ? "text-[#A3A3A3]" : ""}`}
              >
                {day}
              </button>
              {dayAgendas.length > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-1/2 h-[2px] w-3 -translate-x-1/2 rounded-full"
                  style={{
                    background: dayAgendas.length > 1 ? UNDERLINE_GRADIENT : "#F22838",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}