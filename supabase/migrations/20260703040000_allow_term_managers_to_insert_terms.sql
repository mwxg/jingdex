drop policy if exists "Users can insert their own terms" on public.terms;
create policy "Users can insert their own terms"
on public.terms for insert
to authenticated
with check (
  added_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_terms')
);

notify pgrst, 'reload schema';
