import Tabel from "./tabel.tsx";
import type { BarisLogbookRekap } from "../../lib/supabaseRekapitulasi";

type Props = {
  bulan: string | null;
  pusatRiset: string | null;
  data: BarisLogbookRekap[];
};

export default function PRIS(props: Props) {
  return <Tabel menu="PRIS" {...props} />;
}