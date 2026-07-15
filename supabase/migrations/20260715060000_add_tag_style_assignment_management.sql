begin;

create function public.update_tag_style_for_management(
  target_tag_id uuid,
  target_style_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can edit tags.';
  end if;

  if not exists (
    select 1 from public.tags where id = target_tag_id and is_active
  ) then
    raise exception 'Tag not found.';
  end if;

  if not exists (
    select 1 from public.tag_styles where id = target_style_id and is_active
  ) then
    raise exception 'Tag style not found.';
  end if;

  update public.tags
  set style_id = target_style_id
  where id = target_tag_id;
end;
$$;

revoke all on function public.update_tag_style_for_management(uuid, uuid) from public;
grant execute on function public.update_tag_style_for_management(uuid, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
