/* ---------- Kelas tabel ---------- */
export const th = "border-r border-white/25 px-3 py-2 text-center text-[11px] font-bold text-white last:border-r-0";
export const td =
  "border-b border-r border-[#dbe6f7] px-3 py-2 text-center text-xs leading-snug text-[#1b3560] [overflow-wrap:break-word]";

// Lebar kolom sticky dibuat responsif lewat variabel CSS (diatur di <section> pada TabelPemantauan.tsx):
// HP: No 44px + Nama 120px = 164px. Tablet ke atas (md): No 56px + Nama 200px = 256px.
// Lebar dikunci (width + min + max) supaya posisi kolom Nama tepat di sebelah kolom No dan tidak ada celah.
export const kunci1 = "w-[var(--no-w)] min-w-[var(--no-w)] max-w-[var(--no-w)]";
export const kunci2 = "w-[var(--nama-w)] min-w-[var(--nama-w)] max-w-[var(--nama-w)]";
export const kunci3 = "w-[var(--judul-w)] min-w-[var(--judul-w)] max-w-[var(--judul-w)]";
export const kunci4 = "w-[var(--unit-w)] min-w-[var(--unit-w)] max-w-[var(--unit-w)]";

export const stickyBody1 = `sticky left-0 z-10 ${kunci1}`;
export const stickyBody2 = `sticky left-[var(--no-w)] z-10 ${kunci2}`;
export const stickyBody3 = `sticky left-[calc(var(--no-w)+var(--nama-w))] z-10 ${kunci3}`;
export const stickyBody4 = `sticky left-[calc(var(--no-w)+var(--nama-w)+var(--judul-w))] z-10 ${kunci4}`;

export const stickyHead1 = `sticky left-0 z-20 ${kunci1}`;
export const stickyHead2 = `sticky left-[var(--no-w)] z-20 ${kunci2}`;
export const stickyHead3 = `sticky left-[calc(var(--no-w)+var(--nama-w))] z-20 ${kunci3}`;
export const stickyHead4 = `sticky left-[calc(var(--no-w)+var(--nama-w)+var(--judul-w))] z-20 ${kunci4}`;