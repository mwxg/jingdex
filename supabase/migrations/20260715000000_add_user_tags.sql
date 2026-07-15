begin;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text,
  style_key text not null default 'neutral',
  parent_tag_id uuid references public.tags(id) on delete restrict,
  display_order integer not null default 0,
  is_automatic boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tags_label_length check (char_length(btrim(label)) between 1 and 40),
  constraint tags_description_length check (description is null or char_length(description) <= 240),
  constraint tags_style_key check (
    style_key in ('neutral', 'moderator', 'admin', 'developer', 'contributor', 'supporter')
  ),
  constraint tags_not_own_parent check (parent_tag_id is null or parent_tag_id <> id)
);

create unique index if not exists tags_root_display_order_idx
on public.tags (display_order)
where parent_tag_id is null;

create unique index if not exists tags_child_display_order_idx
on public.tags (parent_tag_id, display_order)
where parent_tag_id is not null;

create table if not exists public.user_tag_assignments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  source text not null default 'manual',
  assigned_by_user_id uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, tag_id),
  constraint user_tag_assignments_source check (source in ('automatic', 'manual')),
  constraint user_tag_assignments_source_actor check (
    (source = 'automatic' and assigned_by_user_id is null)
    or (source = 'manual' and assigned_by_user_id is not null)
  )
);

create index if not exists user_tag_assignments_tag_id_idx
on public.user_tag_assignments (tag_id, user_id);

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

alter table public.tags enable row level security;
alter table public.user_tag_assignments enable row level security;

drop policy if exists "Active tags are readable by everyone" on public.tags;
create policy "Active tags are readable by everyone"
on public.tags for select
using (is_active);

drop policy if exists "Tag assignments are readable by everyone" on public.user_tag_assignments;
create policy "Tag assignments are readable by everyone"
on public.user_tag_assignments for select
using (true);

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
      'access_moderation_page', 'search_users'
    )
    when 'admin' then permission_to_check in (
      'access_moderation_page', 'search_users', 'manage_community_decks',
      'review_term_submissions', 'manage_terms', 'manage_moderator_role'
    )
    when 'developer' then permission_to_check in (
      'access_moderation_page', 'search_users', 'manage_community_decks',
      'review_term_submissions', 'manage_terms', 'manage_moderator_role',
      'manage_admin_role', 'manage_user_tags'
    )
    else false
  end;
$$;

insert into public.tags (
  slug, label, description, style_key, display_order, is_automatic
) values
  ('developer', 'Developer', 'Builds and maintains Jingdex.', 'developer', 10, true),
  ('admin', 'Admin', 'Helps administer Jingdex.', 'admin', 20, true),
  ('moderator', 'Moderator', 'Helps keep the Jingdex community welcoming.', 'moderator', 30, true),
  ('contributor', 'Contributor', 'Has an accepted word or community deck.', 'contributor', 40, true),
  ('supporter', 'Supporter', 'Supports Jingdex.', 'supporter', 50, false)
on conflict (slug) do update set
  label = excluded.label,
  description = excluded.description,
  style_key = excluded.style_key,
  display_order = excluded.display_order,
  is_automatic = excluded.is_automatic,
  is_active = true;

