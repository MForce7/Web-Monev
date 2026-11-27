import Dropdown from "./Dropdown";
import { pusatRisetOpsi } from "../../config/Datacontoh";

export default function DropdownPusatRiset({
  value,
  onChange,
  opsi,
}: {
  value: string | null;
  onChange: (v: string) => void;
  /** Kalau diisi, daftar ini dipakai sebagai pengganti daftar statis pusatRisetOpsi
   *  (mis. dibentuk dari data Supabase yang sedang tampil). */
  opsi?: string[];
}) {
  return <Dropdown label="Pilih Pusat Riset" options={opsi ?? pusatRisetOpsi} value={value} onChange={onChange} />;
}