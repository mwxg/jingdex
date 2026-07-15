begin;

create table public.tag_styles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  light_color text not null,
  dark_color text not null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tag_styles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tag_styles_slug_length check (char_length(slug) between 1 and 60),
  constraint tag_styles_label_length check (char_length(btrim(label)) between 1 and 40),
  constraint tag_styles_light_color_format check (light_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint tag_styles_dark_color_format check (dark_color ~ '^#[0-9A-Fa-f]{6}$')
);

create trigger tag_styles_set_updated_at
before update on public.tag_styles
for each row execute function public.set_updated_at();

alter table public.tag_styles enable row level security;

create policy "Active tag styles are readable by everyone"
on public.tag_styles for select
using (is_active);

insert into public.tag_styles (
  slug, label, light_color, dark_color, is_system
) values
  ('neutral', 'Neutral', '#4f5b4d', '#aab4a8', true),
  ('moderator', 'Moderator', '#0067bc', '#58a9e8', true),
  ('admin', 'Admin', '#b600bc', '#d56cdb', true),
  ('developer', 'Developer', '#770000', '#e47777', true),
  ('contributor', 'Contributor', '#14734b', '#62d39a', true),
  ('supporter', 'Supporter', '#805500', '#f1bd55', true);

alter table public.tags
add column style_id uuid references public.tag_styles(id) on delete restrict;

update public.tags as tags
set style_id = styles.id
from public.tag_styles as styles
where styles.slug = tags.style_key;

update public.tags
set style_id = (select id from public.tag_styles where slug = 'neutral')
where style_id is null;

alter table public.tags alter column style_id set not null;

-- Preserve the hierarchy's current visual order before removing nesting.
drop index if exists public.tags_root_display_order_idx;
drop index if exists public.tags_child_display_order_idx;

with recursive tag_tree as (
  select tags.id, array[tags.display_order, 0] as order_path
  from public.tags as tags
  where tags.parent_tag_id is null
  union all
  select child.id, parent.order_path || array[child.display_order, 0]
  from public.tags as child
  join tag_tree as parent on parent.id = child.parent_tag_id
), ordered_tags as (
  select id, row_number() over (order by order_path, id)::integer * 10 as new_order
  from tag_tree
)
update public.tags as tags
set display_order = ordered_tags.new_order
from ordered_tags
where tags.id = ordered_tags.id;

alter table public.tags drop constraint if exists tags_style_key;
alter table public.tags drop constraint if exists tags_not_own_parent;
alter table public.tags drop column style_key;
alter table public.tags drop column parent_tag_id;

create index tags_display_order_idx on public.tags (display_order, label);

drop function if exists public.get_profile_tags(uuid);
drop function if exists public.get_user_tags_for_management(uuid);
drop function if exists public.get_tag_catalog_for_management();
drop function if exists public.create_manual_tag_for_management(text, text, text, text, uuid, integer);

