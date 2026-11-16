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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
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
  const [open, setOpen] = useState(false); // dropdown akun
  const [mobileOpen, setMobileOpen] = useState(false); // panel hamburger
  const [adminOpen, setAdminOpen] = useState(false); // dropdown admin (desktop)
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false); // accordion admin (mobile)
  const [signingOut, setSigningOut] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayName = name?.trim() || user?.email || "";
  const adminAktif = adminMenus.some((m) => pathname.startsWith(m.href));

  // Menu utama: admin tidak perlu melihat "Logbook" (dia punya "Logbook User" di dropdown admin)
  const visibleMenus = isAdmin ? menus.filter((m) => m.label !== "Logbook") : menus;

  // Efek scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tutup semua menu saat pindah halaman
  useEffect(() => {
    setMobileOpen(false);
    setAdminOpen(false);
    setOpen(false);
  }, [pathname]);

  // Tutup panel mobile kalau layar dilebarkan ke desktop (mis. rotasi iPad)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
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

  // Tutup dropdown admin dan panel mobile: klik di luar navbar atau Esc
  useEffect(() => {
    if (!adminOpen && !mobileOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
        setMobileOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAdminOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [adminOpen, mobileOpen]);

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    clearAvatarCache();
    setSigningOut(false);
    setOpen(false);
    setMobileOpen(false);
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
        onClick={() => {
          setOpen((v) => !v);
          setMobileOpen(false);
        }}
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
      ref={navRef}
      aria-label="Navigasi utama"
      className={`fixed inset-x-3 top-3 z-50 flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300 sm:inset-x-4 sm:top-4 sm:px-6 ${
        scrolled
          ? "bg-white text-red-900 shadow-md"
          : "bg-black/70 text-white backdrop-blur-md"
      }`}
    >
      <div className="shrink-0">
        <img src={logoBrin} alt="Logo BRIN" className="h-7 w-auto sm:h-8" />
      </div>

      {/* ---------- Menu desktop (lg ke atas) ---------- */}
      <ul className="hidden items-center gap-8 lg:flex xl:gap-12">
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
          <li
            className="relative"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setAdminOpen(true);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setAdminOpen(false);
            }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={adminOpen}
              onClick={() => setAdminOpen((v) => !v)}
              className={`flex items-center gap-1 transition-colors hover:opacity-80 focus-visible:outline-none ${
                adminAktif ? "font-bold" : "font-normal"
              }`}
            >
              Admin
              <Chevron open={adminOpen} />
            </button>

            {/* pt-3 menjembatani jarak supaya dropdown tidak menutup saat kursor turun */}
            <div
              className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition duration-150 ${
                adminOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
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
                    tabIndex={adminOpen ? 0 : -1}
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

      {/* ---------- Kanan: avatar + hamburger ---------- */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div ref={wrapRef} className="relative">
          {renderAvatar()}

          {open && user && (
            <div
              role="menu"
              aria-label="Menu akun"
              className="absolute right-0 top-full mt-3 w-60 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl ring-1 ring-black/5"
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-red-900">{displayName}</p>
                {name && <p className="truncate text-xs text-gray-500">{user.email}</p>}
              </div>

              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm hover:bg-red-50 focus:bg-red-50 focus:outline-none"
              >
                Buka profil
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={signingOut}
                className="block w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 focus:bg-red-50 focus:outline-none disabled:opacity-60"
              >
                {signingOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setMobileOpen((v) => !v);
            setOpen(false);
          }}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 lg:hidden"
        >
          <MenuIcon open={mobileOpen} />
        </button>
      </div>

      {/* ---------- Panel mobile ---------- */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full mt-2 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-xl bg-white py-2 text-gray-800 shadow-xl ring-1 ring-black/5 lg:hidden"
        >
          <ul>
            {visibleMenus.map((menu) => (
              <li key={menu.href}>
                <NavLink
                  to={menu.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center px-5 py-2.5 text-base hover:bg-red-50 focus:bg-red-50 focus:outline-none ${
                      isActive ? "font-bold text-red-900" : ""
                    }`
                  }
                >
                  {menu.label}
                </NavLink>
              </li>
            ))}

            {isAdmin && (
              <li>
                <button
                  type="button"
                  onClick={() => setMobileAdminOpen((v) => !v)}
                  aria-expanded={mobileAdminOpen}
                  className={`flex min-h-11 w-full items-center justify-between px-5 py-2.5 text-left text-base hover:bg-red-50 focus:bg-red-50 focus:outline-none ${
                    adminAktif ? "font-bold text-red-900" : ""
                  }`}
                >
                  Admin
                  <Chevron open={mobileAdminOpen} />
                </button>

                {mobileAdminOpen && (
                  <ul className="bg-gray-50">
                    {adminMenus.map((m) => (
                      <li key={m.href}>
                        <NavLink
                          to={m.href}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex min-h-11 items-center py-2.5 pl-9 pr-5 text-sm hover:bg-red-50 focus:bg-red-50 focus:outline-none ${
                              isActive ? "font-bold text-red-900" : ""
                            }`
                          }
                        >
                          {m.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}