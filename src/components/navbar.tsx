import { useEffect, useState } from "react";
import logoBrin from "../assets/logo_brin.svg";
import userPhoto from "../assets/hero.png";

const menus = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Login", href: "/login" },
  { label: "Logbook", href: "/logbook" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);

    handleScroll(); // cek posisi saat pertama load (misal refresh di tengah halaman)
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        {menus.map((menu) => {
          const isActive = window.location.pathname === menu.href;

          return (
            <li key={menu.href}>
              <a
                href={menu.href}
                className={`transition-colors hover:opacity-80 ${
                  isActive ? "font-bold" : "font-normal"
                }`}
              >
                {menu.label}
              </a>
            </li>
          );
        })}
      </ul>

      <div>
        <img
          src={userPhoto}
          alt="Foto user"
          className="h-8 w-8 rounded-full object-cover"
        />
      </div>
    </nav>
  );
}