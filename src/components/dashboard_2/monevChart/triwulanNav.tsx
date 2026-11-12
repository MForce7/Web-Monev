export type Triwulan = "I" | "II" | "III" | "IV";

const DEFAULT_OPTIONS: Triwulan[] = ["I", "II", "III", "IV"];

interface TriwulanNavbarProps {
  value: Triwulan; // triwulan yang sedang aktif (state ada di parent)
  onChange: (triwulan: Triwulan) => void; // dipanggil saat tab diklik
  options?: Triwulan[]; // daftar tab yang ditampilkan
}

const wrapper =
  "flex w-full max-w-3xl gap-1 rounded-full bg-[#f22838] p-1 shadow-[0_4px_10px_rgba(0,0,0,0.25)] sm:p-1.5";
const tabBase =
  "flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full border-0 px-1 text-center text-[11px] font-bold leading-4 transition-colors sm:h-[54px] sm:px-4 sm:text-base sm:leading-5 lg:text-[20px] lg:leading-[22px]";
const tabOn = "bg-white text-[#f22838] shadow-[0_2px_6px_rgba(0,0,0,0.2)]";
const tabOff = "bg-transparent text-white hover:bg-white/20";

export default function TriwulanNavbar({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: TriwulanNavbarProps) {
  return (
    <nav aria-label="Pilih triwulan" className="flex w-full justify-center">
      <div className={wrapper} role="tablist">
        {options.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={value === t}
            className={`${tabBase} ${value === t ? tabOn : tabOff}`}
            onClick={() => onChange(t)}
          >
            <span>
              MONEV
              <br />
              Triwulan {t}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}