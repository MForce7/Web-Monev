import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logoBrin from "../assets/logo_brin.svg";
import userPhoto from "../assets/hero.png";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { clearAvatarCache, useAvatar } from "../lib/useAvatar";

const menus = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Logbook", href: "/logbook" },
];

const adminMenus = [
  { label: "Logbook User", href: "/admin/logbook" },
  { label: "Rekapitulasi", href: "/rekapitulasi" },
  { label: "Import Excel", href: "/importjson" },
  { label: "Rekap Pendanaan", href: "/rekappendanaan" },
  { label: "Kelompok Riset", href: "/kelompokriset" },
  { label: "Form Periset", href: "/formbaru" },
];

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { session, sessionLoading, role } = useAuth();
  const user = session?.user;
  const isAdmin = role === "admin";
  const { name, photoUrl, loading: photoLoading } = useAvatar(user?.id);

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayName = name?.trim() || user?.email || "";
  const adminAktif = adminMenus.some((m) => pathname.startsWith(m.href));

  // Menu utama: admin tidak perlu melihat "Logbook" (dia punya "Logbook User" di dropdown admin)
  const visibleMenus = isAdmin ? menus.filter((m) => m.label !== "Logbook") : menus;

  // Efek scroll (tidak berubah)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tutup dropdown akun: klik di luar atau tekan Esc
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    clearAvatarCache();
    setSigningOut(false);
    setOpen(false);
    navigate("/login", { replace: true });
  };

  const ringClass = scrolled ? "ring-red-900/30" : "ring-white/70";
  const avatarBase = `h-8 w-8 rounded-full ring-2 ${ringClass}`;

  function renderAvatar() {
    // Masih mengecek sesi / mengunduh foto
    if (sessionLoading || (user && photoLoading)) {
      return (
        <div
          role="img"
          aria-label="Memuat foto"
          className="h-8 w-8 animate-pulse rounded-full bg-gray-400/50 motion-reduce:animate-none"
        />
      );
    }

    // Belum login: klik -> halaman login
    if (!user) {
      return (
        <Link
          to="/login"
          title="Masuk"
          aria-label="Masuk"
          className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <img src={userPhoto} alt="Masuk" className={`${avatarBase} object-cover`} />
        </Link>
      );
    }

    // Sudah login: klik -> dropdown
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu akun"
        className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Foto ${displayName}`}
            className={`${avatarBase} object-cover`}
          />
        ) : (
          <span
            className={`${avatarBase} flex items-center justify-center bg-red-600 text-xs font-semibold text-white`}
          >
            {getInitials(displayName)}
          </span>
        )}
      </button>
    );
  }

  return (
    <nav
      className={`fixed inset-x-4 top-4 z-50 flex items-center justify-between rounded-xl px-6 py-3 transition-all duration-300 ${
        scrolled
          ? "bg-white text-red-900 shadow-md"
          : "bg-black/70 text-white backdrop-blur-md"
      }`}
    >
      <div>
        <img src={logoBrin} alt="Logo BRIN" className="h-8 w-auto" />
      </div>

      <ul className="flex items-center gap-12">
        {visibleMenus.map((menu) => (
          <li key={menu.href}>
            <NavLink
              to={menu.href}
              className={({ isActive }) =>
                `transition-colors hover:opacity-80 ${
                  isActive ? "font-bold" : "font-normal"
                }`
              }
            >
              {menu.label}
            </NavLink>
          </li>
        ))}

        {/* Admin: dropdown hanya dirender kalau role === 'admin' */}
        {isAdmin && (
          <li className="group relative">
            <button
              type="button"
              aria-haspopup="menu"
              className={`flex items-center gap-1 transition-colors hover:opacity-80 focus-visible:outline-none ${
                adminAktif ? "font-bold" : "font-normal"
              }`}
            >
              Admin
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* pt-3 menjembatani jarak supaya dropdown tidak menutup saat kursor turun */}
            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div
                role="menu"
                aria-label="Menu admin"
                className="w-52 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl ring-1 ring-black/5"
              >
                {adminMenus.map((m) => (
                  <NavLink
                    key={m.href}
                    to={m.href}
                    role="menuitem"
                    className={({ isActive }) =>
                      `block px-4 py-2.5 text-sm hover:bg-red-50 focus:bg-red-50 focus:outline-none ${
                        isActive ? "font-bold text-red-900" : ""
                      }`
                    }
                  >
                    {m.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </li>
        )}
      </ul>

      <div ref={wrapRef} className="relative">
        {renderAvatar()}

        {open && user && (
          <div
            role="menu"
            aria-label="Menu akun"
            className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl ring-1 ring-black/5"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-red-900">{displayName}</p>
              {name && <p className="truncate text-xs text-gray-500">{user.email}</p>}
            </div>

            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-red-50 focus:bg-red-50 focus:outline-none"
            >
              Buka profil
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={signingOut}
              className="block w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 focus:bg-red-50 focus:outline-none disabled:opacity-60"
            >
              {signingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}