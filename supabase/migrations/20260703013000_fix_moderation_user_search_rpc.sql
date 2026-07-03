drop function if exists public.search_users_for_moderation(text);

create function public.search_users_for_moderation(search_query text)
returns table (
  id uuid,
  email text,
  username text,
  role public.app_user_role,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_query text;
begin
  if not public.is_moderator() then
    raise exception 'Only moderators, admins, and developers can search users.';
  end if;

  normalized_query := btrim(search_query);

  if normalized_query = '' then
    return;
  end if;

  return query
    select
      p.id,
      u.email::text,
      p.username,
      p.role,
      p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where
      p.username ilike '%' || normalized_query || '%'
      or u.email ilike '%' || normalized_query || '%'
    order by p.username
    limit 25;
end;
$$;

revoke all on function public.search_users_for_moderation(text) from public;
grant execute on function public.search_users_for_moderation(text) to authenticated;

notify pgrst, 'reload schema';
