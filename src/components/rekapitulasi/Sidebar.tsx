import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { sidebarMenu, sidebarOutput } from "../../config/Datacontoh.ts";

/* ---------- Warna: tiap grup punya aksen sendiri, satu keluarga hangat (merah -> koral) ---------- */
export type Warna = {
  grad: string; // gradasi tombol
  bg: string; // latar daftar
  hover: string;
  aktif: string; // latar item terpilih
  bar: string; // garis penanda di sisi kiri item terpilih
  ring: string; // cincin saat grup/tombol aktif
};

const WARNA_LOGBOOK: Warna = {
  grad: "linear-gradient(90deg, #a50f2a 0%, #e5303f 55%, #ff7a59 100%)", // anggur -> merah -> koral
  bg: "#fff3ee",
  hover: "#ffe4da",
  aktif: "#ffd2c2",
  bar: "#e5303f",
  ring: "#e5303f",
};
const WARNA_OUTPUT: Warna = {
  grad: "linear-gradient(90deg, #6d0b22 0%, #b3122b 55%, #ef4458 100%)", // anggur tua -> merah delima
  bg: "#fdf0f3",
  hover: "#fadfe5",
  aktif: "#f5c6d1",
  bar: "#b3122b",
  ring: "#b3122b",
};
const WARNA_PEMANTAUAN: Warna = {
  grad: "linear-gradient(90deg, #3b0a17 0%, #7a0f27 100%)", // anggur gelap, paling tegas
  bg: "#fdf0f3",
  hover: "#fadfe5",
  aktif: "#f5c6d1",
  bar: "#7a0f27",
  ring: "#7a0f27",
};

/** Paket warna sidebar. Bisa dikirim dari halaman lewat prop `warna`; kalau tidak, pakai bawaan ini. */
export type PaletSidebar = {
  logbook: Warna;
  output: Warna;
  pemantauan: Warna;
  teks: string; // warna tulisan item di dalam daftar
};

export const PALET_BAWAAN: PaletSidebar = {
  logbook: WARNA_LOGBOOK,
  output: WARNA_OUTPUT,
  pemantauan: WARNA_PEMANTAUAN,
  teks: "#5a0a1a",
};

/* ---------- Menu: daftar diambil dari config yang sudah ada ---------- */
type Grup = { id: "logbook" | "output"; judul: string; items: readonly string[] };

const GRUP_MENU: Grup[] = [
  { id: "logbook", judul: "Rekap Logbook", items: sidebarMenu },
  { id: "output", judul: "Rekap Output", items: sidebarOutput },
];

/* ---------- Animasi ---------- */
const DURASI = 320; // ms
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // melambat halus di akhir
const TINGGI_TOMBOL = 36; // h-9

const kotakClass =
  "overflow-hidden rounded-2xl shadow-[0_4px_10px_rgba(28,61,137,0.28)] transition-shadow";
const cincinAktif = "ring-2 ring-offset-2";
const warnaCincin = (w: Warna) => ({ "--tw-ring-color": w.ring }) as CSSProperties;

