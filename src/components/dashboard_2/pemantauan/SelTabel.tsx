import { th, td } from "./styles";
import { WARNA_STATUS } from "./tampilanStatus";
import { daftar } from "./types";
import type { StatusPantau } from "./types";

export function FragmentHead() {
  return (
    <>
      <th className={`${th} min-w-[120px] bg-white/10 border-b`}>Status</th>
      <th className={`${th} min-w-[140px] bg-white/10 border-b`}>Belum Sesuai</th>
    </>
  );
}

export function FragmentSel({
  ada,
  status,
  belum,
}: {
  ada: boolean;
  status?: StatusPantau;
  belum?: string[] | string | number;
}) {
  const item = daftar(belum);
  return (
    <>
      <td className={td}>
        {ada &&
          (status ? (
            <span
              className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${WARNA_STATUS[status]}`}
            >
              {status}
            </span>
          ) : (
            <span className="text-slate-400">–</span>
          ))}
      </td>
      <td className={`${td} text-left text-[11px]`}>
        {item.length > 0 && (
          <ul className="space-y-0.5">
            {item.map((x) => (
              <li key={x} className="flex gap-1.5">
                <span aria-hidden className="text-[#2a5aa8]">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        )}
      </td>
    </>
  );
}