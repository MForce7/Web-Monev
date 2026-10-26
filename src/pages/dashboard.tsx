import { useEffect, useState, type MouseEvent } from "react";
import LOGO from "../assets/logo.png"; // sesuaikan nama file & path
import HERO from "../assets/hero.jpg"; // sesuaikan nama file & path

/* ================== PENGATURAN UKURAN ================== */
// Makin kecil angkanya, makin kecil tampilan halaman. Coba 0.65 / 0.75 / 0.85
const ZOOM = 0.75;
/* ======================================================= */

/* ================== PENGATURAN TRANSISI ================== */
const TRANSITION_MS = 600; // lama animasi pindah halaman
/* ========================================================= */

/* ---------- DATA (ganti dengan data dari logbook / API) ---------- */
type Periode = "III" | "IV";

const STATS = [
  { label: "Ketua Tim", color: "text-[#ffb322]", target: 56, realisasi: 56 },
  { label: "Publikasi", color: "text-[#f85a5a]", target: 66, realisasi: 66 },
  { label: "Purwarupa", color: "text-[#4195ff]", target: 33, realisasi: 33 },
  { label: "KI", color: "text-[#5b21cd]", target: 40, realisasi: 40 },
];

/* ----- Leaderboard kepatuhan logbook: tertinggi & terendah ----- */
type Kepatuhan = { kode: string; persen: number };

const KEPATUHAN_TERTINGGI: Kepatuhan[] = [
  { kode: "PRTR", persen: 90 },
  { kode: "PRTS", persen: 80 },
  { kode: "PRA", persen: 70 },
  { kode: "PRTP", persen: 60 },
];

// CONTOH: ganti dengan data asli (urut dari yang paling rendah)
const KEPATUHAN_TERENDAH: Kepatuhan[] = [
  { kode: "PRXA", persen: 20 },
  { kode: "PRXB", persen: 30 },
  { kode: "PRXC", persen: 40 },
  { kode: "PRXD", persen: 50 },
];

const PERINGKAT_TERTINGGI: string[] = [
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Nisrina Zalfa Qarirah,S.Si",
  "Dini Dwirahayu,S.Si",
];

// CONTOH: ganti dengan data asli (urut dari yang paling rendah)
const PERINGKAT_TERENDAH: string[] = [
  "Nama Periset 1,S.Si",
  "Nama Periset 2,S.Si",
  "Nama Periset 3,S.Si",
  "Nama Periset 4,S.Si",
  "Nama Periset 5,S.Si",
  "Nama Periset 6,S.Si",
  "Nama Periset 7,S.Si",
  "Nama Periset 8,S.Si",
  "Nama Periset 9,S.Si",
  "Nama Periset 10,S.Si",
];

const LEADERBOARD = [
  {
    judul: "Peringkat Kepatuhan Logbook Tertinggi",
    kepatuhan: KEPATUHAN_TERTINGGI,
    peringkat: PERINGKAT_TERTINGGI,
  },
  {
    judul: "Peringkat Kepatuhan Logbook Terendah",
    kepatuhan: KEPATUHAN_TERENDAH,
    peringkat: PERINGKAT_TERENDAH,
  },
] as const;

const DESIGN_WIDTH = 1440; // lebar desain di SVG
const BAR_MAX_HEIGHT = 274; // tinggi batang untuk 90% (sesuai desain)
const BAR_SCALE = BAR_MAX_HEIGHT / 90;

/* Ukuran geser leaderboard */
const PANEL_WIDTH = 1190; // lebar satu panel
const PANEL_GAP = 60; // jarak antar panel (supaya panel sebelah tidak mengintip)
const PANEL_STRIDE = PANEL_WIDTH + PANEL_GAP;

