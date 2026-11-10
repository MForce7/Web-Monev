import type { ReactNode } from "react";
import { GRAD } from "./konstanta";

export default function TombolGradasi({
  children,
  onClick,
  disabled,
  besar,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  besar?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ background: GRAD }}
      className={`flex shrink-0 items-center gap-2 rounded-full font-bold text-white shadow-[0_2px_8px_rgba(27,63,120,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 ${
        besar ? "px-6 py-2.5 text-[13px]" : "px-4 py-2 text-xs"
      }`}
    >
      {children}
    </button>
  );
}
