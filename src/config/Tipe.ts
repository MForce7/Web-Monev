export type Tautan = { label: string; url: string };

/* Satu baris di Rekap Output (Purwarupa, Model, Publikasi, KI, Paten, Hak Cipta) */
export type BarisOutput = {
  ketua: string;
  judul: string;
  status: string;
  progres: number;
  dataDukung: Tautan[];
};

/* Satu baris di Rekap Logbook (CFC, RIIM, PRIS) */
export type BarisLogbook = {
  bulan: string;
  ketua: string;
  aktivitas: {
    uraian: string;
    kendala: string;
    mitigasi: string;
    dataDukung: Tautan[];
  };
  output: {
    jenis: string;
    judul: string;
    status: string;
    progres: number;
    dataDukung: Tautan[];
  };
};