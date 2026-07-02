-- Jingdex learning schema.
--
-- This migration is designed to be safe to rerun during development:
-- it creates missing tables/types/functions/policies and adds missing columns
-- without dropping existing tables or deleting data.
--
-- For future schema changes after real data exists, prefer new incremental
-- migrations that use ALTER TABLE / backfills / constraint validation.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_user_role as enum (
    'member',
    'moderator',
    'admin',
    'developer'
  );
exception
  when duplicate_object then null;
end;
$$;

alter type public.app_user_role add value if not exists 'member';
alter type public.app_user_role add value if not exists 'moderator';
alter type public.app_user_role add value if not exists 'admin';
alter type public.app_user_role add value if not exists 'developer';

do $$
begin
  create type public.deck_visibility as enum (
    'private',
    'unlisted',
    'moderators',
    'community'
  );
exception
  when duplicate_object then null;
end;
$$;

alter type public.deck_visibility add value if not exists 'private';
alter type public.deck_visibility add value if not exists 'unlisted';
alter type public.deck_visibility add value if not exists 'moderators';
alter type public.deck_visibility add value if not exists 'community';

do $$
begin
  create type public.deck_publication_status as enum (
    'draft',
    'under_review',
    'approved',
    'rejected',
    'archived'
  );
exception
  when duplicate_object then null;
end;
$$;

alter type public.deck_publication_status add value if not exists 'draft';
alter type public.deck_publication_status add value if not exists 'under_review';
alter type public.deck_publication_status add value if not exists 'approved';
alter type public.deck_publication_status add value if not exists 'rejected';
alter type public.deck_publication_status add value if not exists 'archived';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text,
  role public.app_user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  simplified text not null,
  traditional text,
  pinyin text not null,
  english_definition text not null,
  short_definition text,
  part_of_speech text,
  notes text,
  source text,
  added_by text not null default 'Jingdex',
  added_by_user_id uuid references public.profiles(id) on delete set null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.term_examples (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete cascade,
  simplified_sentence text not null,
  traditional_sentence text,
  pinyin text,
  english_translation text not null,
  position integer not null default 0,
  added_by text not null default 'Jingdex',
  added_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by text not null default 'Jingdex',
  created_by_user_id uuid references public.profiles(id) on delete set null,
  visibility public.deck_visibility not null default 'private',
  publication_status public.deck_publication_status not null default 'draft',
  share_code text not null default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deck_terms (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_decks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists role public.app_user_role not null default 'member';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.terms add column if not exists simplified text;
alter table public.terms add column if not exists traditional text;
alter table public.terms add column if not exists pinyin text;
alter table public.terms add column if not exists english_definition text;
alter table public.terms add column if not exists short_definition text;
alter table public.terms add column if not exists part_of_speech text;
alter table public.terms add column if not exists notes text;
alter table public.terms add column if not exists source text;
alter table public.terms add column if not exists added_by text not null default 'Jingdex';
alter table public.terms add column if not exists added_by_user_id uuid references public.profiles(id) on delete set null;
alter table public.terms add column if not exists is_verified boolean not null default false;
alter table public.terms add column if not exists created_at timestamptz not null default now();
alter table public.terms add column if not exists updated_at timestamptz not null default now();

alter table public.term_examples add column if not exists term_id uuid references public.terms(id) on delete cascade;
alter table public.term_examples add column if not exists simplified_sentence text;
alter table public.term_examples add column if not exists traditional_sentence text;
alter table public.term_examples add column if not exists pinyin text;
alter table public.term_examples add column if not exists english_translation text;
alter table public.term_examples add column if not exists position integer not null default 0;
alter table public.term_examples add column if not exists added_by text not null default 'Jingdex';
alter table public.term_examples add column if not exists added_by_user_id uuid references public.profiles(id) on delete set null;
alter table public.term_examples add column if not exists created_at timestamptz not null default now();
alter table public.term_examples add column if not exists updated_at timestamptz not null default now();

alter table public.decks add column if not exists title text;
alter table public.decks add column if not exists description text;
alter table public.decks add column if not exists created_by text not null default 'Jingdex';
alter table public.decks add column if not exists created_by_user_id uuid references public.profiles(id) on delete set null;
alter table public.decks add column if not exists visibility public.deck_visibility not null default 'private';
alter table public.decks add column if not exists publication_status public.deck_publication_status not null default 'draft';
alter table public.decks add column if not exists share_code text not null default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
alter table public.decks add column if not exists submitted_at timestamptz;
alter table public.decks add column if not exists reviewed_at timestamptz;
alter table public.decks add column if not exists reviewed_by_user_id uuid references public.profiles(id) on delete set null;
alter table public.decks add column if not exists review_notes text;
alter table public.decks add column if not exists created_at timestamptz not null default now();
alter table public.decks add column if not exists updated_at timestamptz not null default now();

alter table public.deck_terms add column if not exists deck_id uuid references public.decks(id) on delete cascade;
alter table public.deck_terms add column if not exists term_id uuid references public.terms(id) on delete cascade;
alter table public.deck_terms add column if not exists position integer not null default 0;
alter table public.deck_terms add column if not exists created_at timestamptz not null default now();

alter table public.saved_decks add column if not exists saved_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_length'
  ) then
    alter table public.profiles
      add constraint profiles_username_length
      check (char_length(username) between 3 and 32);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username ~ '^[a-zA-Z0-9][a-zA-Z0-9_]*$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'terms_simplified_not_blank'
  ) then
    alter table public.terms
      add constraint terms_simplified_not_blank
      check (simplified is null or btrim(simplified) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'terms_pinyin_not_blank'
  ) then
    alter table public.terms
      add constraint terms_pinyin_not_blank
      check (pinyin is null or btrim(pinyin) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'terms_english_definition_not_blank'
  ) then
    alter table public.terms
      add constraint terms_english_definition_not_blank
      check (english_definition is null or btrim(english_definition) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'term_examples_simplified_not_blank'
  ) then
    alter table public.term_examples
      add constraint term_examples_simplified_not_blank
      check (simplified_sentence is null or btrim(simplified_sentence) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'term_examples_translation_not_blank'
  ) then
    alter table public.term_examples
      add constraint term_examples_translation_not_blank
      check (english_translation is null or btrim(english_translation) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'decks_title_not_blank'
  ) then
    alter table public.decks
      add constraint decks_title_not_blank
      check (title is null or btrim(title) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'decks_share_code_unique'
  ) then
    alter table public.decks
      add constraint decks_share_code_unique unique (share_code);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'decks_reviewed_together'
  ) then
    alter table public.decks
      add constraint decks_reviewed_together
      check (
        (reviewed_at is null and reviewed_by_user_id is null)
        or (reviewed_at is not null and reviewed_by_user_id is not null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'deck_terms_deck_term_unique'
  ) then
    alter table public.deck_terms
      add constraint deck_terms_deck_term_unique unique (deck_id, term_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'deck_terms_position_nonnegative'
  ) then
    alter table public.deck_terms
      add constraint deck_terms_position_nonnegative
      check (position >= 0);
  end if;
end;
$$;

alter table public.profiles drop constraint if exists profiles_username_key;
alter table public.profiles drop constraint if exists profiles_username_format;
drop index if exists public.profiles_username_key;

alter table public.profiles
  add constraint profiles_username_format
  check (
    username ~ '^[a-zA-Z0-9][a-zA-Z0-9_]*$'
    and lower(username) <> 'jingdex'
  );

create unique index if not exists profiles_username_lower_unique_idx
on public.profiles (lower(username));

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text in ('moderator', 'admin', 'developer')
  );