/* ================== TRANSISI PINDAH HALAMAN ================== */
const TRANSITION_CSS = `
@keyframes pt-wipe-in {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
@keyframes pt-wipe-out {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}
@keyframes pt-logo-in {
  0%   { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes pt-logo-out {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.08); }
}
.pt-overlay { position: fixed; inset: 0; z-index: 9999; background: #f22838; display: grid; place-items: center; will-change: transform; }
.pt-overlay.pt-enter { animation: pt-wipe-out ${TRANSITION_MS}ms cubic-bezier(0.77, 0, 0.175, 1) both; pointer-events: none; }
.pt-overlay.pt-leave { animation: pt-wipe-in ${TRANSITION_MS}ms cubic-bezier(0.77, 0, 0.175, 1) both; pointer-events: all; }
.pt-overlay.pt-idle  { transform: translateX(100%); pointer-events: none; visibility: hidden; }
.pt-overlay.pt-enter .pt-logo { animation: pt-logo-out ${Math.round(TRANSITION_MS * 0.6)}ms ease-out both; }
.pt-overlay.pt-leave .pt-logo { animation: pt-logo-in ${Math.round(TRANSITION_MS * 0.8)}ms ease-out ${Math.round(TRANSITION_MS * 0.25)}ms both; }
@media (prefers-reduced-motion: reduce) {
  .pt-overlay { display: none !important; }
}
`;

type Transisi = "enter" | "leave" | "idle";

// function PageTransition({ state }: { state: Transisi }) {
//   return (
//     <>
//       <style>{TRANSITION_CSS}</style>
//       <div className={`pt-overlay pt-${state}`} aria-hidden="true">
//         <div className="pt-logo rounded-2xl bg-white px-8 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
//           <img src={LOGO} alt="" style={{ width: 220, height: "auto", display: "block" }} />
//         </div>
//       </div>
//     </>
//   );
// }
/* ============================================================ */

/* Kolom kosong: tempat visualisasi target vs realisasi dari logbook periset */
function ChartCard({ id }: { id: string }) {
  return (
    <div
      data-chart={id}
      className="h-[350px] rounded-2xl bg-white shadow-[0_8px_18px_rgba(0,0,0,0.2)]"
    />
  );
}

const ArrowIcon = ({ dir }: { dir: "l" | "r" }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={dir === "l" ? { transform: "scaleX(-1)" } : undefined}
  >
    <path d="M6 20h27M22 9l11 11-11 11" />
  </svg>
);

