create or replace function public.app_role_has_permission(
  role_to_check public.app_user_role,
  permission_to_check text
)
returns boolean
language sql
stable
as $$
  select case role_to_check::text
    when 'moderator' then permission_to_check in (
      'access_moderation_page',
      'search_users'
    )
    when 'admin' then permission_to_check in (
      'access_moderation_page',
      'search_users',
      'manage_community_decks',
      'manage_terms',
      'manage_moderator_role'
    )
    when 'developer' then permission_to_check in (
      'access_moderation_page',
      'search_users',
      'manage_community_decks',
      'manage_terms',
      'manage_moderator_role',
      'manage_admin_role'
    )
    else false
  end;
$$;

create or replace function public.current_user_has_app_permission(permission_to_check text)
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
      and public.app_role_has_permission(role, permission_to_check)
  );
$$;

create or replace function public.can_update_app_user_role(
  actor_role public.app_user_role,
  existing_target_role public.app_user_role,
  new_target_role public.app_user_role
)
returns boolean
language sql
stable
as $$
  select case
    when existing_target_role::text in ('member', 'moderator')
      and new_target_role::text in ('member', 'moderator') then
      public.app_role_has_permission(actor_role, 'manage_moderator_role')
    when existing_target_role::text in ('member', 'moderator', 'admin')
      and new_target_role::text in ('member', 'moderator', 'admin') then
      public.app_role_has_permission(actor_role, 'manage_admin_role')
    else false
  end;
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_app_permission('search_users');
$$;

create or replace function public.prevent_unauthorized_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.app_user_role;
begin
  if old.role is not distinct from new.role then
    return new;
  end if;

  if old.id = auth.uid() then
    raise exception 'You cannot edit your own role.';
  end if;

  select role
  into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role is null
    or not public.can_update_app_user_role(actor_role, old.role, new.role) then
    raise exception 'You do not have access to edit that role.';
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
  if old.is_verified is distinct from new.is_verified
    and not public.current_user_has_app_permission('manage_terms') then
    raise exception 'Only admins and developers can change term verification.';
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
  if public.current_user_has_app_permission('manage_community_decks') then
    return new;
  end if;

  if old.created_by_user_id is distinct from new.created_by_user_id then
    raise exception 'Deck ownership cannot be changed.';
  end if;

  if old.reviewed_at is distinct from new.reviewed_at
    or old.reviewed_by_user_id is distinct from new.reviewed_by_user_id
    or old.review_notes is distinct from new.review_notes then
    raise exception 'Only admins and developers can change deck review fields.';
  end if;

  if new.publication_status not in ('draft', 'under_review') then
    raise exception 'Only admins and developers can approve, reject, or archive decks.';
  end if;

  if new.visibility = 'community' and old.visibility is distinct from new.visibility then
    raise exception 'Only admins and developers can create community decks.';
  end if;

  return new;
end;
$$;

create or replace function public.search_users_for_moderation(
  search_query text default '',
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  email text,
  username text,
  role public.app_user_role,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_query text;
  safe_page_size integer;
  safe_page_offset integer;
begin
  if not public.current_user_has_app_permission('search_users') then
    raise exception 'Only moderators, admins, and developers can search users.';
  end if;

  normalized_query := btrim(coalesce(search_query, ''));
  safe_page_size := least(greatest(coalesce(page_size, 20), 1), 20);
  safe_page_offset := greatest(coalesce(page_offset, 0), 0);

  return query
    select
      p.id,
      u.email::text,
      p.username,
      p.role,
      p.created_at,
      count(*) over () as total_count
    from public.profiles p
    join auth.users u on u.id = p.id
    where
      normalized_query = ''
      or p.username ilike '%' || normalized_query || '%'
      or u.email ilike '%' || normalized_query || '%'
    order by lower(p.username), p.username
    limit safe_page_size
    offset safe_page_offset;
end;
$$;

create or replace function public.update_user_role_for_moderation(
  target_user_id uuid,
  target_role public.app_user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.app_user_role;
  existing_target_role public.app_user_role;
begin
  select role
  into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role is null then
    raise exception 'Sign in again before editing roles.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot edit your own role.';
  end if;

  select role
  into existing_target_role
  from public.profiles
  where id = target_user_id;

  if existing_target_role is null then
    raise exception 'User not found.';
  end if;

  if not public.can_update_app_user_role(
    actor_role,
    existing_target_role,
    target_role
  ) then
    raise exception 'You do not have access to edit that role.';
  end if;

  update public.profiles
  set role = target_role
  where id = target_user_id;
end;
$$;

drop policy if exists "Users can update their own terms" on public.terms;
create policy "Users can update their own terms"
on public.terms for update
to authenticated
using (
  added_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_terms')
)
with check (
  added_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_terms')
);

drop policy if exists "Admins and developers can delete terms" on public.terms;
create policy "Admins and developers can delete terms"
on public.terms for delete
to authenticated
using (public.current_user_has_app_permission('manage_terms'));

drop policy if exists "Users can update their own examples" on public.term_examples;
create policy "Users can update their own examples"
on public.term_examples for update
to authenticated
using (
  added_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_terms')
)
with check (
  added_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_terms')
);

drop policy if exists "Admins and developers can delete examples" on public.term_examples;
create policy "Admins and developers can delete examples"
on public.term_examples for delete
to authenticated
using (public.current_user_has_app_permission('manage_terms'));

drop policy if exists "Creators and moderators can read non-public decks" on public.decks;
create policy "Creators and admins can read non-public decks"
on public.decks for select
to authenticated
using (
  created_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_community_decks')
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
  and (
    visibility <> 'community'
    or public.current_user_has_app_permission('manage_community_decks')
  )
);

drop policy if exists "Users can update their own decks" on public.decks;
create policy "Users can update their own decks"
on public.decks for update
to authenticated
using (
  created_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_community_decks')
)
with check (
  created_by_user_id = auth.uid()
  or public.current_user_has_app_permission('manage_community_decks')
);

drop policy if exists "Admins and developers can delete community decks" on public.decks;
create policy "Admins and developers can delete community decks"
on public.decks for delete
to authenticated
using (
  visibility = 'community'
  and public.current_user_has_app_permission('manage_community_decks')
);

drop policy if exists "Creators and moderators can read deck term rows" on public.deck_terms;
create policy "Creators and admins can read deck term rows"
on public.deck_terms for select
to authenticated
using (
  exists (
    select 1
    from public.decks d
    where d.id = deck_id
      and (
        d.created_by_user_id = auth.uid()
        or public.current_user_has_app_permission('manage_community_decks')
      )
  )
);

drop policy if exists "Creators and moderators can manage deck term rows" on public.deck_terms;
create policy "Creators and admins can manage deck term rows"
on public.deck_terms for all
to authenticated
using (
  exists (
    select 1
    from public.decks d
    where d.id = deck_id
      and (
        d.created_by_user_id = auth.uid()
        or public.current_user_has_app_permission('manage_community_decks')
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
        or public.current_user_has_app_permission('manage_community_decks')
      )
  )
);

revoke all on function public.search_users_for_moderation(text, integer, integer) from public;
grant execute on function public.search_users_for_moderation(text, integer, integer) to authenticated;

revoke all on function public.update_user_role_for_moderation(uuid, public.app_user_role) from public;
grant execute on function public.update_user_role_for_moderation(uuid, public.app_user_role) to authenticated;

notify pgrst, 'reload schema';
