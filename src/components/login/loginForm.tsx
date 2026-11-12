import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Field from "./field";
import Item from "./item";
import { ArrowLeftIcon, EyeIcon, LockIcon, UserIcon } from "./icons";
import { FORM_DELAY, linkClass } from "./constants";

export interface LoginValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSubmit: (values: LoginValues) => void | Promise<void>;
  busy?: boolean;
  error?: string;
}

export default function LoginForm({ onSubmit, busy = false, error = "" }: LoginFormProps) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    onSubmit({ username, password, rememberMe });
  };

  return (
    <>
      <Item index={0} delay={FORM_DELAY} className="login-item relative z-10 mb-5 flex justify-start sm:mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition duration-200 hover:-translate-x-1 hover:bg-red-700 active:scale-90 motion-reduce:transition-none motion-reduce:hover:translate-x-0"
        >
          <ArrowLeftIcon />
        </button>
      </Item>

      <Item index={1} delay={FORM_DELAY} className="login-item relative z-10 mb-6 text-center sm:mb-8">
        <h2 className="mb-2 text-balance text-2xl font-bold text-[#8b0000] sm:text-3xl">
          Selamat Datang Kembali
        </h2>
        <p className="text-sm text-gray-600 sm:text-base">
          Silakan masuk ke Dashboard MONEV Anda.
        </p>
      </Item>

      {/* [&_input]:text-base = teks isian minimal 16px, supaya iPhone tidak memperbesar halaman saat kolom diketuk */}
      <form onSubmit={handleSubmit} className="relative z-10 space-y-4 sm:space-y-5 [&_input]:text-base">
        <Item index={2} delay={FORM_DELAY}>
          <Field
            id="username"
            label="Email"
            type="email"
            placeholder="Masukkan email aktif"
            value={username}
            onChange={setUsername}
            autoComplete="email"
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
                aria-pressed={showPassword}
                className="-m-1 p-2 text-[#8b0000] transition duration-150 hover:scale-110 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-90 motion-reduce:transition-none"
              >
                <EyeIcon off={showPassword} />
              </button>
            }
          />
        </Item>

        <Item index={4} delay={FORM_DELAY}>
          {/* flex-wrap: di layar sempit, "Lupa kata sandi?" turun ke baris bawah, tidak berdesakan */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-1 text-sm">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Ingat saya
            </label>
            <a href="#forgot-password" className={`${linkClass} inline-flex min-h-11 items-center`}>
              Lupa kata sandi?
            </a>
          </div>
        </Item>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <Item index={5} delay={FORM_DELAY}>
          <button
            type="submit"
            disabled={busy}
            className="group relative min-h-12 w-full overflow-hidden rounded-full bg-blue-500 px-6 py-3 text-lg font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-xl active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <span aria-hidden className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden" />
            <span className="relative">{busy ? "Memproses..." : "Masuk"}</span>
          </button>
        </Item>
      </form>

      <Item index={6} delay={FORM_DELAY} className="login-item relative z-10 my-5 flex items-center gap-4 text-sm text-gray-700 sm:my-6">
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
    </>
  );
}