import type { ReactNode } from "react";

export function Field({
  label,
  id,
  wajib,
  galat,
  hint,
  children,
}: {
  label: string;
  id?: string;
  wajib?: boolean;
  galat?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[13px] font-bold">
        {label}
        {wajib && <span className="text-[#991b1b]"> *</span>}
      </label>
      {children}
      {galat ? (
        <p role="alert" className="mt-1 text-xs font-semibold text-[#991b1b]">
          {galat}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}