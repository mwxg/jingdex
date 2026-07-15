begin;

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
    from public.decks as decks
    where decks.created_by_user_id = target_user_id
      and decks.visibility = 'community'
      and decks.publication_status = 'approved'
      and not exists (
        select 1
        from public.jingdex_decks
        where jingdex_decks.deck_id = decks.id
      )
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

select public.reconcile_user_automatic_tags(id)
from public.profiles;

revoke all on function public.reconcile_user_automatic_tags(uuid) from public;

commit;

notify pgrst, 'reload schema';
