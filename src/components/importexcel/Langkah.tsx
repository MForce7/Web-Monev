export default function Langkah({ n, label, aktif, selesai }: { n: number; label: string; aktif: boolean; selesai: boolean }) {
  const nyala = aktif || selesai;
  return (
    <span className={`flex items-center gap-2 ${nyala ? "text-[#1b3560]" : "text-slate-600"}`}>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          nyala ? "bg-[#1f4e8c] text-white" : "bg-[#dbe6f7] text-[#1b3560]"
        }`}
      >
        {selesai ? "✓" : n}
      </span>
      {label}
    </span>
  );
}
