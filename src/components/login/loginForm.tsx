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
  onSubmit: (values: LoginValues) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ username, password, rememberMe });
  };

  return (
    <>
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
    </>
  );
}