import Tabel2 from "./tabel2";
import type { BarisOutputRekap } from "../../lib/supabaseRekapitulasi";

export default function HakCipta({ data }: { data: BarisOutputRekap[] }) {
  return <Tabel2 jenis="Hak Cipta" data={data} />;
}