import { useMemo, useState } from "react";

import raw from "../../../data/kelompokriset.json";

import { STORAGE_KEY, SEMUA } from "../constants";

import type {
  Periset,
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

// Memastikan bentuk data sesuai PusatRiset[] sebelum dipakai.
function dataValid(data: unknown): data is PusatRiset[] {
  return (
    Array.isArray(data) &&
    data.every(
      (p) =>
        p &&
        typeof p.nama === "string" &&
        Array.isArray(p.kelompok) &&
        p.kelompok.every(
          (k: any) =>
            k &&
            typeof k.nama === "string" &&
            Array.isArray(k.anggota) &&
            k.anggota.every(
              (a: any) =>
                a &&
                typeof a.nama === "string" &&
                typeof a.nip === "string" &&
                typeof a.jabatan === "string" &&
                typeof a.keterangan === "string",
            ),
        ),
    )
  );
}

function ambilDataAwal(): PusatRiset[] {
  if (typeof window === "undefined") {
    return cloneData(DATA_AWAL);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (dataValid(parsed)) {
        return parsed;
      }

      console.warn("Format data di localStorage tidak sesuai, memakai data awal.");
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

  /* ---------- Mode edit ---------- */

  function mulaiEdit() {
    setDraft(cloneData(data));
    setModeEdit(true);
  }

  function batalEdit() {
    setDraft([]);
    setModeEdit(false);
  }

  function simpanEdit() {
    // Rapikan spasi, lalu pastikan tidak ada nama kosong sebelum disimpan
    const bersih = cloneData(draft).map((p) => ({
      ...p,
      kelompok: p.kelompok.map((k) => ({
        ...k,
        nama: k.nama.trim(),
        anggota: k.anggota.map((a) => ({
          ...a,
          nama: a.nama.trim(),
          nip: a.nip.trim(),
          jabatan: a.jabatan.trim(),
        })),
      })),
    }));

    for (const p of bersih) {
      for (const k of p.kelompok) {
        if (!k.nama) {
          alert(`Ada kelompok riset di "${p.nama}" yang namanya masih kosong. Isi namanya atau hapus kelompok tersebut.`);
          return false;
        }
        if (k.anggota.some((a) => !a.nama)) {
          alert(`Kelompok "${k.nama}" punya periset yang namanya masih kosong. Isi namanya atau hapus periset tersebut.`);
          return false;
        }
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bersih));

      setData(cloneData(bersih));
      setDraft([]);
      setModeEdit(false);

      return true;
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Data gagal disimpan ke localStorage.");
      return false;
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
        keterangan: kelompok.anggota.length === 0 ? "Koordinator" : "Anggota",
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

      // Jika koordinator dihapus, anggota pertama menjadi koordinator.
      if (dihapus && dihapus.keterangan !== "Anggota" && kelompok.anggota.length > 0) {
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
        anggota.find((a) => a.keterangan !== "Anggota")?.keterangan ?? "Koordinator";

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

      // Jika koordinator dipindahkan, anggota pertama yang tersisa menggantikannya.
      if (isKoordinator && source.anggota.length > 0) {
        source.anggota[0].keterangan = person.keterangan;
      }

      // Jika kelompok tujuan belum memiliki koordinator,
      // periset yang dipindahkan menjadi koordinator.
      const hasKoordinator = destination.anggota.some((a) => a.keterangan !== "Anggota");

      movedPerson.keterangan = hasKoordinator
        ? "Anggota"
        : isKoordinator
          ? person.keterangan
          : "Koordinator";

      destination.anggota.push(movedPerson);

      return next;
    });
  }

  // Menerapkan hasil import file (Excel/CSV): "ganti" menimpa seluruh
  // data, "tambah" menggabungkan ke data yang sedang aktif.
  function terapkanImportData(
    dataBaru: PusatRiset[],
    mode: "ganti" | "tambah",
  ) {
    if (!dataValid(dataBaru)) {
      alert("Format data hasil import tidak valid.");
      return;
    }

    const bersih = cloneData(dataBaru);

    if (mode === "ganti") {
      setDraft(bersih);
      setModeEdit(true);
      return;
    }

    setDraft((previous) => {
      const basis = modeEdit ? previous : cloneData(data);
      const next = cloneData(basis);

      bersih.forEach((pusatBaru) => {
        const pusatIndex = next.findIndex(
          (p) => p.nama === pusatBaru.nama,
        );

        if (pusatIndex === -1) {
          next.push(pusatBaru);
          return;
        }

        const pusatTujuan = next[pusatIndex];

        pusatBaru.kelompok.forEach((kelompokBaru) => {
          const kelompokIndex = pusatTujuan.kelompok.findIndex(
            (k) => k.nama === kelompokBaru.nama,
          );

          if (kelompokIndex === -1) {
            pusatTujuan.kelompok.push(kelompokBaru);
            return;
          }

          // Lewati periset yang sudah ada (cocok berdasarkan NIP, atau nama jika NIP kosong).
          const kelompokTujuan = pusatTujuan.kelompok[kelompokIndex];
          const sudahAda = new Set(
            kelompokTujuan.anggota.map((a) => a.nip || a.nama),
          );

          kelompokTujuan.anggota.push(
            ...kelompokBaru.anggota.filter((a) => !sudahAda.has(a.nip || a.nama)),
          );
        });
      });

      return next;
    });

    setModeEdit(true);
  }

  /* ---------- Data turunan ---------- */

  // Menghitung total kelompok dan periset.
  const total = useMemo(() => {
    return {
      kelompok: data.reduce((jumlah, p) => jumlah + p.kelompok.length, 0),

      periset: data.reduce(
        (jumlah, p) =>
          jumlah + p.kelompok.reduce((jumlahAnggota, k) => jumlahAnggota + k.anggota.length, 0),
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
          (pusat === SEMUA || p.nama === pusat) && (tampilkanKosong || p.kelompok.length > 0),
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