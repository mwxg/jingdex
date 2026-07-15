begin;

alter table public.tags
add constraint tags_slug_length check (char_length(slug) between 1 and 60);

create or replace function public.get_tag_catalog_for_management()
returns table (
  id uuid,
  slug text,
  label text,
  description text,
  style_key text,
  parent_tag_id uuid,
  display_order integer,
  is_automatic boolean,
  depth integer
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
  with recursive tag_tree as (
    select tags.id, array[tags.display_order, 0] as order_path, 0 as depth
    from public.tags as tags
    where tags.parent_tag_id is null
      and tags.is_active
    union all
    select
      child.id,
      parent.order_path || array[child.display_order, 0],
      parent.depth + 1
    from public.tags as child
    join tag_tree as parent on parent.id = child.parent_tag_id
    where child.is_active
  )
  select
    tags.id,
    tags.slug,
    tags.label,
    tags.description,
    tags.style_key,
    tags.parent_tag_id,
    tags.display_order,
    tags.is_automatic,
    tag_tree.depth
  from tag_tree
  join public.tags as tags on tags.id = tag_tree.id
  order by tag_tree.order_path, tags.label;
end;
$$;

create or replace function public.create_manual_tag_for_management(
  tag_slug text,
  tag_label text,
  tag_description text,
  tag_style_key text,
  tag_parent_id uuid,
  tag_display_order integer
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
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can manage tags.';
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

  if tag_style_key is null or tag_style_key not in (
    'neutral', 'moderator', 'admin', 'developer', 'contributor', 'supporter'
  ) then
    raise exception 'Choose a valid tag style.';
  end if;

  if tag_display_order is null
    or tag_display_order < 0
    or tag_display_order > 1000000 then
    raise exception 'Display order must be between 0 and 1,000,000.';
  end if;

  if tag_parent_id is not null and not exists (
    select 1 from public.tags where id = tag_parent_id and is_active
  ) then
    raise exception 'Choose a valid parent tag.';
  end if;

  if exists (
    select 1
    from public.tags
    where parent_tag_id is not distinct from tag_parent_id
      and display_order = tag_display_order
  ) then
    raise exception 'Another tag at that hierarchy level already uses this display order.';
  end if;

  insert into public.tags (
    slug,
    label,
    description,
    style_key,
    parent_tag_id,
    display_order,
    is_automatic
  ) values (
    normalized_slug,
    normalized_label,
    normalized_description,
    tag_style_key,
    tag_parent_id,
    tag_display_order,
    false
  )
  returning id into new_tag_id;

  return new_tag_id;
exception
  when unique_violation then
    raise exception 'A tag with that slug or display order already exists.';
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

  if exists (select 1 from public.tags where parent_tag_id = target_tag_id) then
    raise exception 'Move or delete this tag''s child tags first.';
  end if;

  delete from public.tags where id = target_tag_id;
end;
$$;

revoke all on function public.get_tag_catalog_for_management() from public;
grant execute on function public.get_tag_catalog_for_management() to authenticated;
revoke all on function public.create_manual_tag_for_management(text, text, text, text, uuid, integer) from public;
grant execute on function public.create_manual_tag_for_management(text, text, text, text, uuid, integer) to authenticated;
revoke all on function public.delete_manual_tag_for_management(uuid) from public;
grant execute on function public.delete_manual_tag_for_management(uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
