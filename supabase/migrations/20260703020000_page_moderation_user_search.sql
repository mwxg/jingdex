drop function if exists public.search_users_for_moderation(text);
drop function if exists public.search_users_for_moderation(text, integer, integer);

create function public.search_users_for_moderation(
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
  if not public.is_moderator() then
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

revoke all on function public.search_users_for_moderation(text, integer, integer) from public;
grant execute on function public.search_users_for_moderation(text, integer, integer) to authenticated;

notify pgrst, 'reload schema';