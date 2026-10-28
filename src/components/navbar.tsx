import logoBrin from "../assets/Alt_Logo_BRIN 4.png";
import { RED } from "../config/Warna.ts";
import { navLinks } from "../config/Datacontoh.ts";

const menus = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Dashboard V2", href: "/dashboard-v2" },
  { label: "Login", href: "/login" },
  { label: "Logbook", href: "/logbook" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-20 items-center justify-between bg-white px-6 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
      <Logo />
      <nav aria-label="Navigasi utama" className="absolute left-1/2 flex -translate-x-1/2 gap-8">
        {navLinks.map((l) => (
          <a
            key={l.label}
            href={l.href}
            aria-current={l.active ? "page" : undefined}
            className={`text-base font-bold transition hover:text-[#e8202f] ${
              l.active ? "text-[#a3121c]" : "text-gray-700"
            }`}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <button type="button" aria-label="Akun" className="rounded-full">
        <UserIcon />
      </button>
    </header>
  );
}
