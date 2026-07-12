create table if not exists public.jingdex_decks (
  deck_id uuid primary key references public.decks(id) on delete cascade,
  registered_at timestamptz not null default now()
);

alter table public.jingdex_decks enable row level security;

drop policy if exists "Anyone can read Jingdex deck IDs" on public.jingdex_decks;
create policy "Anyone can read Jingdex deck IDs"
on public.jingdex_decks for select
using (true);

drop policy if exists "Admins and developers can register Jingdex decks" on public.jingdex_decks;
create policy "Admins and developers can register Jingdex decks"
on public.jingdex_decks for insert
to authenticated
with check (public.current_user_has_app_permission('manage_community_decks'));

drop policy if exists "Admins and developers can unregister Jingdex decks" on public.jingdex_decks;
create policy "Admins and developers can unregister Jingdex decks"
on public.jingdex_decks for delete
to authenticated
using (public.current_user_has_app_permission('manage_community_decks'));

notify pgrst, 'reload schema';
