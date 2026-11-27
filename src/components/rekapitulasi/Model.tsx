import Tabel2 from "./tabel2";
import type { BarisOutputRekap } from "../../lib/supabaseRekapitulasi";

export default function Model({ data }: { data: BarisOutputRekap[] }) {
  return <Tabel2 jenis="Model" data={data} />;
}