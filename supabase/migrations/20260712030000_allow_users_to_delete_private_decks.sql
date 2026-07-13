drop policy if exists "Users can delete their own private decks" on public.decks;
create policy "Users can delete their own private decks"
on public.decks for delete
to authenticated
using (
  created_by_user_id = auth.uid()
  and visibility = 'private'
);
