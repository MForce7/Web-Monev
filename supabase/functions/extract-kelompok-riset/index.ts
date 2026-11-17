// Deploy : supabase functions deploy import-kelompok-riset
// Set key: supabase secrets set GEMINI_API_KEY=xxxxxxxx

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.5-flash"; // ganti sesuai model terbaru di AI Studio bila perlu
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROMPT_EKSTRAKSI = `
Kamu mengekstrak data "Kelompok Riset" dari dokumen (SK, surat, daftar nama, dsb).
Kembalikan HANYA JSON dengan struktur persis berikut, tanpa teks atau markdown lain:

{
  "pusatRiset": [
    {
      "nama": "string",
      "kelompok": [
        {
          "nama": "string",
          "anggota": [
            {
              "nama": "string",
              "nip": "string",
              "keterangan": "Koordinator" | "Ketua" | "Anggota",
              "jabatan": "string"
            }
          ]
        }
      ]
    }
  ]
}

Aturan:
- NIP atau jabatan yang tidak ditemukan diisi string kosong "".
- Tepat satu orang per kelompok berketerangan "Koordinator" atau "Ketua", sisanya "Anggota".
- Jangan menambah field lain di luar struktur di atas.
`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY belum diset sebagai Supabase secret.");
    }

    const { fileBase64, mimeType } = await req.json();

    if (!fileBase64 || !mimeType) {
      return jsonResponse(
        { error: "fileBase64 dan mimeType wajib diisi." },
        400,
      );
    }

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT_EKSTRAKSI },
              { inline_data: { mime_type: mimeType, data: fileBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      throw new Error(`Gemini API error ${geminiRes.status}: ${detail}`);
    }

    const geminiData = await geminiRes.json();
    const teks = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!teks) {
      throw new Error("Gemini tidak mengembalikan hasil yang valid.");
    }

    let hasil: unknown;
    try {
      hasil = JSON.parse(teks);
    } catch {
      throw new Error("Hasil Gemini bukan JSON yang valid.");
    }

    if (
      !hasil ||
      typeof hasil !== "object" ||
      !Array.isArray((hasil as { pusatRiset?: unknown }).pusatRiset)
    ) {
      throw new Error("Struktur JSON hasil tidak sesuai format yang diharapkan.");
    }

    return jsonResponse(hasil);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan." },
      500,
    );
  }
});