$$;

create or replace function public.prevent_unauthorized_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_moderator() then
    raise exception 'Only moderators and admins can change profile roles.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_unauthorized_term_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_verified is distinct from new.is_verified and not public.is_moderator() then
    raise exception 'Only moderators and admins can change term verification.';
  end if;

  return new;
end;
$$;

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

  if new.publication_status not in ('draft', 'under_review') then
    raise exception 'Only moderators and admins can approve, reject, or archive decks.';
  end if;

  return new;
end;
$$;

create or replace function public.can_read_term(term_id_to_check uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.terms t
    where t.id = term_id_to_check
      and (
        t.is_verified
        or t.added_by_user_id = auth.uid()
        or public.is_moderator()
        or exists (
          select 1
          from public.deck_terms dt
          join public.decks d on d.id = dt.deck_id
          where dt.term_id = t.id
            and d.visibility = 'community'
            and d.publication_status = 'approved'
        )
      )
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    'user_' || lower(substr(replace(new.id::text, '-', ''), 1, 12))
  );

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    requested_username,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    'member'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_prevent_unauthorized_role_change on public.profiles;
create trigger profiles_prevent_unauthorized_role_change
before update on public.profiles
for each row execute function public.prevent_unauthorized_profile_role_change();

drop trigger if exists terms_set_updated_at on public.terms;
create trigger terms_set_updated_at
before update on public.terms
for each row execute function public.set_updated_at();

drop trigger if exists terms_prevent_unauthorized_verification on public.terms;
create trigger terms_prevent_unauthorized_verification
before update on public.terms
for each row execute function public.prevent_unauthorized_term_verification();

drop trigger if exists term_examples_set_updated_at on public.term_examples;
create trigger term_examples_set_updated_at
before update on public.term_examples
for each row execute function public.set_updated_at();

drop trigger if exists decks_set_updated_at on public.decks;
create trigger decks_set_updated_at
before update on public.decks
for each row execute function public.set_updated_at();

