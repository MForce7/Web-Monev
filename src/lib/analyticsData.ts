import { supabase } from './supabase'
import type { LeaderboardData } from '../components/dashboard_2/leaderboard'
import type { DashboardData } from '../types/dashboard'

export async function fetchLeaderboardData(): Promise<LeaderboardData> {
  const { data, error } = await supabase.rpc('get_completion_leaderboard')
  if (error) throw new Error(error.message)

  return {
    'Status Kelengkapan Data': (data ?? []).map((row: { nama: string; pr: string; persen: number }) => ({
      nama: row.nama,
      PR: row.pr,
      persen: row.persen,
    })),
  }
}

export async function fetchTriwulanDashboardData(): Promise<DashboardData> {
  const { data, error } = await supabase.rpc('get_triwulan_dashboard')
  if (error) throw new Error(error.message)
  return data as DashboardData
}