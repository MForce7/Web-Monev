export type Triwulan = "I" | "II" | "III" | "IV";

const DEFAULT_OPTIONS: Triwulan[] = ["I", "II", "III", "IV"];

interface TriwulanNavbarProps {
  value: Triwulan; // triwulan yang sedang aktif (state ada di parent)
  onChange: (triwulan: Triwulan) => void; // dipanggil saat tab diklik
  options?: Triwulan[]; // daftar tab yang ditampilkan
}

const wrapper =
  "inline-flex gap-1 rounded-full bg-[#f22838] p-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.25)]";
const tabBase =
  "flex h-[54px] min-w-[160px] cursor-pointer items-center justify-center rounded-full border-0 px-6 text-center text-[20px] font-bold leading-[22px] transition-colors";
const tabOn = "bg-white text-[#f22838] shadow-[0_2px_6px_rgba(0,0,0,0.2)]";
const tabOff = "bg-transparent text-white hover:bg-white/20";

export default function TriwulanNavbar({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: TriwulanNavbarProps) {
  return (
    <nav aria-label="Pilih triwulan">
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
            MONEV
            <br />
            Triwulan {t}
          </button>
        ))}
      </div>
    </nav>
  );
}