import { GRAD_BAR } from "../../config/Warna";

export default function InstansiBar() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-2 px-4 py-2.5 text-xs text-white shadow-[0_4px_10px_rgba(0,0,0,0.12)] sm:px-6 sm:py-3 sm:text-sm"
      className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-white shadow-[0_4px_10px_rgba(0,0,0,0.12)] flex flex-wrap items-center gap-x-2"
      style={{ background: GRAD_BAR }}
    >
      <span className="font-extrabold">ORPA</span>
      <span className="font-light">|</span>
      <span className="min-w-0 font-semibold">Badan Riset dan Inovasi Nasional</span>
      <span className="font-semibold">Badan Riset dan Inovasi Nasional</span>
    </div>
  );
}