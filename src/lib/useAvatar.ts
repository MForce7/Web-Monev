import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { fetchDriveFile } from './driveApi'

// Dikirim oleh halaman Profil setiap kali nama/foto berubah, supaya navbar ikut diperbarui
export const PROFILE_UPDATED_EVENT = 'monev:profile-updated'

// Semua gambar di src/assets/foto_profil/ terdaftar otomatis sebagai foto bawaan
const STOCK_PHOTOS: string[] = Object.values(
  import.meta.glob<string>('../assets/foto_profil/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

// "Acak" per user, tapi tetap sama setiap kali dibuka
export function pickStockPhoto(userId: string): string | null {
  if (STOCK_PHOTOS.length === 0) return null
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return STOCK_PHOTOS[hash % STOCK_PHOTOS.length]
}

// Simpan foto yang sudah diunduh dari Drive, supaya pindah halaman tidak mengunduh ulang
const cache = new Map<string, { fileId: string; url: string }>()

export function clearAvatarCache() {
  cache.forEach((entry) => URL.revokeObjectURL(entry.url))
  cache.clear()
}

interface AvatarState {
  name: string | null
  photoUrl: string | null
  loading: boolean
}

export function useAvatar(userId: string | undefined): AvatarState {
  const [state, setState] = useState<AvatarState>({
    name: null,
    photoUrl: null,
    loading: Boolean(userId),
  })
  const [tick, setTick] = useState(0)

  // Muat ulang saat halaman Profil mengabarkan ada perubahan
  useEffect(() => {
    const onUpdated = () => setTick((t) => t + 1)
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdated)
  }, [])

  useEffect(() => {
    if (!userId) {
      setState({ name: null, photoUrl: null, loading: false })
      return
    }

    let cancelled = false
    // Tampilkan penanda "memuat" hanya jika belum ada foto sama sekali (hindari kedip saat muat ulang)
    setState((s) => (s.photoUrl ? s : { ...s, loading: true }))

    ;(async () => {
      const stock = pickStockPhoto(userId)
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_file_id')
        .eq('id', userId)
        .single()
      if (cancelled) return

      const row = data as { full_name: string | null; avatar_file_id: string | null } | null
      const name = row?.full_name ?? null
      const fileId = row?.avatar_file_id ?? null

      // Tidak punya foto sendiri -> foto bawaan
      if (!fileId) {
        const old = cache.get(userId)
        if (old) {
          URL.revokeObjectURL(old.url)
          cache.delete(userId)
        }
        setState({ name, photoUrl: stock, loading: false })
        return
      }

      // Foto yang sama sudah pernah diunduh
      const cached = cache.get(userId)
      if (cached && cached.fileId === fileId) {
        setState({ name, photoUrl: cached.url, loading: false })
        return
      }

      try {
        const { blob } = await fetchDriveFile(fileId)
        if (cancelled) return
        if (cached) URL.revokeObjectURL(cached.url)
        const url = URL.createObjectURL(blob)
        cache.set(userId, { fileId, url })
        setState({ name, photoUrl: url, loading: false })
      } catch {
        if (!cancelled) setState({ name, photoUrl: stock, loading: false }) // gagal -> foto bawaan
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, tick])

  return state
}