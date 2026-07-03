drop function if exists public.update_user_role_for_moderation(uuid, public.app_user_role);

create function public.update_user_role_for_moderation(
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

  if actor_role::text not in ('admin', 'developer') then
    raise exception 'Only admins and developers can edit roles.';
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

  if actor_role::text = 'admin' then
    if existing_target_role::text not in ('member', 'moderator')
      or target_role::text not in ('member', 'moderator') then
      raise exception 'Admins can only edit members and moderators.';
    end if;
  end if;

  if actor_role::text = 'developer' then
    if existing_target_role::text not in ('member', 'moderator', 'admin')
      or target_role::text not in ('member', 'moderator', 'admin') then
      raise exception 'Developers can only edit members, moderators, and admins.';
    end if;
  end if;

  update public.profiles
  set role = target_role
  where id = target_user_id;
end;
$$;

revoke all on function public.update_user_role_for_moderation(uuid, public.app_user_role) from public;
grant execute on function public.update_user_role_for_moderation(uuid, public.app_user_role) to authenticated;

notify pgrst, 'reload schema';