create or replace function public.reconcile_user_automatic_tags(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role public.app_user_role;
  role_tag_id uuid;
  contributor_tag_id uuid;
  is_contributor boolean;
begin
  if target_user_id is null then
    return;
  end if;

  select role into target_role
  from public.profiles
  where id = target_user_id;

  if target_role is null then
    return;
  end if;

  delete from public.user_tag_assignments as assignments
  using public.tags as tags
  where assignments.user_id = target_user_id
    and assignments.tag_id = tags.id
    and assignments.source = 'automatic'
    and tags.slug in ('developer', 'admin', 'moderator')
    and tags.slug <> target_role::text;

  select id into role_tag_id
  from public.tags
  where slug = target_role::text
    and is_active;

  if role_tag_id is not null then
    insert into public.user_tag_assignments (user_id, tag_id, source)
    values (target_user_id, role_tag_id, 'automatic')
    on conflict (user_id, tag_id) do nothing;
  end if;

  select exists (
    select 1
    from public.term_submissions
    where submitted_by_user_id = target_user_id
      and status = 'accepted'
  ) or exists (
    select 1
    from public.decks
    where created_by_user_id = target_user_id
      and visibility = 'community'
      and publication_status = 'approved'
  ) into is_contributor;

  select id into contributor_tag_id
  from public.tags
  where slug = 'contributor'
    and is_active;

  if is_contributor and contributor_tag_id is not null then
    insert into public.user_tag_assignments (user_id, tag_id, source)
    values (target_user_id, contributor_tag_id, 'automatic')
    on conflict (user_id, tag_id) do nothing;
  elsif contributor_tag_id is not null then
    delete from public.user_tag_assignments
    where user_id = target_user_id
      and tag_id = contributor_tag_id
      and source = 'automatic';
  end if;
end;
$$;

create or replace function public.reconcile_profile_role_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.role is distinct from new.role then
    perform public.reconcile_user_automatic_tags(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_reconcile_role_tag on public.profiles;
create trigger profiles_reconcile_role_tag
after insert or update of role on public.profiles
for each row execute function public.reconcile_profile_role_tag();

create or replace function public.reconcile_term_submitter_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    perform public.reconcile_user_automatic_tags(new.submitted_by_user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists term_submissions_reconcile_contributor_tag on public.term_submissions;
create trigger term_submissions_reconcile_contributor_tag
after update of status on public.term_submissions
for each row execute function public.reconcile_term_submitter_tag();

create or replace function public.reconcile_deck_creator_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.reconcile_user_automatic_tags(old.created_by_user_id);
    return old;
  end if;

  if old.publication_status is distinct from new.publication_status
    or old.visibility is distinct from new.visibility
    or old.created_by_user_id is distinct from new.created_by_user_id then
    perform public.reconcile_user_automatic_tags(new.created_by_user_id);
    if old.created_by_user_id is distinct from new.created_by_user_id then
      perform public.reconcile_user_automatic_tags(old.created_by_user_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists decks_reconcile_contributor_tag on public.decks;
create trigger decks_reconcile_contributor_tag
after update of publication_status, visibility, created_by_user_id or delete on public.decks
for each row execute function public.reconcile_deck_creator_tag();

create or replace function public.get_profile_tags(target_user_id uuid)
returns table (
  id uuid,
  slug text,
  label text,
  description text,
  style_key text,
  is_automatic boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with recursive tag_tree as (
    select tags.id, array[tags.display_order, 0] as order_path
    from public.tags as tags
    where tags.parent_tag_id is null
      and tags.is_active
    union all
    select child.id, parent.order_path || array[child.display_order, 0]
    from public.tags as child
    join tag_tree as parent on parent.id = child.parent_tag_id
    where child.is_active
  )
  select tags.id, tags.slug, tags.label, tags.description, tags.style_key,
    tags.is_automatic
  from tag_tree
  join public.tags as tags on tags.id = tag_tree.id
  join public.user_tag_assignments as assignments on assignments.tag_id = tags.id
  where assignments.user_id = target_user_id
  order by tag_tree.order_path, tags.label;
$$;

create or replace function public.get_user_tags_for_management(target_user_id uuid)
returns table (
  id uuid,
  slug text,
  label text,
  description text,
  style_key text,
  is_automatic boolean,
  is_assigned boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can manage user tags.';
  end if;

  if not exists (select 1 from public.profiles where profiles.id = target_user_id) then
    raise exception 'User not found.';
  end if;

  return query
  with recursive tag_tree as (
    select tags.id, array[tags.display_order, 0] as order_path
    from public.tags as tags
    where tags.parent_tag_id is null
      and tags.is_active
    union all
    select child.id, parent.order_path || array[child.display_order, 0]
    from public.tags as child
    join tag_tree as parent on parent.id = child.parent_tag_id
    where child.is_active
  )
  select tags.id, tags.slug, tags.label, tags.description, tags.style_key,
    tags.is_automatic,
    exists (
      select 1 from public.user_tag_assignments as assignments
      where assignments.user_id = target_user_id
        and assignments.tag_id = tags.id
    ) as is_assigned
  from tag_tree
  join public.tags as tags on tags.id = tag_tree.id
  order by tag_tree.order_path, tags.label;
end;
$$;

create or replace function public.set_user_tag_for_management(
  target_user_id uuid,
  target_tag_id uuid,
  should_assign boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can manage user tags.';
  end if;

  if not exists (select 1 from public.profiles where profiles.id = target_user_id) then
    raise exception 'User not found.';
  end if;

  if not exists (select 1 from public.tags where tags.id = target_tag_id and is_active) then
    raise exception 'Tag not found.';
  end if;

  if should_assign then
    insert into public.user_tag_assignments (
      user_id, tag_id, source, assigned_by_user_id, assigned_at
    ) values (
      target_user_id, target_tag_id, 'manual', auth.uid(), now()
    )
    on conflict (user_id, tag_id) do update set
      source = 'manual',
      assigned_by_user_id = auth.uid(),
      assigned_at = now();
  else
    delete from public.user_tag_assignments
    where user_id = target_user_id
      and tag_id = target_tag_id;
  end if;
end;
$$;

select public.reconcile_user_automatic_tags(id)
from public.profiles;

revoke all on function public.reconcile_user_automatic_tags(uuid) from public;
revoke all on function public.get_profile_tags(uuid) from public;
grant execute on function public.get_profile_tags(uuid) to authenticated;
revoke all on function public.get_user_tags_for_management(uuid) from public;
grant execute on function public.get_user_tags_for_management(uuid) to authenticated;
revoke all on function public.set_user_tag_for_management(uuid, uuid, boolean) from public;
grant execute on function public.set_user_tag_for_management(uuid, uuid, boolean) to authenticated;

commit;

notify pgrst, 'reload schema';
