import Dropdown from "./Dropdown";
import { pusatRisetOpsi } from "../../config/Datacontoh";

export default function DropdownPusatRiset({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  return <Dropdown label="Pilih Pusat Riset" options={pusatRisetOpsi} value={value} onChange={onChange} />;
}