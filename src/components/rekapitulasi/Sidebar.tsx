import { GRAD_ACTIVE } from "../../config/Warna.ts";
import { sidebarMenu, sidebarOutput, sidebarPemantauan } from "../../config/Datacontoh.ts";

function Grup({ judul, menu, active, onChange }: {
  judul: string;
  menu: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <p className="px-3 pb-3 text-sm font-bold text-gray-600">{judul}</p>
      <ul className="mb-8 space-y-2">
        {menu.map((m) => {
          const aktif = active === m;
          return (
            <li key={m}>
              <button
                type="button"
                onClick={() => onChange(m)}
                aria-current={aktif ? "page" : undefined}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                  aktif ? "text-white shadow-[0_4px_10px_rgba(242,42,58,0.35)]" : "text-gray-500 hover:bg-gray-100"
                }`}
                style={aktif ? { background: GRAD_ACTIVE } : undefined}
              >
                {m}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function Sidebar({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <aside className="relative z-10 w-36 shrink-0 bg-white px-3 py-5 shadow-[4px_0_10px_rgba(0,0,0,0.12)] md:w-40">
      <Grup judul="Rekap Logbook" menu={sidebarMenu} active={active} onChange={onChange} />
      <Grup judul="Rekap Output" menu={sidebarOutput} active={active} onChange={onChange} />
      <Grup judul="Pemantauan" menu={sidebarPemantauan} active={active} onChange={onChange} />
    </aside>
  );
}