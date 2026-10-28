import { gradBg } from "./chartutils";

export type Kategori = {
  key: string;
  label: string;
  from: string; // warna awal gradient
  to: string;   // warna akhir gradient
};

export default function Legend({
  items,
  size = "md",
}: {
  items: Kategori[];
  size?: "sm" | "md";
}) {
  const small = size === "sm";

  return (
    <ul
      className={`mt-3 flex flex-wrap justify-center font-semibold text-gray-700 ${
        small ? "gap-x-3 gap-y-0.5 text-[10px]" : "gap-x-4 gap-y-1 text-xs"
      }`}
    >
      {items.map((i) => (
        <li key={i.key} className="flex items-center gap-1.5">
          <span
            className={`rounded-full ${small ? "h-2.5 w-2.5" : "h-3 w-3"}`}
            style={{ background: gradBg(i) }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}