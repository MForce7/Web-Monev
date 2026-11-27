create table public.rekappendanaan (
  id uuid primary key default gen_random_uuid(),
  skema text not null check (skema = any (array['PRIS'::text, 'RIIM'::text])),
  jenis text not null default '',
  ketua text not null,
  judul text not null,
  pusat_riset text not null,
  jangka_bulan integer check (jangka_bulan is null or jangka_bulan >= 1),
  dana jsonb not null default '[null, null, null]'::jsonb
    check (jsonb_typeof(dana) = 'array'),
  nomor_sk text not null default '',
  tanggal_sk text not null default '',
  status text not null default '',
  keterangan text not null default '',
  link text not null default '',
  link_label text not null default '',
  urutan integer not null default 0,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.rekappendanaan enable row level security;

grant select, insert, update, delete on public.rekappendanaan to authenticated;

create policy "Admins can manage rekap pendanaan"
  on public.rekappendanaan
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create or replace function public.sync_rekappendanaan(p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Data rekap pendanaan harus berupa array.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Hanya admin yang dapat mengubah rekap pendanaan.';
  end if;

  insert into public.rekappendanaan (
    id, skema, jenis, ketua, judul, pusat_riset, jangka_bulan, dana,
    nomor_sk, tanggal_sk, status, keterangan, link, link_label, urutan
  )
  select
    incoming.id, incoming.skema, incoming.jenis, incoming.ketua,
    incoming.judul, incoming.pusat_riset, incoming.jangka_bulan,
    incoming.dana, incoming.nomor_sk, incoming.tanggal_sk,
    incoming.status, incoming.keterangan, incoming.link,
    incoming.link_label, incoming.urutan
  from jsonb_to_recordset(p_rows) as incoming (
    id uuid,
    skema text,
    jenis text,
    ketua text,
    judul text,
    pusat_riset text,
    jangka_bulan integer,
    dana jsonb,
    nomor_sk text,
    tanggal_sk text,
    status text,
    keterangan text,
    link text,
    link_label text,
    urutan integer
  )
  on conflict (id) do update set
    skema = excluded.skema,
    jenis = excluded.jenis,
    ketua = excluded.ketua,
    judul = excluded.judul,
    pusat_riset = excluded.pusat_riset,
    jangka_bulan = excluded.jangka_bulan,
    dana = excluded.dana,
    nomor_sk = excluded.nomor_sk,
    tanggal_sk = excluded.tanggal_sk,
    status = excluded.status,
    keterangan = excluded.keterangan,
    link = excluded.link,
    link_label = excluded.link_label,
    urutan = excluded.urutan,
    updated_at = now();

  delete from public.rekappendanaan as existing_row
  where not exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming(id uuid)
    where incoming.id = existing_row.id
  );
end;
$$;

revoke all on function public.sync_rekappendanaan(jsonb) from public;
grant execute on function public.sync_rekappendanaan(jsonb) to authenticated;
