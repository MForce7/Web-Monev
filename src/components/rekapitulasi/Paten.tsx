import Tabel2 from "./tabel2";
import type { BarisOutputRekap } from "../../lib/supabaseRekapitulasi";

export default function Paten({ data }: { data: BarisOutputRekap[] }) {
  return <Tabel2 jenis="Paten" data={data} />;
}