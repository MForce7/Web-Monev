import { useEffect, useId, useRef, useState } from "react";

/** Panah bulat merah di ujung kanan tombol dropdown */
function Chevron({ open }: { open: boolean }) {
  return (
    <span className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#f25c6a]">
      <svg
        viewBox="0 0 12 12"
        className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 4.5l3 3 3-3" />
      </svg>
    </span>
  );
}

/** Dropdown dasar: tombol bulat putih, daftar pilihan muncul di bawahnya */
export default function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Tutup kalau klik di luar atau tekan Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    // Wrapper menjaga tinggi tetap 36px, panel melebar ke bawah tanpa menggeser isi halaman
    <div ref={ref} className="relative h-9">
      <div className="absolute inset-x-0 top-0 z-30 overflow-hidden rounded-[1.1rem] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className="relative flex h-9 w-full items-center justify-center px-10 text-sm font-bold text-[#e8202f]"
        >
          {value ?? label}
          <Chevron open={open} />
        </button>

        {open && (
          <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto">
            {options.map((opt) => {
              const dipilih = opt === value;
              return (
                <li key={opt} role="option" aria-selected={dipilih}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`w-full border-t border-gray-200 py-1.5 text-center text-xs font-bold text-[#e8202f] transition hover:bg-red-50 ${
                      dipilih ? "bg-red-50" : ""
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}