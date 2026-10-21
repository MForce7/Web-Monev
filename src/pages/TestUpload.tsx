import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
// import { uploadSupportFile } from '../lib/uploadSupportFile'
import type { SupportFile } from '../lib/uploadSupportFile'
import { openDriveFile } from '../lib/driveApi'
import { uploadSupportFile, deleteSupportFile } from '../lib/uploadSupportFile'

export default function TestUpload() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reportId, setReportId] = useState<string | null>(null)
  const [files, setFiles] = useState<SupportFile[]>([])
  const [msg, setMsg] = useState('')

  // Pantau status login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function loadFiles(id: string) {
    const { data } = await supabase
      .from('support_files')
      .select('*')
      .eq('monthly_report_id', id)
    setFiles((data as SupportFile[]) ?? [])
  }

  // Setelah login: siapkan laporan bulan Januari milik user
  useEffect(() => {
    if (!session) {
      setReportId(null)
      return
    }
    ;(async () => {
      const first = () =>
        supabase.from('monthly_reports').select('id').eq('bulan', 1).limit(1)

      let { data } = await first()
      if (!data?.length) {
        await supabase.from('activities').insert({
          nama_ketua: 'Uji',
          judul_aktivitas: 'Aktivitas Uji Upload',
          tahun_pelaksanaan: 2026,
        })
        ;({ data } = await first())
      }
      const id = data?.[0]?.id as string | undefined
      if (id) {
        setReportId(id)
        setMsg('Siap. Pilih file.')
        loadFiles(id)
      } else {
        setMsg('Gagal menyiapkan laporan.')
      }
    })()
  }, [session])

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setMsg(error ? 'Login gagal: ' + error.message : '')
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !reportId) return
    setMsg('Mengunggah...')
    try {
      await uploadSupportFile({ file, reportId, kategori: 'aktivitas' })
      setMsg('Berhasil!')
      loadFiles(reportId)
    } catch (err) {
      setMsg('Error: ' + (err instanceof Error ? err.message : String(err)))
    }
    e.target.value = ''
  }

  if (!session) {
    return (
      <div style={{ maxWidth: 360, margin: '40px auto' }}>
        <h1>Login</h1>
        <input placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8 }} />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8 }} />
        <button onClick={handleLogin}>Masuk</button>
        <p>{msg}</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto' }}>
      <h1>Uji Upload</h1>
      <p>Login sebagai: {session.user.email}{' '}
        <button onClick={() => supabase.auth.signOut()}>Keluar</button>
      </p>
      <p>{msg}</p>
      {reportId && (
        <input type="file" accept="image/*,application/pdf" onChange={onPick} />
      )}
      <ul>
        {files.map((f) => (
          <li key={f.id}>
            <button onClick={() => f.storage_path && openDriveFile(f.storage_path)}>
              {f.label}
            </button>{' '}
            <button
              onClick={async () => {
                await deleteSupportFile(f)
                if (reportId) loadFiles(reportId)
              }}
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}