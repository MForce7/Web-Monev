create policy "support_files_insert_own_or_admin"
  on public.support_files
  for insert
  to authenticated
  with check (
    public.owns_report(monthly_report_id)
    or public.is_admin()
  );
