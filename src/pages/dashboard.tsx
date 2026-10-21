import { useEffect, useState } from "react";

/* ================== PENGATURAN UKURAN ================== */
// Makin kecil angkanya, makin kecil tampilan halaman. Coba 0.65 / 0.75 / 0.85
const ZOOM = 0.75;
/* ======================================================= */

/* ---------- DATA (ganti dengan data dari logbook / API) ---------- */
type Periode = "III" | "IV";

const STATS = [
  { label: "Ketua Tim", color: "text-[#ffb322]", target: 56, realisasi: 56 },
  { label: "Publikasi", color: "text-[#f85a5a]", target: 66, realisasi: 66 },
  { label: "Purwarupa", color: "text-[#4195ff]", target: 33, realisasi: 33 },
  { label: "KI", color: "text-[#5b21cd]", target: 40, realisasi: 40 },
];

const KEPATUHAN = [
  { kode: "PRTR", persen: 90 },
  { kode: "PRTS", persen: 80 },
  { kode: "PRA", persen: 70 },
  { kode: "PRTP", persen: 60 },
];

const PERINGKAT = [
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

const DESIGN_WIDTH = 1440; // lebar desain di SVG
const BAR_MAX_HEIGHT = 274; // tinggi batang untuk 90% (sesuai desain)
const BAR_SCALE = BAR_MAX_HEIGHT / 90;

/* Logo BRIN (tertanam, tidak perlu file) */
const LOGO = "data:image/png;base64,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";

/* Foto gedung (versi kecil tertanam sebagai cadangan).
   Kalau ada file /public/hero.jpg, file itu yang dipakai (lebih tajam). */
const HERO = "data:image/jpeg;base64,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";

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
  "inline-flex h-[49px] items-center justify-center whitespace-nowrap rounded-[25px] bg-[#f22838] px-[19px] text-[24px] font-bold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.25)]";

const getWidth = () =>
  typeof window === "undefined" ? DESIGN_WIDTH : document.documentElement.clientWidth;

export default function Dashboard() {
  const [periode, setPeriode] = useState<Periode>("III");
  const [vw, setVw] = useState<number>(getWidth);

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

  // Skala: tidak lebih besar dari ZOOM, dan otomatis mengecil kalau layar sempit
  const scale = Math.min(ZOOM, vw / DESIGN_WIDTH);

  const tabBase =
    "flex h-[62px] cursor-pointer items-center justify-center rounded-t-2xl border-0 text-center text-[24px] font-bold leading-[28px]";
  const tabOn = "bg-white text-[#f22838]";
  const tabOff = "bg-[#f22838] text-white";

  return (
    <div
      style={{ zoom: scale, width: vw / scale }}
      className="overflow-hidden bg-white text-[#353535] [font-family:Helvetica_Neue,Helvetica,Arial,sans-serif]"
    >
      {/* ===== HERO ===== */}
      <header
        className="relative h-[441px] bg-[#1e1e1e] bg-cover bg-center text-white"
        style={{ backgroundImage: `url(/hero.jpg), url(${HERO})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1e1e1e_21%,rgba(33,33,33,0.8)_82%,rgba(0,0,0,0.3)_100%)]" />

        <div className="relative mx-auto h-full w-[1440px]">
          <nav className="relative h-[129px]">
            <img
              className="absolute left-[50px] top-[38px] h-auto w-[180px]"
              src={LOGO}
              alt="BRIN – Badan Riset dan Inovasi Nasional"
            />
            <div className="absolute left-[486px] top-[40px] flex gap-[21px]">
              <a className={PILL} href="/dashboard">Dashboard</a>
              <a className={PILL} href="/login">Login</a>
              <a className={PILL} href="/monevEditor">Logbook</a>
            </div>
          </nav>

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

      {/* ===== PERINGKAT KEPATUHAN LOGBOOK ===== */}
      <section className="mt-[109px] bg-[#f22838] pb-[151px] pt-[30px]">
        <div className="mx-auto w-[1440px]">
          <div className="ml-[140px] w-[1190px]">
            <div className="relative flex h-[72px] items-center justify-center">
              <button
                aria-label="Sebelumnya"
                className="absolute left-[-2px] top-0 grid h-[72px] w-[72px] cursor-pointer place-items-center rounded-full border-0 bg-white/80 text-[#f22838]"
              >
                <ArrowIcon dir="l" />
              </button>
              <h2 className="m-0 text-[40px] font-bold text-white">
                Peringkat Kepatuhan Logbook Tertinggi
              </h2>
              <button
                aria-label="Berikutnya"
                className="absolute right-0 top-0 grid h-[72px] w-[72px] cursor-pointer place-items-center rounded-full border-0 bg-white/80 text-[#f22838]"
              >
                <ArrowIcon dir="r" />
              </button>
            </div>

            <div className="relative mt-[33px] h-[445px] rounded-2xl bg-white shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
              <div className="absolute bottom-[45px] left-[109px] flex items-end gap-[47px]">
                {KEPATUHAN.map((k) => (
                  <div key={k.kode} className="flex w-[200px] flex-col items-center">
                    <div className="text-[32px] font-bold leading-[40px] text-[#353535]">
                      {k.kode}
                    </div>
                    <div className="mb-1 mt-2 w-[140px] text-center text-[16px] font-bold leading-[18px] text-[#737373]">
                      {k.persen}% Periset telah mengisi logbook
                    </div>
                    <div
                      className="w-[200px] bg-[linear-gradient(180deg,#54a0ff_0%,#326099_100%)]"
                      style={{ height: k.persen * BAR_SCALE }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <ol className="m-0 ml-[7px] mt-[55px] w-[1183px] list-none overflow-hidden rounded-2xl bg-white p-0 shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
              {PERINGKAT.map((nama, i) => (
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
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative h-[300px] overflow-hidden bg-[#8b0303] text-center text-white">
        <FooterTexture />
        <div className="relative pt-[47px]">
          <h3 className="m-0 text-[40px] font-bold leading-[48px]">
            Organisasi Riset Penerbangan dan Antariksa
          </h3>
          <p className="m-0 text-[40px] font-normal leading-[48px]">
            Badan Riset dan Inovasi Nasional
          </p>
          <p className="m-0 mt-[36px] text-[32px] font-normal leading-[40px]">
            © 2026 ORPA – BRIN
          </p>
        </div>
      </footer>
    </div>
  );
}