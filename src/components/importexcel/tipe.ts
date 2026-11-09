export type Tautan = { label: string; url: string };
export type Validasi = "Siap" | "Cek" | "Kosong";

export type Isian = {
  id: number;
  pusat: string; // mis. "PUSAT RISET ANTARIKSA"
  kode: string; // mis. "PRA"
  no: string;
  ketua: string;
  judulAktivitas: string;
  target: string;
  statusPelaksanaan: string;
  persenPelaksanaan: string;
  uraian: string;
  kendala: string;
  mitigasi: string;
  dataDukungAktivitas: Tautan[];
  jenisOutput: string;
  judulOutput: string;
  statusOutput: string;
  progresOutput: number | null;
  dataDukungOutput: Tautan[];
  validasi: Validasi;
  belumSesuai: string[];
};

export type HasilBaca = {
  sheet: string; // sheet bulan yang sedang aktif
  bulanDefault: string; // bulan terakhir yang sudah ada isiannya
  bulanAda: string[]; // bulan yang terdeteksi di file
  perBulan: Record<string, Isian[]>;
};

export type Kolom =
  | "no" | "ketua" | "judulAktivitas" | "target" | "statusPelaksanaan" | "persenPelaksanaan"
  | "uraian" | "kendala" | "mitigasi" | "dataDukungAktivitas"
  | "jenisOutput" | "judulOutput" | "statusOutput" | "progresOutput" | "dataDukungOutput";