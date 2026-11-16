export type Periset = {
  nama: string;
  nip: string;
  keterangan: string;
  jabatan: string;
};

export type Kelompok = {
  nama: string;
  anggota: Periset[];
};

export type PusatRiset = {
  nama: string;
  kelompok: Kelompok[];
};

export type PerisetTampil = Periset & {
  no: number;
  ai: number;
};

export type KelompokTampil = {
  nama: string;
  no: number;
  ki: number;
  anggota: PerisetTampil[];
};

export type PusatTampil = {
  nama: string;
  pi: number;
  kelompok: KelompokTampil[];
};

export type TujuanPindah = {
  pi: number;
  ki: number;
};

export type OpsiKelompok = {
  value: string;
  label: string;
};