/* Tekstur footer (diambil persis dari desain SVG) */
const FooterTexture = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 4585 1440 300"
    fill="#F22838"
    fillOpacity="0.05"
    fillRule="evenodd"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
      <path d="M757.05 4585C739.628 4630.28 730.903 4679.69 730.903 4733.2V4775.35L1392.73 4830.59C1397.59 4782.98 1413.41 4741.73 1440 4706.88V4585H757.05Z" />
      <path d="M843.377 4585C768.399 4664.18 730.903 4762.1 730.903 4878.55V4922.77L1270.36 4970H1393.96C1399.93 4924.56 1415.33 4884.86 1440 4850.95V4585H843.377Z" />
      <path d="M821.201 4585C761.005 4662.37 730.903 4755.36 730.903 4863.81V4909.77L1392.73 4970C1397.59 4918.09 1413.41 4873.11 1440 4835.12V4585H821.201Z" />
      <path d="M828.85 4585C764.481 4662.37 732.293 4755.36 732.293 4863.81V4909.77L1440 4970V4585H828.85V4585Z" />
      <path d="M426.53 4585C358.971 4662.37 325.186 4755.36 325.186 4863.81V4909.77L1067.97 4970C1079.23 4862.76 1143 4785.1 1257.42 4737.55C1306.07 4717.34 1366.93 4701.42 1440 4689.8V4585H426.53Z" />
      <path d="M263.936 4585C261.945 4589.77 259.998 4594.57 258.124 4599.42L241.929 4641.31L878.418 4717.58C904.142 4665.1 940.341 4620.89 986.713 4585L263.936 4585Z" />
      <path d="M292.007 4585C254.568 4633.03 224.655 4686 202.282 4743.87L185.293 4787.81L820.743 4866.77C870.349 4764.55 955.525 4692.14 1074.41 4649.97C1166 4617.49 1287.87 4599.65 1440 4596.45V4585H292.007Z" />
      <path d="M284.759 4585C253.61 4629.28 227.994 4677.36 207.943 4729.22L190.286 4774.9L824.859 4856.12C876.026 4749.87 962.333 4674.53 1081.91 4630.57C1139.21 4609.51 1208.14 4594.32 1288.7 4585H284.759Z" />
      <path d="M287.648 4585C255.511 4629.28 229.39 4677.37 209.326 4729.27L191.667 4774.94L871.832 4857.65C923.69 4751.42 1013.91 4676.2 1140.52 4632.47C1206.63 4609.64 1287.69 4593.82 1383.69 4585H287.648Z" />
      <path d="M0 4585V4786.76L502.117 4845.63C554.505 4739.42 647.719 4664.3 779.693 4620.75C825.029 4605.79 877.205 4593.87 936.222 4585L0 4585Z" />
      <path d="M0 4585V4681.28L299.698 4731.22C353.834 4671.39 416.361 4622.63 486.833 4585H0Z" />
      <path d="M0 4585V4668.16L308.063 4720.79C356.598 4666.92 411.19 4621.64 471.549 4585H0Z" />
      <path d="M0 4585V4665.94L354.102 4723.89C404.492 4668.39 462.224 4622.07 526.96 4585H0Z" />
      <path d="M0 4585V4690.58C38.0528 4650.34 80.4756 4615.14 127.126 4585H0Z" />
      <path d="M682.949 4970C700.371 4924.72 709.097 4875.32 709.097 4821.8V4779.65L47.2672 4724.41C42.4138 4772.02 26.5933 4813.28 0 4848.12V4970H682.949Z" />
      <path d="M596.623 4970C671.601 4890.82 709.097 4792.9 709.097 4676.45V4632.23L169.636 4585H46.0421C40.0717 4630.44 24.6732 4670.14 0 4704.05V4970L596.623 4970Z" />
      <path d="M618.798 4970C678.995 4892.63 709.097 4799.64 709.097 4691.19V4645.23L47.2672 4585C42.4138 4636.91 26.5933 4681.89 0 4719.88V4970H618.798Z" />
      <path d="M611.149 4970C675.517 4892.63 707.706 4799.64 707.706 4691.19V4645.23L0 4585V4970H611.149Z" />
      <path d="M1013.47 4970C1081.03 4892.63 1114.81 4799.64 1114.81 4691.19V4645.23L372.029 4585C360.774 4692.24 296.998 4769.9 182.579 4817.45C133.93 4837.66 73.0656 4853.58 0 4865.2V4970H1013.47Z" />
      <path d="M1176.06 4970C1178.05 4965.23 1180 4960.43 1181.88 4955.58L1198.07 4913.69L561.581 4837.42C535.857 4889.9 499.658 4934.11 453.286 4970H1176.06Z" />
      <path d="M1147.99 4970C1185.43 4921.97 1215.34 4869 1237.72 4811.13L1254.71 4767.19L619.256 4688.23C569.651 4790.45 484.474 4862.86 365.587 4905.03C273.997 4937.51 152.13 4955.35 0 4958.55V4970H1147.99Z" />
      <path d="M1155.24 4970C1186.39 4925.72 1212.01 4877.64 1232.06 4825.78L1249.71 4780.1L615.141 4698.88C563.973 4805.13 477.666 4880.47 358.085 4924.43C300.789 4945.49 231.856 4960.68 151.3 4970H1155.24Z" />
      <path d="M1152.35 4970C1184.49 4925.72 1210.61 4877.64 1230.67 4825.73L1248.33 4780.06L568.168 4697.35C516.309 4803.58 426.087 4878.8 299.483 4922.53C233.373 4945.36 152.31 4961.18 56.3116 4970H1152.35Z" />
      <path d="M1440 4970V4768.24L937.882 4709.37C885.495 4815.58 792.281 4890.7 660.307 4934.25C614.971 4949.21 562.794 4961.13 503.778 4970L1440 4970Z" />
      <path d="M1440 4970V4873.72L1140.3 4823.78C1086.17 4883.61 1023.64 4932.37 953.166 4970H1440Z" />
      <path d="M1440 4970V4886.84L1131.94 4834.21C1083.4 4888.08 1028.81 4933.36 968.451 4970H1440Z" />
      <path d="M1440 4970V4889.06L1085.9 4831.11C1035.51 4886.62 977.776 4932.93 913.039 4970L1440 4970Z" />
      <path d="M1440 4970V4864.42C1401.95 4904.66 1359.52 4939.86 1312.87 4970H1440Z" />
  </svg>
);

