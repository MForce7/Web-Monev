import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type Agenda = {
  id: string;
  date: string; // format YYYY-MM-DD
  time: string; // format HH:MM
  name: string;
  place: string;
  zoomLink: string;
  description: string;
};

type FormState = {
  name: string;
  hour: string;
  minute: string;
  place: string;
  zoomLink: string;
  description: string;
};

const MONTHS = [
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

const EMPTY_FORM: FormState = {
  name: "",
  hour: "",
  minute: "",
  place: "",
  zoomLink: "",
  description: "",
};

const pad = (n: number) => String(n).padStart(2, "0");

const toKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

const formatDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

// "09:30" -> "09.30"
const formatTime = (time: string) => time.replace(":", ".");

const BAR_GRADIENT = "linear-gradient(to bottom, #F22838, #FFB322)";
const UNDERLINE_GRADIENT = "linear-gradient(to right, #F22838, #FFB322)";

/* ------------------------------------------------------------------ */
/* Data awal (contoh) – ganti dengan data dari API / database          */
/* ------------------------------------------------------------------ */

const INITIAL_AGENDAS: Agenda[] = [
  {
    id: "a1",
    date: "2026-11-03",
    time: "09:30",
    name: "Rapat Internal ORPA",
    place: "Ruang Rapat Lt. 2",
    zoomLink: "https://zoom.us/j/1234567890",
    description: "Pembahasan progres kegiatan ORPA bulan November.",
  },
  {
    id: "a2",
    date: "2026-11-03",
    time: "14:30",
    name: "Sosialisasi Pusat Data",
    place: "Ruang Rapat Lt. 3",
    zoomLink: "https://zoom.us/j/1234567891",
    description: "Sosialisasi layanan dan tata kelola Pusat Data.",
  },
  {
    id: "a3",
    date: "2026-11-20",
    time: "09:30",
    name: "Zoom Meeting ORPA",
    place: "Online",
    zoomLink: "https://zoom.us/j/1234567892",
    description: "",
  },
  {
    id: "a4",
    date: "2026-11-20",
    time: "14:30",
    name: "Presentasi Progres",
    place: "Online",
    zoomLink: "https://zoom.us/j/1234567893",
    description: "",
  },
  {
    id: "a5",
    date: "2026-11-26",
    time: "09:30",
    name: "Zoom Meeting ORPA",
    place: "Online",
    zoomLink: "https://zoom.us/j/1234567894",
    description: "",
  },
];

/* ------------------------------------------------------------------ */
/* Ikon kecil                                                          */
/* ------------------------------------------------------------------ */

function PlusCircle() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="6" fill="#BF1818" />
      <path d="M6 3v6M3 6h6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="6" fill="#BF1818" />
      <path
        d="M3.4 6.2l1.8 1.8 3.4-3.8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilCircle() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="6" fill="#BF1818" />
      <path
        d="M3.6 8.4l.4-1.6 3.4-3.4 1.2 1.2-3.4 3.4-1.6.4z"
        fill="none"
        stroke="#fff"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashCircle() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="6" fill="#BF1818" />
      <path
        d="M3.8 4.2h4.4M5 4.2V3.5h2v.7M4.4 4.2l.2 3.8h2.8l.2-3.8"
        fill="none"
        stroke="#fff"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */

function PillButton({
  children,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#8B0303] shadow-[0_2px_5px_rgba(0,0,0,0.25)] transition hover:bg-[#FFF3F3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F22838]"
    >
      {children}
    </button>
  );
}

function AgendaRows({
  items,
  activeId,
  onPick,
}: {
  items: Agenda[];
  activeId?: string;
  onPick: (agenda: Agenda) => void;
}) {
  return (
    <div className="mt-1 flex gap-2">
      <span
        aria-hidden="true"
        className="w-[3px] shrink-0 rounded-full"
        style={{ background: items.length > 1 ? BAR_GRADIENT : "#F22838" }}
      />
      <ul className="min-w-0 flex-1">
        {items.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onPick(a)}
              aria-current={a.id === activeId ? "true" : undefined}
              className={`flex w-full items-baseline gap-2 text-left text-sm leading-6 hover:underline ${
                a.id === activeId ? "text-[#8B0303]" : "text-[#353535]"
              }`}
            >
              <span className="font-bold">{formatTime(a.time)}</span>
              <span className="truncate">{a.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman utama                                                       */
/* ------------------------------------------------------------------ */

export default function Calendar() {
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [agendas, setAgendas] = useState<Agenda[]>(INITIAL_AGENDAS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    place: "",
    zoomLink: "",
    description: "",
  });
  const [editError, setEditError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  /* ---------- turunan data ---------- */

  const byDate = useMemo(() => {
    const map: Record<string, Agenda[]> = {};
    [...agendas]
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .forEach((a) => {
        (map[a.date] ||= []).push(a);
      });
    return map;
  }, [agendas]);

  const selectedAgendas = byDate[selectedDate] ?? [];

  // agenda pada tanggal setelah tanggal yang dipilih
  const upcomingGroups = useMemo(
    () =>
      Object.keys(byDate)
        .filter((d) => d > selectedDate)
        .sort()
        .map((d) => ({ date: d, items: byDate[d] })),
    [byDate, selectedDate]
  );

  const activeAgenda =
    selectedAgendas.find((a) => a.id === activeId) ?? selectedAgendas[0] ?? null;

  // keluar dari mode edit kalau agenda yang aktif berganti
  useEffect(() => {
    setEditing(false);
    setEditError("");
    setConfirmDelete(false);
  }, [activeAgenda?.id]);

  const deleteAgenda = () => {
    if (!activeAgenda) return;
    const id = activeAgenda.id;
    // TODO: hapus di API / database di sini
    setAgendas((prev) => prev.filter((a) => a.id !== id));
    setActiveId(null);
    setConfirmDelete(false);
  };

  const startEdit = () => {
    if (!activeAgenda) return;
    setDraft({
      name: activeAgenda.name,
      place: activeAgenda.place,
      zoomLink: activeAgenda.zoomLink,
      description: activeAgenda.description,
    });
    setEditError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError("");
  };

  const saveEdit = () => {
    if (!activeAgenda) return;
    if (!draft.name.trim()) {
      setEditError("Judul agenda wajib diisi.");
      return;
    }
    const id = activeAgenda.id;
    // TODO: kirim perubahan ke API / database di sini
    setAgendas((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              name: draft.name.trim(),
              place: draft.place.trim(),
              zoomLink: draft.zoomLink.trim(),
              description: draft.description.trim(),
            }
          : a
      )
    );
    setEditing(false);
    setEditError("");
  };

  /* ---------- grid kalender ---------- */

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // selalu 6 baris supaya tinggi kotak kalender konsisten di semua bulan
  while (cells.length < 42) cells.push(null);

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

  /* ---------- form tambah agenda ---------- */

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm]);

  const setField = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Waktu: hanya angka, maksimal 2 digit, dibatasi 00-23 / 00-59
  const setTimePart = (field: "hour" | "minute", raw: string, max: number) => {
    let v = raw.replace(/\D/g, "").slice(0, 2);
    if (v !== "" && Number(v) > max) v = String(max);
    setField(field, v);
  };

  const padTimePart = (field: "hour" | "minute") =>
    setForm((f) => (f[field].length === 1 ? { ...f, [field]: "0" + f[field] } : f));

  const handleSave = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setFormError("Nama agenda wajib diisi.");
      return;
    }
    if (form.hour.length !== 2 || form.minute.length !== 2) {
      setFormError("Waktu diisi 2 digit untuk jam dan menit, contoh 09 dan 30.");
      return;
    }

    const newAgenda: Agenda = {
      id: `agenda-${Date.now()}`,
      date: selectedDate,
      time: `${form.hour}:${form.minute}`,
      name: form.name.trim(),
      place: form.place.trim(),
      zoomLink: form.zoomLink.trim(),
      description: form.description.trim(),
    };

    // TODO: kirim newAgenda ke API / database di sini
    setAgendas((prev) => [...prev, newAgenda]);
    setActiveId(newAgenda.id);
    closeForm();
  };

  const inputCls =
    "w-full rounded-lg bg-[#FADADA] px-3 py-1.5 text-sm text-[#353535] outline-none focus-visible:ring-2 focus-visible:ring-[#F22838]";

  /* ---------- tampilan ---------- */

  return (
    <div className="bg-[#F6F6F6] mt-18 px-4 py-10 font-sans text-[#353535] sm:px-8">
      <div className="mx-auto grid max-w-[1320px] items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
        {/* ================= KALENDER ================= */}
        <section
          aria-label="Kalender"
          className="rounded-3xl bg-white px-7 py-6 shadow-[3px_5px_8px_rgba(0,0,0,0.25)]"
        >
          <div ref={monthPickerRef} className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
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
                  onClick={() => shiftMonth(1)}
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
                    onClick={() => setViewYear((y) => y - 1)}
                    aria-label="Tahun sebelumnya"
                    className="rounded px-2 text-lg leading-none text-[#8B0303] hover:bg-[#FADADA]"
                  >
                    ‹
                  </button>
                  <span className="text-sm font-bold text-[#BF1818]">{viewYear}</span>
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y + 1)}
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
                        setViewMonth(i);
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
                    onClick={() => pickDate(key)}
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

        {/* ================= DAFTAR AGENDA + DETAIL ================= */}
        <div className="relative">
        <section
          aria-label="Agenda"
          className="grid gap-6 rounded-3xl bg-white px-7 py-8 shadow-[3px_5px_8px_rgba(0,0,0,0.25)] md:h-[400px] md:grid-cols-[minmax(0,1fr)_2px_minmax(0,1fr)] lg:absolute lg:inset-0 lg:h-auto"
        >
          {/* daftar agenda */}
          <div className="max-h-[330px] min-h-0 space-y-4 overflow-y-auto pr-1 md:h-full md:max-h-none">
            {/* tanggal terpilih (baris 1 = ada agenda, baris 2 = tidak ada agenda) */}
            <div className="rounded-2xl bg-[#FADADA] px-4 py-3">
              <h3 className="text-lg font-bold leading-6">{formatDate(selectedDate)}</h3>

              {selectedAgendas.length === 0 ? (
                <p className="text-sm leading-5">Tidak ada agenda</p>
              ) : (
                <AgendaRows
                  items={selectedAgendas}
                  activeId={activeAgenda?.id}
                  onPick={pickAgenda}
                />
              )}

              <div className="mt-1 flex justify-end">
                <PillButton onClick={openForm}>
                  <PlusCircle />
                  Tambah Agenda
                </PillButton>
              </div>
            </div>

            {/* agenda setelah tanggal terpilih */}
            {upcomingGroups.map((g) => (
              <div key={g.date} className="px-4">
                <h3 className="text-lg font-bold leading-6">{formatDate(g.date)}</h3>
                <AgendaRows items={g.items} onPick={pickAgenda} />
              </div>
            ))}
          </div>

          {/* garis pemisah */}
          <div aria-hidden="true" className="h-[2px] bg-[#F22838] md:h-auto" />

          {/* detail agenda */}
          <div className="flex min-h-0 flex-col text-sm leading-5 md:h-full md:overflow-y-auto md:pr-1">
            {editing ? (
              <div className="space-y-2">
                <div>
                  <label htmlFor="e-judul" className="font-bold">
                    Judul Agenda:
                  </label>
                  <input
                    id="e-judul"
                    autoFocus
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className={`${inputCls} mt-1`}
                  />
                </div>
                <div>
                  <label htmlFor="e-tempat">Tempat:</label>
                  <input
                    id="e-tempat"
                    value={draft.place}
                    onChange={(e) => setDraft((d) => ({ ...d, place: e.target.value }))}
                    className={`${inputCls} mt-1`}
                  />
                </div>
                <div>
                  <label htmlFor="e-zoom">Link Zoom Meeting:</label>
                  <input
                    id="e-zoom"
                    value={draft.zoomLink}
                    onChange={(e) => setDraft((d) => ({ ...d, zoomLink: e.target.value }))}
                    className={`${inputCls} mt-1`}
                  />
                </div>
                <div>
                  <label htmlFor="e-deskripsi">Deskripsi:</label>
                  <textarea
                    id="e-deskripsi"
                    rows={3}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    className={`${inputCls} mt-1 resize-none`}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p role="alert" className="text-xs font-semibold text-[#BF1818]">
                    {editError}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold text-[#353535] hover:bg-[#F6F6F6]"
                    >
                      Batal
                    </button>
                    <PillButton onClick={saveEdit}>
                      <CheckCircle />
                      Simpan
                    </PillButton>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold leading-6">{activeAgenda?.name}</h3>
                  {activeAgenda &&
                    (confirmDelete ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="text-xs font-semibold text-[#BF1818]">
                          Hapus agenda ini?
                        </span>
                        <PillButton onClick={deleteAgenda}>
                          <TrashCircle />
                          Ya, hapus
                        </PillButton>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold text-[#353535] hover:bg-[#F6F6F6]"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <PillButton onClick={startEdit}>
                          <PencilCircle />
                          Edit
                        </PillButton>
                        <PillButton onClick={() => setConfirmDelete(true)}>
                          <TrashCircle />
                          Hapus
                        </PillButton>
                      </div>
                    ))}
                </div>
                <p>
                  <span>Tempat:</span> {activeAgenda?.place}
                </p>
                <p>
                  <span>Link Zoom Meeting:</span>{" "}
                  {activeAgenda?.zoomLink && (
                    <a
                      href={activeAgenda.zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-[#BF1818] underline"
                    >
                      {activeAgenda.zoomLink}
                    </a>
                  )}
                </p>
                <div className="mt-3 min-h-[160px] overflow-y-auto rounded-2xl bg-[#FADADA] p-3 md:min-h-0 md:flex-1">
                  <p>Deskripsi:</p>
                  {activeAgenda?.description && (
                    <p className="mt-1 whitespace-pre-wrap">{activeAgenda.description}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
        </div>
      </div>

      {/* ================= POP UP TAMBAH AGENDA ================= */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <form
            onSubmit={handleSave}
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-form-agenda"
            className="w-full max-w-[640px] rounded-3xl bg-white px-7 pb-5 pt-6 shadow-[3px_6px_14px_rgba(0,0,0,0.3)]"
          >
            <h2 id="judul-form-agenda" className="sr-only">
              Tambah agenda {formatDate(selectedDate)}
            </h2>

            <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-x-2 gap-y-3 text-base font-bold">
              <label htmlFor="f-nama" className="pt-1">
                Nama Agenda
              </label>
              <span className="pt-1">:</span>
              <input
                id="f-nama"
                autoFocus
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={inputCls}
              />

              <label htmlFor="f-jam" className="pt-1">
                Waktu
              </label>
              <span className="pt-1">:</span>
              <div className="flex items-center gap-2">
                <input
                  id="f-jam"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="00"
                  aria-label="Jam (2 digit)"
                  value={form.hour}
                  onChange={(e) => setTimePart("hour", e.target.value, 23)}
                  onBlur={() => padTimePart("hour")}
                  className={`${inputCls} !w-12 text-center`}
                />
                <span>:</span>
                <input
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="00"
                  aria-label="Menit (2 digit)"
                  value={form.minute}
                  onChange={(e) => setTimePart("minute", e.target.value, 59)}
                  onBlur={() => padTimePart("minute")}
                  className={`${inputCls} !w-12 text-center`}
                />
              </div>

              <label htmlFor="f-tempat" className="pt-1">
                Tempat
              </label>
              <span className="pt-1">:</span>
              <input
                id="f-tempat"
                value={form.place}
                onChange={(e) => setField("place", e.target.value)}
                className={inputCls}
              />

              <label htmlFor="f-zoom" className="pt-1">
                Link Zoom
              </label>
              <span className="pt-1">:</span>
              <input
                id="f-zoom"
                value={form.zoomLink}
                onChange={(e) => setField("zoomLink", e.target.value)}
                className={inputCls}
              />

              <label htmlFor="f-deskripsi" className="pt-1">
                Deskripsi
              </label>
              <span className="pt-1">:</span>
              <textarea
                id="f-deskripsi"
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p role="alert" className="text-xs font-semibold text-[#BF1818]">
                {formError}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold text-[#353535] hover:bg-[#F6F6F6]"
                >
                  Batal
                </button>
                <PillButton type="submit">
                  <CheckCircle />
                  Simpan
                </PillButton>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}