import Dropdown from "./Dropdown.tsx";
import { bulanOpsi } from "../../config/Datacontoh.ts";

export default function DropdownBulan({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  return <Dropdown label="Pilih Bulan" options={bulanOpsi} value={value} onChange={onChange} />;
}