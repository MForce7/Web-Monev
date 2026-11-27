create table if not exists public.monthly_report_outputs (
  id uuid primary key default gen_random_uuid(),
  monthly_report_id uuid not null
    references public.monthly_reports(id) on delete cascade,
  urutan smallint not null default 0,
  jenis text not null default '',
  judul text not null default '',
  status text not null default '',
  capaian numeric not null default 0
    check (capaian >= 0 and capaian <= 100),
  keterangan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_report_outputs_report_order_key
    unique (monthly_report_id, urutan)
);

alter table public.support_files
  add column if not exists monthly_report_output_id uuid
    references public.monthly_report_outputs(id) on delete cascade;

create index if not exists monthly_report_outputs_report_id_idx
  on public.monthly_report_outputs(monthly_report_id);

create index if not exists support_files_monthly_report_output_id_idx
  on public.support_files(monthly_report_output_id);

insert into public.monthly_report_outputs (
  monthly_report_id,
  urutan,
  jenis,
  judul,
  status,
  capaian
)
select
  mr.id,
  0,
  mr.output_jenis,
  mr.output_judul,
  mr.output_status,
  mr.output_capaian
from public.monthly_reports mr
where (
  coalesce(mr.output_jenis, '') <> ''
  or coalesce(mr.output_judul, '') <> ''
  or coalesce(mr.output_status, '') not in ('', 'Belum Mulai')
  or coalesce(mr.output_capaian, 0) > 0
)
and not exists (
  select 1
  from public.monthly_report_outputs existing
  where existing.monthly_report_id = mr.id
);

update public.support_files sf
set monthly_report_output_id = output.id
from public.monthly_report_outputs output
where sf.monthly_report_id = output.monthly_report_id
  and output.urutan = 0
  and sf.kategori = 'output'
  and sf.monthly_report_output_id is null;

alter table public.monthly_report_outputs enable row level security;

create policy "Monthly report outputs: view own or admin"
  on public.monthly_report_outputs
  for select
  using (public.owns_report(monthly_report_id) or public.is_admin());

create policy "Monthly report outputs: manage own or admin"
  on public.monthly_report_outputs
  for all
  using (public.owns_report(monthly_report_id) or public.is_admin())
  with check (public.owns_report(monthly_report_id) or public.is_admin());
