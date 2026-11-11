import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { formatDate, type Agenda } from "./calendarbox";
import { createAgenda, deleteAgenda as deleteAgendaApi, updateAgenda } from "../../lib/supabaseAgendaData";

type FormState = {
  name: string;
  hour: string;
  minute: string;
  place: string;
  zoomLink: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  hour: "",
  minute: "",
  place: "",
  zoomLink: "",
  description: "",
};

const formatTime = (time: string) => time.replace(":", ".");

const BAR_GRADIENT = "linear-gradient(to bottom, #F22838, #FFB322)";

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

function PillButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#8B0303] shadow-[0_2px_5px_rgba(0,0,0,0.25)] transition hover:bg-[#FFF3F3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F22838] disabled:opacity-60"
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

type CalendarDescProps = {
  selectedDate: string;
  byDate: Record<string, Agenda[]>;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  setAgendas: Dispatch<SetStateAction<Agenda[]>>;
  onPickAgenda: (agenda: Agenda) => void;
  /** Hanya admin yang bisa tambah/edit/hapus agenda */
  isAdmin: boolean;
};

export default function CalendarDesc({
  selectedDate,
  byDate,
  activeId,
  setActiveId,
  setAgendas,
  onPickAgenda,
  isAdmin,
}: CalendarDescProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    place: "",
    zoomLink: "",
    description: "",
  });
  const [editError, setEditError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedAgendas = byDate[selectedDate] ?? [];

  const upcomingGroups = Object.keys(byDate)
    .filter((d) => d > selectedDate)
    .sort()
    .map((d) => ({ date: d, items: byDate[d] }));

  const activeAgenda =
    selectedAgendas.find((a) => a.id === activeId) ?? selectedAgendas[0] ?? null;

  useEffect(() => {
    setEditing(false);
    setEditError("");
    setConfirmDelete(false);
  }, [activeAgenda?.id]);

  /* ---------- hapus & edit (admin saja) ---------- */

  const handleDelete = async () => {
    if (!activeAgenda) return;
    const id = activeAgenda.id;
    setDeleting(true);
    try {
      await deleteAgendaApi(id);
      setAgendas((prev) => prev.filter((a) => a.id !== id));
      setActiveId(null);
      setConfirmDelete(false);
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setDeleting(false);
    }
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

  const saveEdit = async () => {
    if (!activeAgenda) return;
    if (!draft.name.trim()) {
      setEditError("Judul agenda wajib diisi.");
      return;
    }
    const id = activeAgenda.id;
    setSaving(true);
    setEditError("");
    try {
      const updated = await updateAgenda(id, {
        name: draft.name.trim(),
        place: draft.place.trim(),
        zoomLink: draft.zoomLink.trim(),
        description: draft.description.trim(),
      });
      setAgendas((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditing(false);
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- form tambah agenda (admin saja) ---------- */

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowForm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm]);

  const setField = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setTimePart = (field: "hour" | "minute", raw: string, max: number) => {
    let v = raw.replace(/\D/g, "").slice(0, 2);
    if (v !== "" && Number(v) > max) v = String(max);
    setField(field, v);
  };

  const padTimePart = (field: "hour" | "minute") =>
    setForm((f) => (f[field].length === 1 ? { ...f, [field]: "0" + f[field] } : f));

  const handleSave = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setFormError("Nama agenda wajib diisi.");
      return;
    }
    if (form.hour.length !== 2 || form.minute.length !== 2) {
      setFormError("Waktu diisi 2 digit untuk jam dan menit, contoh 09 dan 30.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const newAgenda = await createAgenda({
        date: selectedDate,
        time: `${form.hour}:${form.minute}`,
        name: form.name.trim(),
        place: form.place.trim(),
        zoomLink: form.zoomLink.trim(),
        description: form.description.trim(),
      });
      setAgendas((prev) => [...prev, newAgenda]);
      setActiveId(newAgenda.id);
      closeForm();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg bg-[#FADADA] px-3 py-1.5 text-sm text-[#353535] outline-none focus-visible:ring-2 focus-visible:ring-[#F22838]";

  return (
    <div className="relative">
      <section
        aria-label="Agenda"
        className="grid gap-6 rounded-3xl bg-white px-7 py-8 shadow-[3px_5px_8px_rgba(0,0,0,0.25)] md:h-[400px] md:grid-cols-[minmax(0,1fr)_2px_minmax(0,1fr)] lg:absolute lg:inset-0 lg:h-auto"
      >
        <div className="max-h-[330px] min-h-0 space-y-4 overflow-y-auto pr-1 md:h-full md:max-h-none">
          <div className="rounded-2xl bg-[#FADADA] px-4 py-3">
            <h3 className="text-lg font-bold leading-6">{formatDate(selectedDate)}</h3>

            {selectedAgendas.length === 0 ? (
              <p className="text-sm leading-5">Tidak ada agenda</p>
            ) : (
              <AgendaRows
                items={selectedAgendas}
                activeId={activeAgenda?.id}
                onPick={onPickAgenda}
              />
            )}

            {isAdmin && (
              <div className="mt-1 flex justify-end">
                <PillButton onClick={openForm}>
                  <PlusCircle />
                  Tambah Agenda
                </PillButton>
              </div>
            )}
          </div>

          {upcomingGroups.map((g) => (
            <div key={g.date} className="px-4">
              <h3 className="text-lg font-bold leading-6">{formatDate(g.date)}</h3>
              <AgendaRows items={g.items} onPick={onPickAgenda} />
            </div>
          ))}
        </div>

        <div aria-hidden="true" className="h-[2px] bg-[#F22838] md:h-auto" />

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
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
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
                  <PillButton onClick={saveEdit} disabled={saving}>
                    <CheckCircle />
                    {saving ? "Menyimpan..." : "Simpan"}
                  </PillButton>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold leading-6">{activeAgenda?.name}</h3>
                {isAdmin && activeAgenda &&
                  (confirmDelete ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="text-xs font-semibold text-[#BF1818]">
                        Hapus agenda ini?
                      </span>
                      <PillButton onClick={handleDelete} disabled={deleting}>
                        <TrashCircle />
                        {deleting ? "Menghapus..." : "Ya, hapus"}
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

      {showForm && isAdmin && (
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
                <PillButton type="submit" disabled={saving}>
                  <CheckCircle />
                  {saving ? "Menyimpan..." : "Simpan"}
                </PillButton>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}