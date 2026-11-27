import type { CSSProperties } from "react";

export function TombolPanah({
  arah,
  onClick,
  style,
}: {
  arah: "kiri" | "kanan";
  onClick: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arah === "kanan" ? "Geser ke kanan" : "Geser ke kiri"}
      style={style}
      className={`absolute top-9 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-bold text-[#2a5aa8] shadow-[0_2px_8px_rgba(27,63,120,0.3)] transition hover:bg-[#eaf0fa] ${
        arah === "kanan" ? "right-2" : ""
      }`}
    >
      {arah === "kanan" ? "›" : "‹"}
    </button>
  );
}