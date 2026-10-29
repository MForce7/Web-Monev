import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import logoBrin from "../assets/dashboardLogo.svg";
import bgLeftPattern from "../assets/login_page_background3.svg";
import buildingPicture from "../assets/brin_login_picture.png";

/* ---------- aset ---------- */
const ASSETS = {
  bgLeft: bgLeftPattern,
  logo: logoBrin,
  building: buildingPicture,
};

/* ---------- style yang dipakai berulang ---------- */
const inputClass =
  "w-full rounded-full border border-gray-400 bg-gray-50/50 px-5 py-3 text-gray-800 transition duration-200 focus:border-transparent focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-600";
const linkClass =
  "font-medium text-indigo-600 transition duration-150 hover:text-indigo-800";

/* ---------- pembungkus animasi ---------- */
// index = urutan (stagger), delay = jeda awal dalam ms
function Item({
  index,
  delay = 0,
  className = "login-item",
  children,
}: {
  index: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      style={{ "--i": index, "--d": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ---------- ikon ---------- */
function ArrowLeftIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path fillRule="evenodd" clipRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
      />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      {off ? (
        <>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
          />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        </>
      ) : (
        <>
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </>
      )}
    </svg>
  );
}

/* ---------- komponen kecil ---------- */
function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white">
      {children}
    </span>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  icon: ReactNode;
  /** elemen tambahan di ujung kanan (mis. tombol mata) */
  action?: ReactNode;
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  icon,
  action,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative rounded-full shadow-sm">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`${inputClass} ${action ? "pr-24" : "pr-14"}`}
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          <span className="pointer-events-none">
            <IconBadge>{icon}</IconBadge>
          </span>
          {action}
        </div>
      </div>
    </div>
  );
}

/* ---------- halaman utama ---------- */
export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: panggil API login di sini, lalu navigate("/dashboard") kalau berhasil
    console.log({ username, password, rememberMe });
  };

  // jeda awal untuk isi panel kanan, supaya muncul setelah panel meluncur masuk
  const FORM_DELAY = 450;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-slate-100 to-slate-300 p-4 sm:p-6 lg:p-8">
      {/* bola cahaya melayang di belakang card */}
      <div
        aria-hidden
        className="login-float pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-red-300/40 blur-3xl"
      />
      <div
        aria-hidden
        className="login-float pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-rose-400/30 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />

      {/* CARD: background SVG membentang sampai sisi kanan */}
      <div
        className="login-card relative z-10 flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#8b0000] bg-cover bg-top bg-no-repeat shadow-2xl md:flex-row"
        style={{ backgroundImage: `url('${ASSETS.bgLeft}')` }}
      >
        {/* ============ KIRI: hanya teks (tanpa panel) ============ */}
        <div className="relative z-10 flex flex-1 flex-col p-8 text-white sm:p-12 md:basis-1/2">
          <img
            src={ASSETS.logo}
            alt="Logo BRIN"
            className="login-left absolute left-0 top-0 z-20 h-100 w-auto object-contain sm:h-auto"
            style={{ "--i": 0, "--d": "200ms" } as CSSProperties}
          />

          <div className="my-auto py-12">
            <Item index={0} delay={400} className="login-left">
              <h1 className="mb-4 text-3xl font-extrabold uppercase leading-tight tracking-wide sm:text-4xl lg:text-5xl">
                Monitoring &amp;
                <br />
                Evaluasi
              </h1>
            </Item>
            <Item index={1} delay={400} className="login-left">
              <p className="text-lg font-light text-red-100 sm:text-xl">
                Sistem Pemantauan Capaian Output
              </p>
            </Item>
          </div>
        </div>

        {/* ============ KANAN: panel putih, ujung kiri rounded ============ */}
        <section className="login-panel relative z-10 flex flex-1 flex-col justify-between overflow-hidden rounded-t-[40px] bg-white p-8 sm:p-12 md:basis-1/2 md:rounded-l-[60px] md:rounded-tr-none">
          {/* watermark gedung */}
          <div
            className="login-watermark pointer-events-none absolute bottom-0 right-0 h-1/2 w-full bg-contain bg-bottom bg-no-repeat opacity-20"
            style={{ backgroundImage: `url('${ASSETS.building}')` }}
          />

          <Item index={0} delay={FORM_DELAY} className="login-item relative z-10 mb-6 flex justify-start">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition duration-200 hover:-translate-x-1 hover:bg-red-700 active:scale-90"
            >
              <ArrowLeftIcon />
            </button>
          </Item>

          <Item index={1} delay={FORM_DELAY} className="login-item relative z-10 mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-[#8b0000] sm:text-3xl">
              Selamat Datang Kembali
            </h2>
            <p className="text-sm text-gray-600 sm:text-base">
              Silakan masuk ke Dashboard MONEV Anda.
            </p>
          </Item>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            <Item index={2} delay={FORM_DELAY}>
              <Field
                id="username"
                label="Email/Username"
                placeholder="Masukkan Email/Username"
                value={username}
                onChange={setUsername}
                autoComplete="username"
                icon={<UserIcon />}
              />
            </Item>

            <Item index={3} delay={FORM_DELAY}>
              <Field
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                icon={<LockIcon />}
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="text-[#8b0000] transition duration-150 hover:scale-110 hover:text-red-700 focus:outline-none active:scale-90"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                }
              />
            </Item>

            <Item index={4} delay={FORM_DELAY}>
              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  Ingat saya
                </label>
                <a href="#forgot-password" className={linkClass}>
                  Lupa kata sandi?
                </a>
              </div>
            </Item>

            <Item index={5} delay={FORM_DELAY}>
              <button
                type="submit"
                className="group relative w-full overflow-hidden rounded-full bg-blue-500 px-6 py-3 text-lg font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-xl active:translate-y-0 active:scale-95"
              >
                {/* kilau yang menyapu tombol saat hover */}
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <span className="relative">Masuk</span>
              </button>
            </Item>
          </form>

          <Item index={6} delay={FORM_DELAY} className="login-item relative z-10 my-6 flex items-center gap-4 text-sm text-gray-700">
            <span className="h-px flex-1 bg-gray-400" />
            atau
            <span className="h-px flex-1 bg-gray-400" />
          </Item>

          <Item index={7} delay={FORM_DELAY} className="login-item relative z-10 text-center text-sm text-gray-700">
            Mengalami kendala saat masuk?{" "}
            <a href="#contact-admin" className={linkClass}>
              Hubungi admin.
            </a>
          </Item>
        </section>
      </div>
    </div>
  );
}