const PILL =
  "inline-flex h-[49px] items-center justify-center whitespace-nowrap rounded-[25px] bg-[#f22838] px-[19px] text-[24px] font-bold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.25)] cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95";

const getWidth = () =>
  typeof window === "undefined" ? DESIGN_WIDTH : document.documentElement.clientWidth;

/* Satu panel leaderboard: grafik batang PR + daftar periset */
function LeaderboardPanel({
  kepatuhan,
  peringkat,
  aktif,
}: {
  kepatuhan: readonly Kepatuhan[];
  peringkat: readonly string[];
  aktif: boolean;
}) {
  return (
    <div
      className="flex-none"
      style={{ width: PANEL_WIDTH }}
      aria-hidden={!aktif}
    >
      <div className="relative h-[445px] rounded-2xl bg-white shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
        <div className="absolute bottom-[45px] left-[109px] flex items-end gap-[47px]">
          {kepatuhan.map((k) => (
            <div key={k.kode} className="flex w-[200px] flex-col items-center">
              <div className="text-[32px] font-bold leading-[40px] text-[#353535]">
                {k.kode}
              </div>
              <div className="mb-1 mt-2 w-[140px] text-center text-[16px] font-bold leading-[18px] text-[#737373]">
                {k.persen}% Periset telah mengisi logbook
              </div>
              <div
                className="w-[200px] bg-[linear-gradient(180deg,#54a0ff_0%,#326099_100%)] transition-[height] duration-700 ease-out"
                style={{ height: aktif ? k.persen * BAR_SCALE : 0 }}
              />
            </div>
          ))}
        </div>
      </div>

      <ol className="m-0 ml-[7px] mt-[55px] w-[1183px] list-none overflow-hidden rounded-2xl bg-white p-0 shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
        {peringkat.map((nama, i) => (
          <li
            key={i}
            className="flex h-[78px] items-center border-b-2 border-[#d9d9d9] pl-[34px] text-[28px] font-bold text-[#737373] last:border-b-0"
          >
            <span className="mr-[29px] grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-[#54a0ff] text-[28px] font-bold text-white">
              {i + 1}
            </span>
            {nama}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Dashboard() {
  const [periode, setPeriode] = useState<Periode>("III");
  const [vw, setVw] = useState<number>(getWidth);
  // 0 = Tertinggi, 1 = Terendah
  const [view, setView] = useState<0 | 1>(0);
  // Transisi pindah halaman: "enter" = menyapu keluar saat halaman dibuka
  const [transisi, setTransisi] = useState<Transisi>("enter");

  /* Muat Tailwind otomatis (CDN) supaya cukup 1 file, tanpa setup apa pun.
     Kalau proyekmu sudah memasang Tailwind sendiri, hapus blok ini. */
  useEffect(() => {
    if (document.getElementById("tw-cdn")) return;
    const s = document.createElement("script");
    s.id = "tw-cdn";
    s.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflowX = "hidden";
    const onResize = () => setVw(getWidth());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Tombol "Back" browser bisa memulihkan halaman dari cache dengan overlay masih menutup
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setTransisi("enter");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Pindah halaman dengan animasi
  const goTo = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Biarkan perilaku bawaan untuk Ctrl/Cmd/Shift-klik atau klik tengah (buka tab baru)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();

    // Sudah di halaman yang sama: cukup gulir ke atas
    if (window.location.pathname === href) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.location.assign(href);
      return;
    }

    if (transisi === "leave") return; // cegah klik ganda
    setTransisi("leave");
    window.setTimeout(() => window.location.assign(href), TRANSITION_MS);
  };

  // Skala: tidak lebih besar dari ZOOM, dan otomatis mengecil kalau layar sempit
  const scale = Math.min(ZOOM, vw / DESIGN_WIDTH);

  const tabBase =
    "flex h-[62px] cursor-pointer items-center justify-center rounded-t-2xl border-0 text-center text-[24px] font-bold leading-[28px]";
  const tabOn = "bg-white text-[#f22838]";
  const tabOff = "bg-[#f22838] text-white";

  const arrowBase =
    "absolute top-0 grid h-[72px] w-[72px] place-items-center rounded-full border-0 bg-white/80 text-[#f22838] transition";
  const arrowOn = "cursor-pointer hover:bg-white";
  const arrowOff = "cursor-not-allowed opacity-40";

  return (
    <>
      {/* Overlay transisi (di luar wrapper zoom supaya selalu menutup seluruh layar) */}
      {/* <PageTransition state={transisi} /> */}

      <div
        style={{ zoom: scale, width: vw / scale }}
        className="overflow-hidden bg-white text-[#353535] [font-family:Helvetica_Neue,Helvetica,Arial,sans-serif]"
      >
        {/* ===== HERO ===== */}
        <header
          className="relative h-[441px] bg-[#1e1e1e] bg-cover bg-center text-white"
          style={{ backgroundImage: `url("${HERO}")` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1e1e1e_21%,rgba(33,33,33,0.8)_82%,rgba(0,0,0,0.3)_100%)]" />

          <div className="relative mx-auto h-full w-[1440px]">
            <div className="absolute inset-x-0 top-[210px] text-center">
              <h1 className="m-0 bg-[linear-gradient(90deg,#fff_0%,#d9d9d9_60%)] bg-clip-text text-[44px] font-extrabold uppercase leading-[56px] tracking-[-1.5px] text-transparent [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.45))]">
                Organisasi Riset Penerbangan dan Antariksa
              </h1>
              <p className="mx-auto mt-[3px] max-w-[740px] text-[24px] font-semibold leading-[28px] text-[#e9e9e9] [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                Pusat informasi perencanaan, penganggaran, dan pemantauan
                <br />
                kinerja Organisasi Riset Penerbangan dan Antariksa.
              </p>
            </div>

            <div className="absolute bottom-0 left-[474px] flex" role="tablist">
              <button
                role="tab"
                aria-selected={periode === "III"}
                className={`${tabBase} w-[250px] ${periode === "III" ? tabOn : tabOff}`}
                onClick={() => setPeriode("III")}
              >
                MONEV<br />Triwulan III
              </button>
              <button
                role="tab"
                aria-selected={periode === "IV"}
                className={`${tabBase} w-[235px] ${periode === "IV" ? tabOn : tabOff}`}
                onClick={() => setPeriode("IV")}
              >
                MONEV<br />Triwulan IV
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-[1216px] pt-[99px]">
          <div className="flex h-[87px] items-center justify-center rounded-3xl bg-[#f22838] text-[40px] font-bold text-white shadow-[0_6px_14px_rgba(0,0,0,0.25)]">
            Capaian MONEV Triwulan {periode} Tahun 2026
          </div>

          {/* ===== KARTU ANGKA: baris 1 target, baris 2 realisasi ===== */}
          <section className="ml-[137px] mt-[69px] grid w-[995px] grid-cols-[repeat(4,206px)] gap-x-[57px] gap-y-[23px]">
            {[
              { key: "t", suffix: "Target", pick: (s: (typeof STATS)[number]) => s.target },
              { key: "r", suffix: "Realisasi", pick: (s: (typeof STATS)[number]) => s.realisasi },
            ].map((row) =>
              STATS.map((s) => (
                <div
                  key={`${row.key}-${s.label}`}
                  className="h-[126px] rounded-xl bg-white px-[15px] text-center shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                >
                  <p
                    className={`m-0 flex h-[36px] items-center justify-center border-b border-[#d9d9d9] text-[16px] font-semibold [text-shadow:0_1px_3px_currentColor] ${s.color}`}
                  >
                    {s.label === "Ketua Tim" ? "Ketua Tim" : `${s.label} (${row.suffix})`}
                  </p>
                  <p
                    className={`m-0 text-[48px] font-bold leading-[78px] [text-shadow:0_2px_5px_rgba(0,0,0,0.25)] ${s.color}`}
                  >
                    {row.pick(s)}
                  </p>
                </div>
              ))
            )}
          </section>

          {/* ===== 4 KOLOM KOSONG (visualisasi target & realisasi) ===== */}
          <section className="mt-[88px] grid grid-cols-[581px_581px] gap-x-[54px] gap-y-[63px]">
            <ChartCard id="chart-1" />
            <ChartCard id="chart-2" />
            <ChartCard id="chart-3" />
            <ChartCard id="chart-4" />
          </section>

          <div className="mx-auto mt-[125px] max-w-[980px] text-center">
            <h2 className="m-0 text-[32px] font-bold leading-[40px] text-[#353535]">
              Komposisi Capaian Kinerja Pusat Riset
            </h2>
            <p className="mx-0 mb-0 mt-[15px] text-[24px] font-semibold leading-[28px] text-[#737373]">
              Diagram berikut menampilkan proporsi dan perbandingan realisasi capaian kinerja
              <br />
              dari setiap Pusat Riset pada periode ini.
            </p>
          </div>

          <section className="mt-[86px] grid grid-cols-[581px_581px] gap-x-[54px] gap-y-[63px]">
            <ChartCard id="chart-5" />
            <ChartCard id="chart-6" />
            <ChartCard id="chart-7" />
            <ChartCard id="chart-8" />
          </section>
        </main>

        {/* ===== PERINGKAT KEPATUHAN LOGBOOK (tertinggi <-> terendah) ===== */}
        <section className="mt-[109px] bg-[#f22838] pb-[151px] pt-[30px]">
          <div className="mx-auto w-[1440px]">
            <div className="ml-[140px] w-[1190px]">
              <div className="relative flex h-[72px] items-center justify-center">
                <button
                  aria-label="Lihat kepatuhan tertinggi"
                  disabled={view === 0}
                  onClick={() => setView(0)}
                  className={`${arrowBase} left-[-2px] ${view === 0 ? arrowOff : arrowOn}`}
                >
                  <ArrowIcon dir="l" />
                </button>
                <h2
                  key={view}
                  aria-live="polite"
                  className="m-0 text-[40px] font-bold text-white"
                >
                  {LEADERBOARD[view].judul}
                </h2>
                <button
                  aria-label="Lihat kepatuhan terendah"
                  disabled={view === 1}
                  onClick={() => setView(1)}
                  className={`${arrowBase} right-0 ${view === 1 ? arrowOff : arrowOn}`}
                >
                  <ArrowIcon dir="r" />
                </button>
              </div>

              {/* Jendela geser: dua panel berjajar, digeser lewat translateX */}
              <div className="-mx-[16px] mt-[33px] -mb-[24px] overflow-hidden px-[16px] pb-[24px]">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    gap: PANEL_GAP,
                    transform: `translateX(-${view * PANEL_STRIDE}px)`,
                  }}
                >
                  {LEADERBOARD.map((l, i) => (
                    <LeaderboardPanel
                      key={l.judul}
                      kepatuhan={l.kepatuhan}
                      peringkat={l.peringkat}
                      aktif={view === i}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        
      </div>
    </>
  );
}