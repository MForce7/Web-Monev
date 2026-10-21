import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,pdf'

export async function POST(req) {
  // A. Ambil token login dari header
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 })
  }

  // B. Client Supabase yang bertindak sebagai user ini (RLS tetap berlaku)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  // C. Verifikasi token benar-benar valid
  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
  }
  const userId = userData.user.id

  // D. Pastikan laporan bulanan ini milik user yang meminta
  const { reportId } = await req.json()
  const { data: report } = await supabase
    .from('monthly_reports')
    .select('id, bulan, activity_id, activities(owner_id)')
    .eq('id', reportId)
    .single()

  if (!report || report.activities?.owner_id !== userId) {
    return NextResponse.json({ error: 'Bukan laporan milikmu' }, { status: 403 })
  }

  // E. Buat public_id (pola folder) dan tanda tangan
  const publicId =
    `monev/${userId}/${report.activity_id}/${report.bulan}/` +
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const timestamp = Math.round(Date.now() / 1000)

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, public_id: publicId, allowed_formats: ALLOWED_FORMATS },
    process.env.CLOUDINARY_API_SECRET
  )

  return NextResponse.json({
    signature,
    timestamp,
    public_id: publicId,
    allowed_formats: ALLOWED_FORMATS,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  })
}