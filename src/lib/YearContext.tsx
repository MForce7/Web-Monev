import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

/** Tahun yang didukung aplikasi. Tambah di sini kalau nanti ada 2028, dst. */
export const SUPPORTED_YEARS: number[] = [2026, 2027];

const STORAGE_KEY = "tahun-aktif";

/** Tahun berjalan, dibatasi ke rentang SUPPORTED_YEARS. */
function getCurrentYear(): number {
  const now = new Date().getFullYear();
  const first = SUPPORTED_YEARS[0];
  const last = SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1];
  return Math.min(Math.max(now, first), last);
}

function readStoredYear(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return SUPPORTED_YEARS.includes(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type YearContextValue = {
  /** Tahun yang sedang dipakai semua halaman. */
  year: number;
  /** Ganti tahun aktif. Diabaikan kalau tahun itu tidak boleh diakses role ini. */
  setYear: (year: number) => void;
  /** Tahun yang boleh dipilih: admin semua tahun, selain admin hanya tahun berjalan. */
  years: number[];
  /** Tahun berjalan menurut tanggal hari ini. */
  currentYear: number;
};

const YearContext = createContext<YearContextValue | null>(null);

export function YearProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const currentYear = getCurrentYear();

  // Pilihan terakhir diingat di browser. Tahun yang dipakai sebenarnya
  // dihitung ulang di bawah supaya tetap patuh pada aturan role.
  const [chosen, setChosen] = useState<number>(() => readStoredYear() ?? currentYear);

  const years = useMemo(
    () => (isAdmin ? SUPPORTED_YEARS : [currentYear]),
    [isAdmin, currentYear],
  );

  // Selain admin otomatis kembali ke tahun berjalan.
  const year = years.includes(chosen) ? chosen : currentYear;

  const setYear = useCallback(
    (next: number) => {
      if (!years.includes(next)) return;
      setChosen(next);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* penyimpanan browser tidak tersedia, abaikan */
      }
    },
    [years],
  );

  const value = useMemo(
    () => ({ year, setYear, years, currentYear }),
    [year, setYear, years, currentYear],
  );

  return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
}

export function useYear(): YearContextValue {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error("useYear harus dipakai di dalam <YearProvider>");
  return ctx;
}