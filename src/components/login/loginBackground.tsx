import type { ReactNode } from "react";

export default function LoginBackground({ children }: { children: ReactNode }) {
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

      {children}
    </div>
  );
}