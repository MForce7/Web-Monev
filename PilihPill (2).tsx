import type { ReactNode } from "react";

export default function PilihPill({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative block w-full sm:w-[260px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full appearance-none truncate rounded-full bg-white pl-6 pr-14 text-base font-bold text-[#111] shadow-[0_4px_12px_rgba(0,0,0,0.14)] outline-none focus-visible:ring-2 focus-visible:ring-[#2a5aa8]"
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full bg-[#1f4e8c]"
      >
        <svg viewBox="0 0 26 26" className="h-[26px] w-[26px]" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 11l5 5 5-5" />
        </svg>
      </span>
    </label>
  );
}
