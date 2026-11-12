import type { ReactNode } from "react";

export default function LoginBackground({ children }: { children: ReactNode }) {
  return (
    // min-h-dvh: tinggi layar yang benar di HP (bilah alamat browser naik-turun), lalu min-h-screen sebagai cadangan.
    // py-6 di HP: card tidak menempel ke tepi atas/bawah saat layar pendek (mis. HP dimiringkan).
    <div className="relative flex min-h-screen min-h-dvh items-center justify-center overflow-x-hidden bg-linear-to-b from-slate-100 to-slate-300 px-3 py-6 sm:p-6 lg:p-8">
      {/* bola cahaya melayang di belakang card (lebih kecil di HP) */}
      <div
        aria-hidden
        className="login-float pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-red-300/40 blur-3xl sm:-left-24 sm:-top-24 sm:h-96 sm:w-96"
      />
      <div
        aria-hidden
        className="login-float pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-rose-400/30 blur-3xl sm:-bottom-32 sm:-right-24 sm:h-[28rem] sm:w-[28rem]"
        style={{ animationDelay: "-6s" }}
      />

      {children}
    </div>
  );
}