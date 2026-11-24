import type { ReactNode } from "react";

export function Seksi({ n, judul, children }: { n: number; judul: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#dbe6f7] px-4 py-4 last:border-b-0 sm:px-6 sm:py-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f4e8c] text-xs text-white">
          {n}
        </span>
        {judul}
      </h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}