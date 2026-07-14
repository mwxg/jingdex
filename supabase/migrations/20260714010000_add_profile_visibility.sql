alter table public.profiles
add column if not exists is_public boolean not null default true;

create table if not exists public.profile_bios (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  updated_at timestamptz not null default now(),
  constraint profile_bios_bio_length
    check (bio is null or char_length(bio) <= 240)
);

insert into public.profile_bios (user_id, bio)
select id, bio
from public.profiles
where bio is not null
on conflict (user_id) do update set bio = excluded.bio;

alter table public.profiles
drop constraint if exists profiles_bio_length;

alter table public.profiles
drop column if exists bio;

create or replace function public.prevent_unauthorized_deck_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_moderator() then
    return new;
  end if;

  if old.created_by_user_id is distinct from new.created_by_user_id then
    raise exception 'Deck ownership cannot be changed.';
  end if;

  if old.reviewed_at is distinct from new.reviewed_at
    or old.reviewed_by_user_id is distinct from new.reviewed_by_user_id
    or old.review_notes is distinct from new.review_notes then
    raise exception 'Only moderators and admins can change deck review fields.';
  end if;

  if old.created_by is distinct from new.created_by
    and new.created_by = (
      select username from public.profiles where id = new.created_by_user_id
    )
    and old.title is not distinct from new.title
    and old.description is not distinct from new.description
    and old.visibility is not distinct from new.visibility
    and old.publication_status is not distinct from new.publication_status
    and old.share_code is not distinct from new.share_code
    and old.submitted_at is not distinct from new.submitted_at then
    return new;
  end if;

  if new.publication_status not in ('draft', 'under_review') then
    raise exception 'Only moderators and admins can approve, reject, or archive decks.';
  end if;

  return new;
end;
$$;

create or replace function public.sync_profile_username_attributions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.decks
  set created_by = new.username
  where created_by_user_id = new.id
    and created_by is distinct from new.username;

  update public.terms
  set added_by = new.username
  where added_by_user_id = new.id
    and added_by is distinct from new.username;

  return new;
end;
$$;

drop trigger if exists profiles_sync_username_attributions on public.profiles;
create trigger profiles_sync_username_attributions
after update of username on public.profiles
for each row
when (old.username is distinct from new.username)
execute function public.sync_profile_username_attributions();

update public.decks
set created_by = profiles.username
from public.profiles
where decks.created_by_user_id = profiles.id
  and decks.created_by is distinct from profiles.username;

update public.terms
set added_by = profiles.username
from public.profiles
where terms.added_by_user_id = profiles.id
  and terms.added_by is distinct from profiles.username;

drop trigger if exists profile_bios_set_updated_at on public.profile_bios;
create trigger profile_bios_set_updated_at
before update on public.profile_bios
for each row execute function public.set_updated_at();

alter table public.profile_bios enable row level security;

drop policy if exists "Visible profile bios are readable" on public.profile_bios;
create policy "Visible profile bios are readable"
on public.profile_bios for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = profile_bios.user_id
      and profiles.is_public
  )
);

drop policy if exists "Users can insert their own profile bio" on public.profile_bios;
create policy "Users can insert their own profile bio"
on public.profile_bios for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own profile bio" on public.profile_bios;
create policy "Users can update their own profile bio"
on public.profile_bios for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

notify pgrst, 'reload schema';
