import { GRAD_BAR } from "../../config/Warna";

export default function InstansiBar() {
  return (
    <div className="px-6 py-3 text-sm text-white shadow-[0_4px_10px_rgba(0,0,0,0.12)]" style={{ background: GRAD_BAR }}>
      <span className="font-extrabold">ORPA</span>
      <span className="mx-2 font-light">|</span>
      <span className="font-semibold">Badan Riset dan Inovasi Nasional</span>
    </div>
  );
}