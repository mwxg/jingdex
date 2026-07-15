begin;

alter table public.tag_styles
add column light_color_end text,
add column dark_color_end text;

update public.tag_styles
set
  light_color_end = light_color,
  dark_color_end = dark_color;

alter table public.tag_styles
alter column light_color_end set not null,
alter column dark_color_end set not null,
add constraint tag_styles_light_color_end_format
  check (light_color_end ~ '^#[0-9A-Fa-f]{6}$'),
add constraint tag_styles_dark_color_end_format
  check (dark_color_end ~ '^#[0-9A-Fa-f]{6}$');

insert into public.tags (
  slug, label, description, style_id, display_order, is_automatic
)
select
  new_tags.slug,
  new_tags.label,
  new_tags.description,
  styles.id,
  ordering.next_order + new_tags.order_offset,
  true
from (
  values
    ('deck-builder', 'Deck builder', 'Has published a community deck.', 10),
    ('super-contributor', 'Super contributor', 'Has had at least 50 words accepted.', 20),
    ('early-bird', 'Early bird', 'One of the first 100 Jingdex accounts.', 30),
    ('decked-out', 'Decked out', 'Has published at least five community decks.', 40)
) as new_tags(slug, label, description, order_offset)
cross join (select id from public.tag_styles where slug = 'neutral') as styles
cross join (select coalesce(max(display_order), 0) as next_order from public.tags) as ordering
on conflict (slug) do update set
  label = excluded.label,
  description = excluded.description,
  style_id = excluded.style_id,
  is_automatic = true,
  is_active = true;