/* ---------- Panah ke bawah (berputar ke atas saat daftar terbuka) ---------- */
function Panah({ terbuka }: { terbuka: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 motion-reduce:transition-none"
      style={{
        transform: `translateY(-50%) rotate(${terbuka ? 180 : 0}deg)`,
        transition: `transform ${DURASI}ms ${EASE}`,
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

/* ---------- Satu grup dropdown (muncul saat kursor di atasnya) ---------- */
function GrupDropdown({
  grup,
  warna: w,
  teks,
  active,
  open,
  onOpen,
  onClose,
  onCloseNow,
  onPilih,
}: {
  grup: Grup;
  warna: Warna;
  teks: string;
  active: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void; // menutup dengan jeda singkat (supaya tidak berkedip)
  onCloseNow: () => void;
  onPilih: (item: string) => void;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isiRef = useRef<HTMLUListElement>(null);
  const jenisPenunjuk = useRef<string>("mouse");
  const [tinggiIsi, setTinggiIsi] = useState(0);

  const adaAktif = (grup.items as readonly string[]).includes(active);
  // Grup yang berisi menu aktif selalu terbuka (dan diberi cincin biru) supaya kelihatan posisi kita.
  // Grup lain terbuka sementara saat di-hover. Keduanya menggeser menu di bawahnya.
  const tersemat = adaAktif;
  const tampil = open || tersemat;

  // Ukur tinggi daftar supaya tinggi <li> bisa dianimasikan (menu di bawahnya bergeser halus).
  useLayoutEffect(() => {
    const el = isiRef.current;
    if (!el) return;
    const ukur = () => setTinggiIsi(el.offsetHeight);
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grup.items]);

  // Hover hanya berlaku untuk mouse. Di layar sentuh, dropdown dibuka dengan tap.
  const masukHover = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") onOpen();
  };
  const keluarHover = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") onClose();
  };

  return (
    <li
      ref={wrapRef}
      className="relative rounded-2xl motion-reduce:!transition-none"
      // Tinggi ikut daftar yang terbuka (hover maupun tersemat) -> menu di bawahnya
      // bergeser turun dengan mulus, tidak ada yang menumpuk.
      style={{
        height: TINGGI_TOMBOL + (tampil ? tinggiIsi : 0),
        transition: `height ${DURASI}ms ${EASE}`,
      }}
      onPointerEnter={masukHover}
      onPointerLeave={keluarHover}
      onFocus={onOpen}
      onBlur={(e: ReactFocusEvent<HTMLLIElement>) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onCloseNow();
          triggerRef.current?.focus();
        }
      }}
    >
      <div
        className={`absolute inset-x-0 top-0 bg-white ${kotakClass} ${
          tersemat ? cincinAktif : "ring-0 ring-transparent"
        }`}
        style={tersemat ? warnaCincin(w) : undefined}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={tampil}
          aria-controls={listId}
          onPointerDown={(e) => {
            jenisPenunjuk.current = e.pointerType;
          }}
          onClick={(e) => {
            // Mouse: sudah terbuka lewat hover, klik tidak menutupnya.
            // Sentuh / keyboard: klik membuka dan menutup bergantian.
            const mouse = jenisPenunjuk.current === "mouse" && e.detail > 0;
            if (mouse) onOpen();
            else if (open) onCloseNow();
            else onOpen();
          }}
          className="relative flex h-9 w-full items-center justify-center whitespace-nowrap pl-2 pr-6 text-sm font-bold text-white"
          style={{ background: w.grad }}
        >
          {grup.judul}
          <Panah terbuka={tampil} />
        </button>

        {/* Daftar selalu ada di DOM; tingginya dianimasikan 0 -> penuh (grid 0fr -> 1fr) */}
        <div
          className="grid motion-reduce:!transition-none"
          style={{
            gridTemplateRows: tampil ? "1fr" : "0fr",
            transition: `grid-template-rows ${DURASI}ms ${EASE}`,
          }}
        >
          <div
            className="min-h-0 overflow-hidden"
            style={{
              opacity: tampil ? 1 : 0,
              // sembunyikan dari fokus keyboard / pembaca layar setelah animasi menutup selesai
              visibility: tampil ? "visible" : "hidden",
              transition: `opacity ${DURASI}ms ${EASE}, visibility 0s linear ${tampil ? 0 : DURASI}ms`,
            }}
          >
            <ul
              ref={isiRef}
              id={listId}
              role="menu"
              aria-label={grup.judul}
              style={{ background: w.bg }}
            >
              {grup.items.map((item) => {
                const dipilih = item === active;
                return (
                  <li key={item} role="none" className="border-t border-white">
                    <button
                      type="button"
                      role="menuitem"
                      aria-current={dipilih ? "page" : undefined}
                      onClick={() => onPilih(item)}
                      className="w-full py-2 text-center text-sm font-bold transition-colors duration-200"
                      style={{
                        color: teks,
                        background: dipilih ? w.aktif : undefined,
                        // garis penanda di kiri untuk item terpilih
                        boxShadow: dipilih ? `inset 4px 0 0 ${w.bar}` : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!dipilih) e.currentTarget.style.background = w.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = dipilih ? w.aktif : "";
                      }}
                    >
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ---------- Sidebar ---------- */
type SidebarProps = {
  /** Menu yang sedang aktif, mis. "CFC" atau "Purwarupa" (sama seperti sidebar lama) */
  active: string;
  /** Dipanggil dengan nama item yang diklik, mis. "Purwarupa" (sama seperti sidebar lama) */
  onChange: (value: string) => void;
  /** Dipanggil saat tombol Pemantauan diklik (mis. pindah halaman). Tidak menyentuh onChange. */
  onPemantauan?: () => void;
  /** Beri true kalau halaman Pemantauan sedang dibuka, supaya tombolnya ditandai aktif */
  pemantauanAktif?: boolean;
  /** Warna sidebar (opsional). Kalau tidak diisi, pakai PALET_BAWAAN. */
  warna?: PaletSidebar;
};

export default function Sidebar({
  active,
  onChange,
  onPemantauan,
  pemantauanAktif = false,
  warna = PALET_BAWAAN,
}: SidebarProps) {
  const [bukaId, setBukaId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const batalTutup = () => window.clearTimeout(timer.current);
  const buka = (id: string) => {
    batalTutup();
    setBukaId(id);
  };
  const tutup = () => {
    batalTutup();
    timer.current = window.setTimeout(() => setBukaId(null), 200);
  };
  const tutupSegera = () => {
    batalTutup();
    setBukaId(null);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <aside className="relative z-10 w-40 shrink-0 bg-white px-3 py-5 shadow-[4px_0_10px_rgba(0,0,0,0.12)] md:w-44">
      <nav aria-label="Menu rekap">
        <ul className="space-y-3">
          {GRUP_MENU.map((g) => (
            <GrupDropdown
              key={g.id}
              grup={g}
              warna={warna[g.id]}
              teks={warna.teks}
              active={active}
              open={bukaId === g.id}
              onOpen={() => buka(g.id)}
              onClose={tutup}
              onCloseNow={tutupSegera}
              onPilih={(item) => {
                onChange(item);
                tutupSegera();
              }}
            />
          ))}

          {/* Pemantauan: tanpa dropdown, langsung klik */}
          <li
            className={`rounded-2xl ${pemantauanAktif ? cincinAktif : ""}`}
            style={pemantauanAktif ? warnaCincin(warna.pemantauan) : undefined}
          >
            <button
              type="button"
              aria-current={pemantauanAktif ? "page" : undefined}
              onClick={() => onPemantauan?.()}
              className={`flex h-9 w-full items-center justify-center px-3 text-sm font-bold text-white transition hover:brightness-110 ${kotakClass}`}
              style={{ background: warna.pemantauan.grad }}
            >
              Pemantauan
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}