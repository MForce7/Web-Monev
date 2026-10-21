import { useState, type FormEvent } from "react";

// Gambar diambil dari src/assets. Nama file sesuai yang ada di folder (tidak perlu rename).
import logoBrin from "../assets/Alt_Logo_BRIN 3.png";
import logoMonev from "../assets/bx_network-chart.png";
import gedungBrin from "../assets/image 3.png";
import polaSegitiga from "../assets/6173911 1.png";



type LoginPageProps = {
  onSubmit?: (data: { identifier: string; password: string; remember: boolean }) => void | Promise<void>;
  forgotPasswordHref?: string;
  contactAdminHref?: string;
};

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
  </svg>
);

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" strokeLinecap="round" />}
  </svg>
);

const HelpIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" strokeLinecap="round" />
  </svg>
);

export default function LoginPage({
  onSubmit,
  forgotPasswordHref = "/lupa-kata-sandi",
  contactAdminHref = "/hubungi-admin",
}: LoginPageProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit?.({ identifier, password, remember });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Panel kiri */}
      <section
        className="relative flex flex-1 flex-col bg-[#7a0c10] bg-cover px-8 py-8 md:basis-[52%] md:px-14 md:py-12"
        style={{ backgroundImage: `url(${polaSegitiga})` }}
      >
        <img src={logoBrin} alt="BRIN - Badan Riset dan Inovasi Nasional" className="h-12 w-auto self-start" />

        <div className="mt-10 md:mt-16">
          <h1 className="text-4xl font-extrabold uppercase leading-tight text-white md:text-5xl">
            Monitoring &amp;
            <br />
            Evaluasi
          </h1>
          <p className="mt-6 max-w-sm text-2xl font-medium leading-snug text-[#ff2a2a] md:text-3xl">
            Sistem Pemantauan Capaian Output
          </p>
        </div>
      </section>

      {/* Panel kanan */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#c9c9cd] px-6 py-10 md:basis-[48%]">
        <div
          className="absolute inset-0 bg-cover bg-bottom opacity-40"
          style={{ backgroundImage: `url(${gedungBrin})` }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-sm">
          <div className="flex flex-col items-center text-center">
            <img src={logoMonev} alt="" className="h-20 w-auto" />
            <h2 className="mt-3 text-3xl font-bold text-black">Selamat Datang</h2>
            <p className="text-sm text-black">Masuk ke Sistem MONEV</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1 block text-sm font-bold text-black">
                Email/Username
              </label>
              <div className="flex items-center gap-2 rounded-full bg-[#e6e6e8] px-3 py-2 text-[#e11d2e] focus-within:ring-2 focus-within:ring-[#4a9dff]">
                <UserIcon />
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-transparent text-black outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-bold text-black">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-full bg-[#e6e6e8] px-3 py-2 text-[#e11d2e] focus-within:ring-2 focus-within:ring-[#4a9dff]">
                <LockIcon />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-black outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="rounded-full p-1"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-black">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-[#4a9dff]"
                />
                Ingat saya
              </label>
              <a href={forgotPasswordHref} className="text-[#5b21d6] hover:underline">
                Lupa kata sandi?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#4a9dff] py-2 text-sm font-bold text-black transition hover:bg-[#3a8bf0] disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-sm text-black">
            <span className="h-px flex-1 bg-black" />
            atau
            <span className="h-px flex-1 bg-black" />
          </div>

          <p className="flex items-center gap-2 text-sm text-black">
            <span className="text-[#e11d2e]">
              <HelpIcon />
            </span>
            <span>
              Mengalami kendala saat masuk?{" "}
              <a href={contactAdminHref} className="text-[#5b21d6] hover:underline">
                Hubungi admin.
              </a>
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}