import { Link } from "react-router-dom";
import { GRAD } from "./konstanta";

export default function Sidebar() {
  return (
    <aside className="hidden w-[264px] shrink-0 flex-col gap-4 px-[18px] py-8 lg:flex">
      <Link
        to="/logbook"
        style={{ background: GRAD }}
        className="flex h-[54px] items-center rounded-full px-[22px] text-lg font-bold text-white shadow-[0_4px_10px_rgba(27,63,120,0.3)]"
      >
        Logbook Saya
      </Link>
      <div className="overflow-hidden rounded-[27px] bg-[#eaf0fa] shadow-[0_4px_10px_rgba(27,63,120,0.25)]">
        <div style={{ background: GRAD }} className="flex h-[54px] items-center px-[22px] text-lg font-bold text-white">
          Import Excel
        </div>
        <div className="py-3.5 text-center text-[17px] font-bold">Unggah File</div>
      </div>
    </aside>
  );
}
