import { useCallback, useEffect, useMemo, useState } from "react";

import {
  SEMUA,
} from "../constants";

import {
  ambilKelompokRiset,
  simpanKelompokRiset,
} from "../services/db";

import type {
  Periset,
  PusatRiset,
  PusatTampil,
  TujuanPindah,
} from "../types";

function cloneData(data: PusatRiset[]): PusatRiset[] {
  return JSON.parse(JSON.stringify(data)) as PusatRiset[];
}

export function useKelompokRiset() {
  const [data, setData] = useState<PusatRiset[]>([]);
  const [draft, setDraft] = useState<PusatRiset[]>([]);
  const [modeEdit, setModeEdit] = useState(false);

  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState<string | null>(null);

  const [menyimpan, setMenyimpan] = useState(false);
  const [errorSimpan, setErrorSimpan] = useState<string | null>(null);

  const [pusat, setPusat] = useState(SEMUA);
  const [cari, setCari] = useState("");

  const activeData = modeEdit ? draft : data;

  const muatData = useCallback(async () => {
    try {
      setMemuat(true);
      setErrorMuat(null);

      const hasil = await ambilKelompokRiset();
      setData(hasil);
    } catch (error) {
      console.error("Gagal memuat data kelompok riset:", error);
      setErrorMuat(
        error instanceof Error ? error.message : "Gagal memuat data.",
      );
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muatData();
  }, [muatData]);

  function mulaiEdit() {
    setDraft(cloneData(data));
    setModeEdit(true);
  }

  function batalEdit() {
    setDraft([]);
    setModeEdit(false);
  }

  async function simpanEdit() {
    try {
      setMenyimpan(true);
      setErrorSimpan(null);

      await simpanKelompokRiset(draft);

      setData(cloneData(draft));
      setDraft([]);
      setModeEdit(false);

      return true;
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      setErrorSimpan(
        error instanceof Error ? error.message : "Data gagal disimpan.",
      );
      return false;
    } finally {
      setMenyimpan(false);
    }
  }

  /* ---------- Kelompok riset ---------- */

  // Menambah kelompok baru (kosong) di sebuah pusat riset.
  function tambahKelompok(pi: number) {
    setCari(""); // kelompok baru belum punya nama, jangan sampai tersaring pencarian
    setDraft((previous) => {
      const next = cloneData(previous);
      const target = next[pi];

      if (!target) return previous;

      target.kelompok.push({ nama: "", anggota: [] });

      return next;
    });
  }

  // Menghapus kelompok beserta seluruh anggotanya (dengan konfirmasi).
  function hapusKelompok(pi: number, ki: number) {
    const kelompok = draft[pi]?.kelompok[ki];

    if (!kelompok) return;

    const jumlah = kelompok.anggota.length;
    const pesan = jumlah
      ? `Hapus kelompok "${kelompok.nama || "Tanpa nama"}" beserta ${jumlah} periset di dalamnya?`
      : `Hapus kelompok "${kelompok.nama || "Tanpa nama"}"?`;

    if (!window.confirm(pesan)) return;

    setDraft((previous) => {
      const next = cloneData(previous);

      if (!next[pi]?.kelompok[ki]) return previous;

      next[pi].kelompok.splice(ki, 1);

      return next;
    });
  }

  function ubahNamaKelompok(pi: number, ki: number, nama: string) {
    setDraft((previous) => {
      const next = cloneData(previous);
      const kelompok = next[pi]?.kelompok[ki];

      if (!kelompok) return previous;

      kelompok.nama = nama;

      return next;
    });
  }

  /* ---------- Periset ---------- */

  // Mengubah properti periset.
  function updatePeriset(
    pi: number,
    ki: number,
    ai: number,
    field: keyof Periset,
    value: string,
  ) {
    setDraft((previous) => {
      const next = cloneData(previous);
      const person = next[pi]?.kelompok[ki]?.anggota[ai];

      if (!person) return previous;

      person[field] = value;

      return next;
    });
  }

  // Menambah periset ke kelompok.
  function tambahPeriset(pi: number, ki: number) {
    setCari(""); // periset baru masih kosong, jangan sampai tersaring pencarian
    setDraft((previous) => {
      const next = cloneData(previous);
      const kelompok = next[pi]?.kelompok[ki];

      if (!kelompok) return previous;

      kelompok.anggota.push({
        nama: "",
        nip: "",
        keterangan:
          kelompok.anggota.length === 0 ? "Koordinator" : "Anggota",
        jabatan: "",
      });

      return next;
    });
  }

  // Menghapus periset.
  function hapusPeriset(pi: number, ki: number, ai: number) {
    const person = draft[pi]?.kelompok[ki]?.anggota[ai];

    if (!person) return;

    const konfirmasi = window.confirm(`Hapus periset "${person.nama || "Tanpa nama"}"?`);

    if (!konfirmasi) return;

    setDraft((previous) => {
      const next = cloneData(previous);
      const kelompok = next[pi]?.kelompok[ki];

      if (!kelompok) return previous;

      const dihapus = kelompok.anggota.splice(ai, 1)[0];

      if (
        dihapus &&
        dihapus.keterangan !== "Anggota" &&
        kelompok.anggota.length > 0
      ) {
        kelompok.anggota[0].keterangan = dihapus.keterangan;
      }

      return next;
    });
  }

  // Mengganti koordinator kelompok.
  function gantiKoordinator(pi: number, ki: number, ai: number) {
    setDraft((previous) => {
      const next = cloneData(previous);
      const kelompok = next[pi]?.kelompok[ki];

      if (!kelompok || !kelompok.anggota[ai]) {
        return previous;
      }

      const anggota = kelompok.anggota;

      const labelKoordinator =
        anggota.find((a) => a.keterangan !== "Anggota")?.keterangan ??
        "Koordinator";

      anggota.forEach((a, index) => {
        a.keterangan = index === ai ? labelKoordinator : "Anggota";
      });

      return next;
    });
  }

  // Memindahkan periset ke kelompok lain.
  function pindahPeriset(
    sourcePi: number,
    sourceKi: number,
    sourceAi: number,
    tujuan: TujuanPindah,
  ) {
    setDraft((previous) => {
      const next = cloneData(previous);

      const source = next[sourcePi]?.kelompok[sourceKi];
      const destination = next[tujuan.pi]?.kelompok[tujuan.ki];

      if (!source || !destination) return previous;

      if (sourcePi === tujuan.pi && sourceKi === tujuan.ki) {
        return previous;
      }

      const person = source.anggota[sourceAi];

      if (!person) return previous;

      const isKoordinator = person.keterangan !== "Anggota";

      const [movedPerson] = source.anggota.splice(sourceAi, 1);

      if (isKoordinator && source.anggota.length > 0) {
        source.anggota[0].keterangan = person.keterangan;
      }

      const hasKoordinator = destination.anggota.some(
        (a) => a.keterangan !== "Anggota",
      );

      movedPerson.keterangan = hasKoordinator
        ? "Anggota"
        : isKoordinator
          ? person.keterangan
          : "Koordinator";

      destination.anggota.push(movedPerson);

      return next;
    });
  }

  // function keTitleCase(teks: string): string {
  //   return teks
  //     .toLowerCase()
  //     .split(" ")
  //     .filter(Boolean)
  //     .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
  //     .join(" ");
  // }

  // Menerapkan hasil import file (Excel/CSV): "ganti" menimpa seluruh
  // data, "tambah" menggabungkan ke data yang sedang aktif (periset dengan
  // NIP yang sudah terdaftar dilewati, tidak ditambahkan dobel).
  function terapkanImportData(
    dataBaru: PusatRiset[],
    mode: "ganti" | "tambah",
  ): { ditambahkan: number; dilewati: number } {
    const bersih = cloneData(dataBaru);

    if (mode === "ganti") {
      const totalPeriset = bersih.reduce(
        (n, p) => n + p.kelompok.reduce((m, k) => m + k.anggota.length, 0),
        0,
      );

      setDraft(bersih);
      setModeEdit(true);

      return { ditambahkan: totalPeriset, dilewati: 0 };
    }

    const basis = modeEdit ? draft : data;
    const next = cloneData(basis);

    const nipTerdaftar = new Set<string>();

    next.forEach((p) =>
      p.kelompok.forEach((k) =>
        k.anggota.forEach((a) => {
          const nip = a.nip.trim();
          if (nip) nipTerdaftar.add(nip);
        }),
      ),
    );

    let ditambahkan = 0;
    let dilewati = 0;

    bersih.forEach((pusatBaru) => {
      let pusatTujuan = next.find((p) => p.nama === pusatBaru.nama);

      if (!pusatTujuan) {
        pusatTujuan = { nama: pusatBaru.nama, kelompok: [] };
        next.push(pusatTujuan);
      }

      pusatBaru.kelompok.forEach((kelompokBaru) => {
        let kelompokTujuan = pusatTujuan!.kelompok.find(
          (k) => k.nama === kelompokBaru.nama,
        );

        if (!kelompokTujuan) {
          kelompokTujuan = { nama: kelompokBaru.nama, anggota: [] };
          pusatTujuan!.kelompok.push(kelompokTujuan);
        }

        kelompokBaru.anggota.forEach((periset) => {
          const nip = periset.nip.trim();

          if (nip && nipTerdaftar.has(nip)) {
            dilewati += 1;
            return;
          }

          kelompokTujuan!.anggota.push(periset);
          ditambahkan += 1;

          if (nip) nipTerdaftar.add(nip);
        });
      });
    });

    setDraft(next);
    setModeEdit(true);

    return { ditambahkan, dilewati };
  }

  // Menghitung total kelompok dan periset.
  const total = useMemo(() => {
    return {
      kelompok: data.reduce((jumlah, p) => jumlah + p.kelompok.length, 0),
      periset: data.reduce(
        (jumlah, p) =>
          jumlah +
          p.kelompok.reduce(
            (jumlahAnggota, k) => jumlahAnggota + k.anggota.length,
            0,
          ),
        0,
      ),
    };
  }, [data]);

  // Filter berdasarkan pusat riset dan pencarian.
  const tampil: PusatTampil[] = useMemo(() => {
    const q = cari.trim().toLowerCase();

    // Saat mengedit tanpa pencarian, kelompok/pusat yang masih kosong tetap
    // ditampilkan supaya bisa diisi. Di luar itu, yang kosong disembunyikan.
    const tampilkanKosong = modeEdit && !q;

    return activeData
      .map((p, pi) => ({
        nama: p.nama,
        pi,
        kelompok: p.kelompok
          .map((k, ki) => {
            const semuaAnggota = k.anggota.map((a, ai) => ({
              ...a,
              no: ai + 1,
              ai,
            }));

            const cocokKelompok = k.nama.toLowerCase().includes(q);

            const anggota =
              q && !cocokKelompok
                ? semuaAnggota.filter((a) =>
                    [a.nama, a.nip, a.jabatan, a.keterangan].some((value) =>
                      value.toLowerCase().includes(q),
                    ),
                  )
                : semuaAnggota;

            return {
              nama: k.nama,
              no: ki + 1,
              ki,
              anggota,
            };
          })
          .filter((k) => tampilkanKosong || k.anggota.length > 0),
      }))
      .filter(
        (p) =>
          (pusat === SEMUA || p.nama === pusat) && p.kelompok.length > 0,
      );
  }, [activeData, pusat, cari, modeEdit]);

  // Daftar pilihan kelompok untuk fitur pindah periset.
  const opsiKelompok = useMemo(() => {
    return draft.flatMap((p, pi) =>
      p.kelompok.map((k, ki) => ({
        value: `${pi}:${ki}`,
        label: `${p.nama} — ${k.nama || "(kelompok tanpa nama)"}`,
      })),
    );
  }, [draft]);

  const opsiPusat = useMemo(() => {
    return [SEMUA, ...data.map((p) => p.nama)];
  }, [data]);

  return {
    data,
    draft,
    activeData,
    modeEdit,

    memuat,
    errorMuat,
    menyimpan,
    errorSimpan,
    muatUlang: muatData,

    pusat,
    setPusat,

    cari,
    setCari,

    tampil,
    total,
    opsiPusat,
    opsiKelompok,

    mulaiEdit,
    batalEdit,
    simpanEdit,

    tambahKelompok,
    hapusKelompok,
    ubahNamaKelompok,

    updatePeriset,
    tambahPeriset,
    hapusPeriset,
    gantiKoordinator,
    pindahPeriset,
    terapkanImportData,
  };
}