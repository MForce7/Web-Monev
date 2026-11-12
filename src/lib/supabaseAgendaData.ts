import { supabase } from './supabase'
import type { Agenda } from '../components/dashboard_2/calendarbox'

interface AgendaRow {
  id: string
  tanggal: string
  waktu: string
  nama: string
  tempat: string
  zoom_link: string
  deskripsi: string
}

function toAgenda(row: AgendaRow): Agenda {
  return {
    id: row.id,
    date: row.tanggal,
    time: row.waktu.slice(0, 5), // "09:30:00" -> "09:30"
    name: row.nama,
    place: row.tempat,
    zoomLink: row.zoom_link,
    description: row.deskripsi,
  }
}

export async function fetchAgendas(): Promise<Agenda[]> {
  const { data, error } = await supabase
    .from('agendas')
    .select('id, tanggal, waktu, nama, tempat, zoom_link, deskripsi')
    .order('tanggal', { ascending: true })
    .order('waktu', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(toAgenda)
}

export async function createAgenda(input: Omit<Agenda, 'id'>): Promise<Agenda> {
  const { data, error } = await supabase
    .from('agendas')
    .insert({
      tanggal: input.date,
      waktu: input.time,
      nama: input.name,
      tempat: input.place,
      zoom_link: input.zoomLink,
      deskripsi: input.description,
    })
    .select('id, tanggal, waktu, nama, tempat, zoom_link, deskripsi')
    .single()

  if (error) throw new Error(error.message)
  return toAgenda(data)
}

export async function updateAgenda(id: string, patch: Omit<Agenda, 'id' | 'date' | 'time'>): Promise<Agenda> {
  const { data, error } = await supabase
    .from('agendas')
    .update({
      nama: patch.name,
      tempat: patch.place,
      zoom_link: patch.zoomLink,
      deskripsi: patch.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, tanggal, waktu, nama, tempat, zoom_link, deskripsi')
    .single()

  if (error) throw new Error(error.message)
  return toAgenda(data)
}

export async function deleteAgenda(id: string): Promise<void> {
  const { error } = await supabase.from('agendas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}