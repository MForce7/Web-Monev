import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = "gemini-2.0-flash";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    pusatRiset: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nama: { type: "string" },
          kelompok: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nama: { type: "string" },
                anggota: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nama: { type: "string" },
                      nip: { type: "string" },
                      keterangan: { type: "string" },
                      jabatan: { type: "string" },
                    },
                    required: ["nama", "nip", "keterangan", "jabatan"],
                  },
                },
              },
              required: ["nama", "anggota"],
            },
          },
        },
        required: ["nama", "kelompok"],
      },
    },
  },
  required: ["pusatRiset"],
};

const PROMPT = `Kamu membantu mengekstrak data kelompok riset dari dokumen resmi (surat keputusan, SK, atau daftar personel).
Baca dokumen ini dan susun ke dalam struktur JSON berikut:
- pusatRiset: daftar pusat riset yang disebut di dokumen
  - nama: nama lengkap pusat riset (contoh: "Pusat Riset Antariksa", "Pusat Riset Teknologi Penerbangan", "Pusat Riset Teknologi Satelit", "Pusat Riset Teknologi Roket")
  - kelompok: daftar kelompok riset di bawah pusat riset itu
    - nama: nama kelompok riset
    - anggota: daftar periset dalam kelompok itu
      - nama: nama lengkap periset (termasuk gelar jika ada)
      - nip: NIP periset (angka sebagai string, string kosong jika tidak disebutkan)
      - keterangan: peran orang itu di kelompok. Pakai "Koordinator" atau "Ketua" PERSIS seperti tertulis di dokumen untuk pemimpin kelompok, dan "Anggota" untuk anggota biasa
      - jabatan: jabatan fungsional periset tersebut (contoh: "Peneliti Ahli Madya", "Perekayasa Ahli Muda")

Jika dokumen hanya menyebut satu pusat riset, tetap kembalikan sebagai array berisi satu elemen.
Jangan mengarang data yang tidak ada di dokumen. Jika suatu field tidak disebutkan, isi dengan string kosong.`;

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Verifikasi caller adalah admin, pakai JWT yang diteruskan dari client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin");
    if (isAdminError || !isAdminData) {
      return new Response(JSON.stringify({ error: "Hanya admin yang boleh mengimpor data" }), { status: 403 });
    }

    const { fileBase64, mimeType } = await req.json();

    if (!fileBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "fileBase64 dan mimeType wajib diisi" }), { status: 400 });
    }

    let parts: unknown[];

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // .docx -> ekstrak teks dulu, baru kirim sebagai teks ke Gemini (Gemini tidak baca .docx native)
      const mammoth = await import("npm:mammoth@1.7.0");
      const buffer = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
      const result = await mammoth.extractRawText({ buffer });
      parts = [{ text: `${PROMPT}\n\n--- ISI DOKUMEN ---\n${result.value}` }];
    } else {
      // PDF atau gambar -> kirim langsung sebagai inline data (multimodal), termasuk hasil scan
      parts = [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType, data: fileBase64 } },
      ];
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            response_mime_type: "application/json",
            response_schema: RESPONSE_SCHEMA,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${errText}` }), { status: 502 });
    }

    const geminiJson = await geminiRes.json();
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(JSON.stringify({ error: "Gemini tidak mengembalikan hasil" }), { status: 502 });
    }

    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});