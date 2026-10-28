import logoBrin from "../assets/Alt_Logo_BRIN 4.png";
import { RED } from "../config/Warna.ts";
import { navLinks } from "../config/Datacontoh.ts";

function Logo() {
  return <img src={logoBrin} alt="BRIN" width={83} height={32} className="h-8 w-auto" />;
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={RED} />
      <circle cx="12" cy="9.5" r="3.6" fill="#fff" />
      <path d="M4.8 19.2c1.4-3 4-4.4 7.2-4.4s5.8 1.4 7.2 4.4A10 10 0 0 1 12 22a10 10 0 0 1-7.2-2.8z" fill="#fff" />
    </svg>
  );
}

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
