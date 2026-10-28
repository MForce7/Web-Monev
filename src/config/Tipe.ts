export type Lampiran = { label: string; url: string };

export type BarisOutput = {
  id: number;
  jenis: string;
  judul: string;
  status: string;
  progres: number;
  dataDukung: Lampiran[];
};