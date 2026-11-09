import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface ProfileData {
  fullName: string
  unitKerja: string
  satuanKerja: string
  role: string
  avatarFileId: string | null
}

/**
 * Ambil data profil (full_name, unit_kerja, satuan_kerja, dll) dari tabel `profiles`.
 * userId kosong/undefined -> tidak fetch, profile tetap null.
 */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(!!userId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('profiles')
      .select('full_name, unit_kerja, satuan_kerja, role, avatar_file_id')
      .eq('id', userId)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return

        if (err) {
          setError(err.message)
          setProfile(null)
        } else if (data) {
          setProfile({
            fullName: data.full_name ?? '',
            unitKerja: data.unit_kerja ?? '',
            satuanKerja: data.satuan_kerja ?? '',
            role: data.role ?? 'researcher',
            avatarFileId: data.avatar_file_id ?? null,
          })
        }

        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { profile, loading, error }
}