create function public.get_profile_tags(target_user_id uuid)
returns table (
  id uuid,
  slug text,
  label text,
  description text,
  style_id uuid,
  style_slug text,
  style_label text,
  light_color text,
  dark_color text,
  is_automatic boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    tags.id,
    tags.slug,
    tags.label,
    tags.description,
    styles.id,
    styles.slug,
    styles.label,
    styles.light_color,
    styles.dark_color,
    tags.is_automatic
  from public.tags as tags
  join public.tag_styles as styles on styles.id = tags.style_id
  join public.user_tag_assignments as assignments on assignments.tag_id = tags.id
  where assignments.user_id = target_user_id
    and tags.is_active
    and styles.is_active
  order by tags.display_order, tags.label;
$$;

create function public.get_user_tags_for_management(target_user_id uuid)
returns table (
  id uuid,
  slug text,
  label text,
  description text,
  style_id uuid,
  style_slug text,
  style_label text,
  light_color text,
  dark_color text,
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
  select
    tags.id,
    tags.slug,
    tags.label,
    tags.description,
    styles.id,
    styles.slug,
    styles.label,
    styles.light_color,
    styles.dark_color,
    tags.is_automatic,
    exists (
      select 1 from public.user_tag_assignments as assignments
      where assignments.user_id = target_user_id
        and assignments.tag_id = tags.id
    )
  from public.tags as tags
  join public.tag_styles as styles on styles.id = tags.style_id
  where tags.is_active
    and styles.is_active
  order by tags.display_order, tags.label;
end;
$$;

create function public.get_tag_catalog_for_management()
returns table (
  id uuid,
  slug text,
  label text,
  description text,
  style_id uuid,
  style_slug text,
  style_label text,
  light_color text,
  dark_color text,
  display_order integer,
  is_automatic boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can manage tags.';
  end if;

  return query
  select
    tags.id,
    tags.slug,
    tags.label,
    tags.description,
    styles.id,
    styles.slug,
    styles.label,
    styles.light_color,
    styles.dark_color,
    tags.display_order,
    tags.is_automatic
  from public.tags as tags
  join public.tag_styles as styles on styles.id = tags.style_id
  where tags.is_active
    and styles.is_active
  order by tags.display_order, tags.label;
end;
$$;

create function public.get_tag_styles_for_management()
returns table (
  id uuid,
  slug text,
  label text,
  light_color text,
  dark_color text,
  is_system boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can manage tag styles.';
  end if;

  return query
  select styles.id, styles.slug, styles.label, styles.light_color,
    styles.dark_color, styles.is_system
  from public.tag_styles as styles
  where styles.is_active
  order by styles.is_system desc, lower(styles.label), styles.label;
end;
$$;

create function public.create_tag_style_for_management(
  style_slug text,
  style_label text,
  style_light_color text,
  style_dark_color text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_slug text := lower(btrim(coalesce(style_slug, '')));
  normalized_label text := btrim(coalesce(style_label, ''));
  normalized_light_color text := lower(btrim(coalesce(style_light_color, '')));
  normalized_dark_color text := lower(btrim(coalesce(style_dark_color, '')));
  new_style_id uuid;
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can create tag styles.';
  end if;

  if char_length(normalized_slug) not between 1 and 60
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Use lowercase letters, numbers, and hyphens for the style slug.';
  end if;

  if char_length(normalized_label) not between 1 and 40 then
    raise exception 'Style labels must contain between 1 and 40 characters.';
  end if;

  if normalized_light_color !~ '^#[0-9a-f]{6}$'
    or normalized_dark_color !~ '^#[0-9a-f]{6}$' then
    raise exception 'Choose valid six-digit colors for both themes.';
  end if;

  insert into public.tag_styles (slug, label, light_color, dark_color)
  values (
    normalized_slug,
    normalized_label,
    normalized_light_color,
    normalized_dark_color
  )
  returning id into new_style_id;

  return new_style_id;
exception
  when unique_violation then
    raise exception 'A tag style with that slug already exists.';
end;
$$;

create function public.create_manual_tag_for_management(
  tag_slug text,
  tag_label text,
  tag_description text,
  tag_style_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_slug text := lower(btrim(coalesce(tag_slug, '')));
  normalized_label text := btrim(coalesce(tag_label, ''));
  normalized_description text := nullif(btrim(coalesce(tag_description, '')), '');
  new_tag_id uuid;
  next_display_order integer;
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can create tags.';
  end if;

  if char_length(normalized_slug) not between 1 and 60
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Use lowercase letters, numbers, and hyphens for the slug.';
  end if;

  if char_length(normalized_label) not between 1 and 40 then
    raise exception 'Tag labels must contain between 1 and 40 characters.';
  end if;

  if normalized_description is not null and char_length(normalized_description) > 240 then
    raise exception 'Tag descriptions must contain 240 characters or fewer.';
  end if;

  if not exists (
    select 1 from public.tag_styles where id = tag_style_id and is_active
  ) then
    raise exception 'Choose a valid tag style.';
  end if;

  select coalesce(max(display_order), 0) + 10 into next_display_order
  from public.tags;

  insert into public.tags (
    slug, label, description, style_id, display_order, is_automatic
  ) values (
    normalized_slug,
    normalized_label,
    normalized_description,
    tag_style_id,
    next_display_order,
    false
  )
  returning id into new_tag_id;

  return new_tag_id;
exception
  when unique_violation then
    raise exception 'A tag with that slug already exists.';
end;
$$;

create or replace function public.delete_manual_tag_for_management(target_tag_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tag public.tags%rowtype;
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can manage tags.';
  end if;

  select * into target_tag
  from public.tags
  where id = target_tag_id;

  if not found then
    raise exception 'Tag not found.';
  end if;

  if target_tag.is_automatic then
    raise exception 'Automatic tags cannot be deleted from the tag manager.';
  end if;

  delete from public.tags where id = target_tag_id;
end;
$$;

create function public.reorder_tags_for_management(ordered_tag_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  active_tag_count integer;
  requested_tag_count integer;
  distinct_tag_count integer;
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can reorder tags.';
  end if;

  select count(*) into active_tag_count from public.tags where is_active;
  requested_tag_count := coalesce(array_length(ordered_tag_ids, 1), 0);
  select count(distinct id) into distinct_tag_count
  from unnest(coalesce(ordered_tag_ids, '{}'::uuid[])) as requested(id);

  if requested_tag_count <> active_tag_count
    or distinct_tag_count <> active_tag_count
    or exists (
      select 1
      from unnest(coalesce(ordered_tag_ids, '{}'::uuid[])) as requested(id)
      left join public.tags on tags.id = requested.id and tags.is_active
      where tags.id is null
    ) then
    raise exception 'The tag order is incomplete or invalid. Refresh and try again.';
  end if;

  update public.tags as tags
  set display_order = requested.position::integer * 10
  from unnest(ordered_tag_ids) with ordinality as requested(id, position)
  where tags.id = requested.id;
end;
$$;

revoke all on function public.get_profile_tags(uuid) from public;
grant execute on function public.get_profile_tags(uuid) to authenticated;
revoke all on function public.get_user_tags_for_management(uuid) from public;
grant execute on function public.get_user_tags_for_management(uuid) to authenticated;
revoke all on function public.get_tag_catalog_for_management() from public;
grant execute on function public.get_tag_catalog_for_management() to authenticated;
revoke all on function public.get_tag_styles_for_management() from public;
grant execute on function public.get_tag_styles_for_management() to authenticated;
revoke all on function public.create_tag_style_for_management(text, text, text, text) from public;
grant execute on function public.create_tag_style_for_management(text, text, text, text) to authenticated;
revoke all on function public.create_manual_tag_for_management(text, text, text, uuid) from public;
grant execute on function public.create_manual_tag_for_management(text, text, text, uuid) to authenticated;
revoke all on function public.reorder_tags_for_management(uuid[]) from public;
grant execute on function public.reorder_tags_for_management(uuid[]) to authenticated;

commit;

notify pgrst, 'reload schema';
