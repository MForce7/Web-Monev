import { useEffect, useMemo, useState } from "react";

import raw from "../../../data/kelompokriset.json";

import {
  STORAGE_KEY,
  SEMUA,
} from "../constants";

import type {
  Kelompok,
  PusatRiset,
  PusatTampil,
  TujuanPindah,
} from "../types";

const DATA_AWAL: PusatRiset[] = (
  raw as { pusatRiset: PusatRiset[] }
).pusatRiset;

function cloneData(data: PusatRiset[]): PusatRiset[] {
  return JSON.parse(JSON.stringify(data)) as PusatRiset[];
}

function ambilDataAwal(): PusatRiset[] {
  if (typeof window === "undefined") {
    return cloneData(DATA_AWAL);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved) as PusatRiset[];
    }
  } catch (error) {
    console.error("Gagal membaca localStorage:", error);
  }

  return cloneData(DATA_AWAL);
}

export function useKelompokRiset() {
  const [data, setData] = useState<PusatRiset[]>(ambilDataAwal);

  const [draft, setDraft] = useState<PusatRiset[]>([]);

  const [modeEdit, setModeEdit] = useState(false);

  const [pusat, setPusat] = useState(SEMUA);

  const [cari, setCari] = useState("");

  const activeData = modeEdit ? draft : data;

  // Simpan data ketika mode edit disimpan.
  function mulaiEdit() {
    setDraft(cloneData(data));
    setModeEdit(true);
  }

  function batalEdit() {
    setDraft([]);
    setModeEdit(false);
  }

  function simpanEdit() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(draft),
      );

      setData(cloneData(draft));
      setDraft([]);
      setModeEdit(false);

      return true;
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Data gagal disimpan ke localStorage.");
      return false;
    }
  }

  // Mengubah properti periset.
  function updatePeriset(
    pi: number,
    ki: number,
    ai: number,
    field: keyof import("../types").Periset,
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
    setDraft((previous) => {
      const next = cloneData(previous);
      const kelompok = next[pi]?.kelompok[ki];

      if (!kelompok) return previous;

      kelompok.anggota.push({
        nama: "",
        nip: "",
        keterangan:
          kelompok.anggota.length === 0
            ? "Koordinator"
            : "Anggota",
        jabatan: "",
      });

      return next;
    });
  }

  // Menghapus periset.
  function hapusPeriset(
    pi: number,
    ki: number,
    ai: number,
  ) {
    const person = draft[pi]?.kelompok[ki]?.anggota[ai];

    if (!person) return;

    const konfirmasi = window.confirm(
      `Hapus periset "${person.nama || "Tanpa nama"}"?`,
    );

    if (!konfirmasi) return;

    setDraft((previous) => {
      const next = cloneData(previous);
      const kelompok = next[pi]?.kelompok[ki];

      if (!kelompok) return previous;

      const dihapus = kelompok.anggota.splice(ai, 1)[0];

      // Jika koordinator dihapus, anggota pertama menjadi koordinator.
      if (
        dihapus &&
        dihapus.keterangan !== "Anggota" &&
        kelompok.anggota.length > 0
      ) {
        kelompok.anggota[0].keterangan =
          dihapus.keterangan;
      }

      return next;
    });
  }

  // Mengganti koordinator kelompok.
  function gantiKoordinator(
    pi: number,
    ki: number,
    ai: number,
  ) {
    setDraft((previous) => {
      const next = cloneData(previous);
      const kelompok = next[pi]?.kelompok[ki];

      if (!kelompok || !kelompok.anggota[ai]) {
        return previous;
      }

      const anggota = kelompok.anggota;

      const labelKoordinator =
        anggota.find((a) => a.keterangan !== "Anggota")
          ?.keterangan ?? "Koordinator";

      anggota.forEach((a, index) => {
        a.keterangan =
          index === ai ? labelKoordinator : "Anggota";
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

      if (
        sourcePi === tujuan.pi &&
        sourceKi === tujuan.ki
      ) {
        return previous;
      }

      const person = source.anggota[sourceAi];

      if (!person) return previous;

      const isKoordinator =
        person.keterangan !== "Anggota";

      const [movedPerson] = source.anggota.splice(
        sourceAi,
        1,
      );

      // Jika koordinator dipindahkan, anggota pertama
      // yang tersisa menggantikannya.
      if (
        isKoordinator &&
        source.anggota.length > 0
      ) {
        source.anggota[0].keterangan =
          person.keterangan;
      }

      // Jika kelompok tujuan belum memiliki koordinator,
      // periset yang dipindahkan menjadi koordinator.
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

  // Menghitung total kelompok dan periset.
  const total = useMemo(() => {
    return {
      kelompok: data.reduce(
        (jumlah, p) => jumlah + p.kelompok.length,
        0,
      ),

      periset: data.reduce(
        (jumlah, p) =>
          jumlah +
          p.kelompok.reduce(
            (jumlahAnggota, k) =>
              jumlahAnggota + k.anggota.length,
            0,
          ),
        0,
      ),
    };
  }, [data]);

  // Filter berdasarkan pusat riset dan pencarian.
  const tampil: PusatTampil[] = useMemo(() => {
    const q = cari.trim().toLowerCase();

    return activeData
      .map((p, pi) => ({
        nama: p.nama,
        pi,

        kelompok: p.kelompok
          .map((k, ki) => {
            const semuaAnggota = k.anggota.map(
              (a, ai) => ({
                ...a,
                no: ai + 1,
                ai,
              }),
            );

            const cocokKelompok =
              k.nama.toLowerCase().includes(q);

            const anggota =
              q && !cocokKelompok
                ? semuaAnggota.filter((a) =>
                    [
                      a.nama,
                      a.nip,
                      a.jabatan,
                      a.keterangan,
                    ].some((value) =>
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
          .filter((k) => k.anggota.length > 0),
      }))
      .filter(
        (p) =>
          (pusat === SEMUA || p.nama === pusat) &&
          p.kelompok.length > 0,
      );
  }, [activeData, pusat, cari]);

  // Daftar pilihan kelompok untuk fitur pindah periset.
  const opsiKelompok = useMemo(() => {
    return draft.flatMap((p, pi) =>
      p.kelompok.map((k, ki) => ({
        value: `${pi}:${ki}`,
        label: `${p.nama} — ${k.nama}`,
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

    updatePeriset,
    tambahPeriset,
    hapusPeriset,
    gantiKoordinator,
    pindahPeriset,
  };
}