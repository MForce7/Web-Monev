import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,pdf'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha1Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // A. Ambil token login
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return json({ error: 'Belum login' }, 401)

  // B. Client Supabase atas nama user ini (RLS tetap berlaku)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  // C. Verifikasi token benar-benar milik user
  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData?.user) {
    return json({ error: 'Token tidak valid' }, 401)
  }
  const userId = userData.user.id

  // D. Baca body dan pastikan laporan ini milik user
  let reportId: string | undefined
  try {
    ;({ reportId } = await req.json())
  } catch {
    return json({ error: 'Body tidak valid' }, 400)
  }
  if (!reportId) return json({ error: 'reportId wajib diisi' }, 400)

  const { data: report } = await supabase
    .from('monthly_reports')
    .select('id, bulan, activity_id, activities(owner_id)')
    .eq('id', reportId)
    .single()

  // relasi bisa terbaca sebagai objek atau array, tangani keduanya
  const acts = report?.activities as
    | { owner_id: string }
    | { owner_id: string }[]
    | null
    | undefined
  const ownerId = Array.isArray(acts) ? acts[0]?.owner_id : acts?.owner_id

  if (!report || ownerId !== userId) {
    return json({ error: 'Bukan laporan milikmu' }, 403)
  }

  // E. Buat public_id dan tanda tangan
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')
  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: 'Secret Cloudinary belum diatur di Supabase' }, 500)
  }

  const publicId =
    `monev/${userId}/${report.activity_id}/${report.bulan}/` +
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const timestamp = Math.round(Date.now() / 1000)

  // Aturan Cloudinary: urutkan parameter alfabetis, gabung k=v&k=v, tambah secret, SHA-1
  const toSign =
    `allowed_formats=${ALLOWED_FORMATS}` +
    `&public_id=${publicId}` +
    `&timestamp=${timestamp}`
  const signature = await sha1Hex(toSign + apiSecret)

  return json({
    signature,
    timestamp,
    public_id: publicId,
    allowed_formats: ALLOWED_FORMATS,
    api_key: apiKey,
    cloud_name: cloudName,
  })
})