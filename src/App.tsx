import { Outlet, NavLink, useLocation } from "react-router-dom";
import logoBrin from "./assets/Alt_Logo_BRIN 3.png";
import gedungBrin from "./assets/gedung-landing.jpg";
import polaFooter from "./assets/Group.png";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/login", label: "Login" },
  { to: "/logbook", label: "Logbook" },
];

const pill = "rounded-full px-4 py-1 text-xs font-bold text-white transition hover:bg-[#c41a28] sm:text-sm";

function Navbar() {
  return (
    <nav translate="no" className="mx-auto grid max-w-6xl grid-cols-1 items-center justify-items-center gap-4 px-4 py-4 md:grid-cols-[1fr_auto_1fr]">
      <NavLink to="/" aria-label="Ke halaman utama" className="md:justify-self-start">
        <img src={logoBrin} alt="BRIN - Badan Riset dan Inovasi Nasional" className="h-12 w-auto" />
      </NavLink>

      <ul className="flex flex-wrap items-center justify-center gap-2">
        {links.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) => `${pill} ${isActive ? "bg-[#a8151f]" : "bg-[#e8202f]"}`}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Kolom kosong supaya tombol tepat di tengah */}
      <div className="hidden md:block" />
    </nav>
  );
}

/** Judul besar di bawah navbar, hanya tampil di halaman utama */
function Hero() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-12 text-center text-white md:pb-32 md:pt-16">
      <h1 className="text-2xl font-extrabold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] md:text-4xl">
        Organisasi Riset Penerbangan dan Antariksa
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] md:text-base">
        Pusat informasi perencanaan, penganggaran, dan pemantauan kinerja Organisasi Riset Penerbangan dan Antariksa.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="w-full bg-[#a50d14] bg-cover bg-center px-4 py-10 text-center text-white"
      style={{ backgroundImage: `url(${polaFooter})` }}
    >
      <p className="text-lg font-bold md:text-xl">Organisasi Riset Penerbangan dan Antariksa</p>
      <p className="mt-1 text-base md:text-lg">Badan Riset dan Inovasi Nasional</p>
      <p className="mt-5 text-sm md:text-base">&copy; {new Date().getFullYear()} ORPA – BRIN</p>
    </footer>
  );
}

export default function App() {
  const isHome = useLocation().pathname === "/";

  // Di halaman utama: foto gedung, gelap di atas, makin ke bawah makin putih.
  // Di halaman lain: navbar polos berwarna gelap.
  const headerStyle = isHome
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.5) 45%, rgba(255,255,255,1) 100%), url(${gedungBrin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className={isHome ? "w-full" : "w-full bg-[#222]"} style={headerStyle}>
        <Navbar />
        {isHome && <Hero />}
      </header>

      {/* Outlet = tempat halaman anak (Home, Logbook, Tester, Login, dll) ditampilkan */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}