drop trigger if exists decks_prevent_unauthorized_moderation on public.decks;
create trigger decks_prevent_unauthorized_moderation
before update on public.decks
for each row execute function public.prevent_unauthorized_deck_moderation();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index if not exists terms_simplified_idx on public.terms (simplified);
create index if not exists terms_traditional_idx on public.terms (traditional);
create index if not exists terms_pinyin_idx on public.terms (pinyin);
create index if not exists terms_added_by_user_id_idx on public.terms (added_by_user_id);
create index if not exists term_examples_term_id_position_idx on public.term_examples (term_id, position);
create index if not exists decks_created_by_user_id_idx on public.decks (created_by_user_id);
create index if not exists decks_visibility_status_idx on public.decks (visibility, publication_status);
create index if not exists decks_share_code_idx on public.decks (share_code);
create index if not exists deck_terms_deck_id_position_idx on public.deck_terms (deck_id, position);
create index if not exists deck_terms_term_id_idx on public.deck_terms (term_id);

alter table public.profiles enable row level security;
alter table public.terms enable row level security;
alter table public.term_examples enable row level security;
alter table public.decks enable row level security;
alter table public.deck_terms enable row level security;
alter table public.saved_decks enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
on public.profiles for select
using (true);

drop policy if exists "Users can insert their own member profile" on public.profiles;
create policy "Users can insert their own member profile"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and role::text = 'member'
);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Readable terms are selectable" on public.terms;
create policy "Readable terms are selectable"
on public.terms for select
using (public.can_read_term(id));

drop policy if exists "Users can insert their own terms" on public.terms;
create policy "Users can insert their own terms"
on public.terms for insert
to authenticated
with check (added_by_user_id = auth.uid());

drop policy if exists "Users can update their own terms" on public.terms;
create policy "Users can update their own terms"
on public.terms for update
to authenticated
using (added_by_user_id = auth.uid() or public.is_moderator())
with check (added_by_user_id = auth.uid() or public.is_moderator());

drop policy if exists "Readable examples are selectable" on public.term_examples;
create policy "Readable examples are selectable"
on public.term_examples for select
using (public.can_read_term(term_id));

drop policy if exists "Users can insert examples for their own terms" on public.term_examples;
create policy "Users can insert examples for their own terms"
on public.term_examples for insert
to authenticated
with check (
  added_by_user_id = auth.uid()
  and exists (
    select 1
    from public.terms
    where id = term_id
      and added_by_user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own examples" on public.term_examples;
create policy "Users can update their own examples"
on public.term_examples for update
to authenticated
using (added_by_user_id = auth.uid() or public.is_moderator())
with check (added_by_user_id = auth.uid() or public.is_moderator());

drop policy if exists "Community approved decks are publicly readable" on public.decks;
create policy "Community approved decks are publicly readable"
on public.decks for select
using (
  visibility = 'community'
  and publication_status = 'approved'
);

drop policy if exists "Creators and moderators can read non-public decks" on public.decks;
create policy "Creators and moderators can read non-public decks"
on public.decks for select
to authenticated
using (
  created_by_user_id = auth.uid()
  or public.is_moderator()
);

drop policy if exists "Users can insert their own decks" on public.decks;
create policy "Users can insert their own decks"
on public.decks for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and publication_status in ('draft', 'under_review')
  and reviewed_at is null
  and reviewed_by_user_id is null
  and review_notes is null
);

drop policy if exists "Users can update their own decks" on public.decks;
create policy "Users can update their own decks"
on public.decks for update
to authenticated
using (created_by_user_id = auth.uid() or public.is_moderator())
with check (created_by_user_id = auth.uid() or public.is_moderator());

drop policy if exists "Deck term rows are readable for readable decks" on public.deck_terms;
create policy "Deck term rows are readable for readable decks"
on public.deck_terms for select
using (
  exists (
    select 1
    from public.decks d
    where d.id = deck_id
      and d.visibility = 'community'
      and d.publication_status = 'approved'
  )
);

drop policy if exists "Creators and moderators can read deck term rows" on public.deck_terms;
create policy "Creators and moderators can read deck term rows"
on public.deck_terms for select
to authenticated
using (
  exists (
    select 1
    from public.decks d
    where d.id = deck_id
      and (
        d.created_by_user_id = auth.uid()
        or public.is_moderator()
      )
  )
);

drop policy if exists "Creators and moderators can manage deck term rows" on public.deck_terms;
create policy "Creators and moderators can manage deck term rows"
on public.deck_terms for all
to authenticated
using (
  exists (
    select 1
    from public.decks d
    where d.id = deck_id
      and (
        d.created_by_user_id = auth.uid()
        or public.is_moderator()
      )
  )
)
with check (
  exists (
    select 1
    from public.decks d
    where d.id = deck_id
      and (
        d.created_by_user_id = auth.uid()
        or public.is_moderator()
      )
  )
);

drop policy if exists "Users can read their own saved decks" on public.saved_decks;
create policy "Users can read their own saved decks"
on public.saved_decks for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can save decks for themselves" on public.saved_decks;
create policy "Users can save decks for themselves"
on public.saved_decks for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.decks d
    where d.id = deck_id
      and d.visibility = 'community'
      and d.publication_status = 'approved'
  )
);

drop policy if exists "Users can unsave their own decks" on public.saved_decks;
create policy "Users can unsave their own decks"
on public.saved_decks for delete
to authenticated
using (user_id = auth.uid());