create or replace function public.reconcile_user_automatic_tags(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role public.app_user_role;
  accepted_word_count integer;
  community_deck_count integer;
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
    and tags.slug in ('developer', 'admin', 'moderator')
    and tags.slug <> target_role::text;

  insert into public.user_tag_assignments (user_id, tag_id, source)
  select target_user_id, tags.id, 'automatic'
  from public.tags as tags
  where tags.slug = target_role::text
    and tags.is_active
  on conflict (user_id, tag_id) do update set
    source = 'automatic',
    assigned_by_user_id = null,
    assigned_at = now();

  select
    (
      select count(*)::integer
      from public.term_submissions
      where submitted_by_user_id = target_user_id
        and status = 'accepted'
    ),
    (
      select count(*)::integer
      from public.decks as decks
      where decks.created_by_user_id = target_user_id
        and decks.visibility = 'community'
        and decks.publication_status = 'approved'
        and not exists (
          select 1
          from public.jingdex_decks
          where jingdex_decks.deck_id = decks.id
        )
    )
  into accepted_word_count, community_deck_count;

  delete from public.user_tag_assignments as assignments
  using public.tags as tags
  where assignments.user_id = target_user_id
    and assignments.tag_id = tags.id
    and (
      (tags.slug = 'contributor' and accepted_word_count < 1 and community_deck_count < 1)
      or (tags.slug = 'super-contributor' and accepted_word_count < 50)
      or (tags.slug = 'deck-builder' and community_deck_count < 1)
      or (tags.slug = 'decked-out' and community_deck_count < 5)
    );

  insert into public.user_tag_assignments (user_id, tag_id, source)
  select target_user_id, tags.id, 'automatic'
  from public.tags as tags
  where tags.is_active
    and (
      (tags.slug = 'contributor' and (accepted_word_count >= 1 or community_deck_count >= 1))
      or (tags.slug = 'super-contributor' and accepted_word_count >= 50)
      or (tags.slug = 'deck-builder' and community_deck_count >= 1)
      or (tags.slug = 'decked-out' and community_deck_count >= 5)
    )
  on conflict (user_id, tag_id) do update set
    source = 'automatic',
    assigned_by_user_id = null,
    assigned_at = now();
end;
$$;

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

  if tg_op = 'INSERT' then
    perform public.reconcile_user_automatic_tags(new.created_by_user_id);
    return new;
  end if;

  if old.publication_status is distinct from new.publication_status then
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
after insert or update of publication_status or delete on public.decks
for each row execute function public.reconcile_deck_creator_tag();

create or replace function public.reconcile_term_submitter_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.reconcile_user_automatic_tags(old.submitted_by_user_id);
    return old;
  end if;

  perform public.reconcile_user_automatic_tags(new.submitted_by_user_id);

  if tg_op = 'UPDATE'
    and old.submitted_by_user_id is distinct from new.submitted_by_user_id then
    perform public.reconcile_user_automatic_tags(old.submitted_by_user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists term_submissions_reconcile_contributor_tag on public.term_submissions;
create trigger term_submissions_reconcile_contributor_tag
after insert or update of status, submitted_by_user_id or delete on public.term_submissions
for each row execute function public.reconcile_term_submitter_tag();

create or replace function public.assign_early_bird_tag_on_profile_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  early_bird_tag_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('jingdex-early-bird-account-award'));

  if (select count(*) from public.profiles) > 100 then
    return new;
  end if;

  select id into early_bird_tag_id
  from public.tags
  where slug = 'early-bird'
    and is_active;

  if early_bird_tag_id is not null then
    insert into public.user_tag_assignments (user_id, tag_id, source)
    values (new.id, early_bird_tag_id, 'automatic')
    on conflict (user_id, tag_id) do update set
      source = 'automatic',
      assigned_by_user_id = null,
      assigned_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_assign_early_bird_tag on public.profiles;
create trigger profiles_assign_early_bird_tag
after insert on public.profiles
for each row execute function public.assign_early_bird_tag_on_profile_creation();

insert into public.user_tag_assignments (user_id, tag_id, source)
select earliest_profiles.id, tags.id, 'automatic'
from (
  select id
  from public.profiles
  order by created_at, id
  limit 100
) as earliest_profiles
cross join public.tags as tags
where tags.slug = 'early-bird'
  and tags.is_active
on conflict (user_id, tag_id) do update set
  source = 'automatic',
  assigned_by_user_id = null,
  assigned_at = now();

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

  if exists (select 1 from public.tags where tags.id = target_tag_id and is_automatic) then
    raise exception 'Automatic tags are maintained by Jingdex.';
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

drop function if exists public.get_profile_tags(uuid);
drop function if exists public.get_user_tags_for_management(uuid);
drop function if exists public.get_tag_catalog_for_management();
drop function if exists public.get_tag_styles_for_management();
drop function if exists public.create_tag_style_for_management(text, text, text, text);

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
  light_color_end text,
  dark_color text,
  dark_color_end text,
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
    styles.light_color_end,
    styles.dark_color,
    styles.dark_color_end,
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
  light_color_end text,
  dark_color text,
  dark_color_end text,
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
    styles.light_color_end,
    styles.dark_color,
    styles.dark_color_end,
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
  light_color_end text,
  dark_color text,
  dark_color_end text,
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
    styles.light_color_end,
    styles.dark_color,
    styles.dark_color_end,
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
  light_color_end text,
  dark_color text,
  dark_color_end text,
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
  select
    styles.id,
    styles.slug,
    styles.label,
    styles.light_color,
    styles.light_color_end,
    styles.dark_color,
    styles.dark_color_end,
    styles.is_system
  from public.tag_styles as styles
  where styles.is_active
  order by styles.is_system desc, lower(styles.label), styles.label;
end;
$$;

create function public.create_tag_style_for_management(
  style_slug text,
  style_label text,
  style_light_color text,
  style_light_color_end text,
  style_dark_color text,
  style_dark_color_end text
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
  normalized_light_color_end text := lower(btrim(coalesce(style_light_color_end, '')));
  normalized_dark_color text := lower(btrim(coalesce(style_dark_color, '')));
  normalized_dark_color_end text := lower(btrim(coalesce(style_dark_color_end, '')));
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
    or normalized_light_color_end !~ '^#[0-9a-f]{6}$'
    or normalized_dark_color !~ '^#[0-9a-f]{6}$'
    or normalized_dark_color_end !~ '^#[0-9a-f]{6}$' then
    raise exception 'Choose valid six-digit colors for both gradients.';
  end if;

  insert into public.tag_styles (
    slug, label, light_color, light_color_end, dark_color, dark_color_end
  ) values (
    normalized_slug,
    normalized_label,
    normalized_light_color,
    normalized_light_color_end,
    normalized_dark_color,
    normalized_dark_color_end
  )
  returning id into new_style_id;

  return new_style_id;
exception
  when unique_violation then
    raise exception 'A tag style with that slug already exists.';
end;
$$;

create function public.update_tag_style_colors_for_management(
  target_style_id uuid,
  style_light_color text,
  style_light_color_end text,
  style_dark_color text,
  style_dark_color_end text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_light_color text := lower(btrim(coalesce(style_light_color, '')));
  normalized_light_color_end text := lower(btrim(coalesce(style_light_color_end, '')));
  normalized_dark_color text := lower(btrim(coalesce(style_dark_color, '')));
  normalized_dark_color_end text := lower(btrim(coalesce(style_dark_color_end, '')));
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can edit tag styles.';
  end if;

  if normalized_light_color !~ '^#[0-9a-f]{6}$'
    or normalized_light_color_end !~ '^#[0-9a-f]{6}$'
    or normalized_dark_color !~ '^#[0-9a-f]{6}$'
    or normalized_dark_color_end !~ '^#[0-9a-f]{6}$' then
    raise exception 'Choose valid six-digit colors for both gradients.';
  end if;

  update public.tag_styles
  set
    light_color = normalized_light_color,
    light_color_end = normalized_light_color_end,
    dark_color = normalized_dark_color,
    dark_color_end = normalized_dark_color_end
  where id = target_style_id
    and is_active;

  if not found then
    raise exception 'Tag style not found.';
  end if;
end;
$$;

select public.reconcile_user_automatic_tags(id)
from public.profiles;

revoke all on function public.reconcile_user_automatic_tags(uuid) from public;
revoke all on function public.assign_early_bird_tag_on_profile_creation() from public;
revoke all on function public.get_profile_tags(uuid) from public;
grant execute on function public.get_profile_tags(uuid) to authenticated;
revoke all on function public.get_user_tags_for_management(uuid) from public;
grant execute on function public.get_user_tags_for_management(uuid) to authenticated;
revoke all on function public.get_tag_catalog_for_management() from public;
grant execute on function public.get_tag_catalog_for_management() to authenticated;
revoke all on function public.get_tag_styles_for_management() from public;
grant execute on function public.get_tag_styles_for_management() to authenticated;
revoke all on function public.create_tag_style_for_management(text, text, text, text, text, text) from public;
grant execute on function public.create_tag_style_for_management(text, text, text, text, text, text) to authenticated;
revoke all on function public.update_tag_style_colors_for_management(uuid, text, text, text, text) from public;
grant execute on function public.update_tag_style_colors_for_management(uuid, text, text, text, text) to authenticated;

commit;

notify pgrst, 'reload schema';
