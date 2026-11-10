import Kosong from "./Kosong";
import type { Tautan } from "./tipe";

export default function DaftarLink({ links }: { links: Tautan[] }) {
  if (links.length === 0) return <Kosong />;
  return (
    <ul className="space-y-1">
      {links.map((l) => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noreferrer" className="text-[#2a5aa8] hover:underline">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
