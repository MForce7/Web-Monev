import { useState, type ReactNode } from "react";
import logoBrin from "../assets/Alt_Logo_BRIN 4.png";

/* ---------- Warna (perkiraan dari Figma, ganti kalau perlu) ---------- */
const RED = "#e8202f";
const GRAD_BAR = "linear-gradient(90deg, #f22a3a 0%, #ff5a68 100%)"; // pita "ORPA | BRIN"
const GRAD_CARD = "linear-gradient(90deg, #f22a3a 0%, #ff8a93 100%)"; // header kartu "JUDUL"
const GRAD_ACTIVE = "linear-gradient(90deg, #f22a3a 0%, #ff4d5b 100%)"; // menu sidebar aktif

/* ---------- Data contoh (nanti ganti dengan data dari API) ---------- */
const navLinks = [
  { label: "Dashboard", href: "#", active: true },
  { label: "Login", href: "#", active: false },
  { label: "Logbook", href: "#", active: false },
];

const sidebarMenu = ["CFC", "RIIM", "PRIS"];

type Kolom = { key: string; label: string; className?: string };

// Kosongkan `columns` dan `rows` untuk menampilkan baris kosong seperti di desain
const columns: Kolom[] = [];
const rows: Record<string, ReactNode>[] = [];
const JUMLAH_BARIS_KOSONG = 7;

/* ---------- Komponen kecil ---------- */
function Logo() {
  // Ukuran asli dari Figma: 83 x 32
  return <img src={logoBrin} alt="BRIN" width={83} height={32} className="h-8 w-auto" />;
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={RED} />
      <circle cx="12" cy="9.5" r="3.6" fill="#fff" />
      <path d="M4.8 19.2c1.4-3 4-4.4 7.2-4.4s5.8 1.4 7.2 4.4A10 10 0 0 1 12 22a10 10 0 0 1-7.2-2.8z" fill="#fff" />
    </svg>
  );
}

function Navbar() {
  return (
    <header className="relative z-20 flex h-14 items-center justify-between bg-white px-6 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
      <Logo />
      <nav aria-label="Navigasi utama" className="absolute left-1/2 flex -translate-x-1/2 gap-8">
        {navLinks.map((l) => (
          <a
            key={l.label}
            href={l.href}
            aria-current={l.active ? "page" : undefined}
            className={`text-sm font-bold transition hover:text-[#e8202f] ${
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

function Sidebar({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <aside className="relative z-10 w-36 shrink-0 bg-white px-3 py-5 shadow-[4px_0_10px_rgba(0,0,0,0.12)] md:w-40">
      <p className="px-3 pb-4 text-sm font-bold text-gray-500">Rekap Logbook</p>
      <ul className="space-y-2">
        {sidebarMenu.map((m) => {
          const aktif = active === m;
          return (
            <li key={m}>
              <button
                type="button"
                onClick={() => onChange(m)}
                aria-current={aktif ? "page" : undefined}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                  aktif ? "text-white shadow-[0_4px_10px_rgba(242,42,58,0.35)]" : "text-gray-500 hover:bg-gray-100"
                }`}
                style={aktif ? { background: GRAD_ACTIVE } : undefined}
              >
                {m}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function InstansiBar() {
  return (
    <div className="px-6 py-3 text-sm text-white shadow-[0_4px_10px_rgba(0,0,0,0.12)]" style={{ background: GRAD_BAR }}>
      <span className="font-extrabold">ORPA</span>
      <span className="mx-2 font-light">|</span>
      <span className="font-semibold">Badan Riset dan Inovasi Nasional</span>
    </div>
  );
}

function DataCard({ title }: { title: string }) {
  const kosong = rows.length === 0;
  const grid = { gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))` };

  return (
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
      <h3 className="px-5 py-3 text-sm font-bold uppercase text-white" style={{ background: GRAD_CARD }}>
        {title}
      </h3>

      {/* Header kolom (hanya tampil kalau columns diisi) */}
      {columns.length > 0 && (
        <div className="grid border-b border-gray-300 px-5 py-2 text-xs font-bold text-gray-600" style={grid}>
          {columns.map((c) => (
            <span key={c.key} className={c.className}>{c.label}</span>
          ))}
        </div>
      )}

      <ul>
        {kosong
          ? Array.from({ length: JUMLAH_BARIS_KOSONG }).map((_, i) => (
              <li key={i} className="h-[47px] border-b border-gray-300 last:border-b-0" />
            ))
          : rows.map((row, i) => (
              <li
                key={i}
                className="grid min-h-[47px] items-center border-b border-gray-300 px-5 py-2 text-sm text-gray-800 last:border-b-0"
                style={grid}
              >
                {columns.map((c) => (
                  <span key={c.key} className={c.className}>{row[c.key]}</span>
                ))}
              </li>
            ))}
      </ul>
    </section>
  );
}

/* ---------- Halaman ---------- */
export default function DataPage() {
  const [menu, setMenu] = useState("CFC");

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f4f4f4]" translate="no">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar active={menu} onChange={setMenu} />
        <main className="flex-1">
          <InstansiBar />
          <div className="p-6 md:p-8">
            {/* TODO: ganti judul & isi kartu sesuai menu yang dipilih (CFC / RIIM / PRIS) */}
            <DataCard title="Judul" />
          </div>
        </main>
      </div>
    </div>
  );
}