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
const LOGO =
  "data:image/png;base64,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";

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
      <header className="relative h-[441px] bg-[#1e1e1e] bg-[url('/hero.jpg')] bg-cover bg-center text-white">
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
              <a className={PILL} href="/tester">Logbook</a>
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
      <footer className="relative h-[300px] overflow-hidden bg-[linear-gradient(100deg,#8b0303_0%,#b00e19_55%,#8b0303_100%)] text-center text-white">
        <div className="absolute inset-y-0 left-1/2 w-[1440px] -translate-x-1/2">
          <i className="absolute left-[730px] top-0 h-[190px] w-[710px] bg-[#f22838] opacity-[0.06] [clip-path:polygon(0_0,100%_0,100%_60%,94%_100%,0_70%)]" />
          <i className="absolute left-[120px] top-[80px] h-[220px] w-[520px] bg-[#f22838] opacity-[0.06] [clip-path:polygon(15%_0,100%_30%,80%_100%,0_100%)]" />
          <i className="absolute left-[900px] top-[120px] h-[180px] w-[540px] bg-[#f22838] opacity-[0.06] [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]" />
          <i className="absolute left-0 top-0 h-[200px] w-[360px] bg-[#f22838] opacity-[0.06] [clip-path:polygon(0_0,100%_0,60%_100%,0_80%)]" />
        </div>
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