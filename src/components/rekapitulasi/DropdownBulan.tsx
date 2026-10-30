import Dropdown from "./Dropdown.tsx";
import { bulanOpsi } from "../../config/Datacontoh.ts";

const TRIWULAN = ["Triwulan 1", "Triwulan 2", "Triwulan 3", "Triwulan 4"];
const SEMESTER = ["Semester 1", "Semester 2"];

// Urutan di daftar: triwulan, lalu semester, lalu bulan (Januari dst.)
const opsi = [...TRIWULAN, ...SEMESTER, ...bulanOpsi];

export default function DropdownBulan({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  return <Dropdown label="Pilih Bulan" options={opsi} value={value} onChange={onChange} />;
}