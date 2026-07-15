begin;

create function public.update_tag_details_for_management(
  target_tag_id uuid,
  tag_label text,
  tag_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_label text := btrim(coalesce(tag_label, ''));
  normalized_description text := nullif(btrim(coalesce(tag_description, '')), '');
begin
  if not public.current_user_has_app_permission('manage_user_tags') then
    raise exception 'Only developers can edit tags.';
  end if;

  if char_length(normalized_label) not between 1 and 40 then
    raise exception 'Tag display names must contain between 1 and 40 characters.';
  end if;

  if normalized_description is not null and char_length(normalized_description) > 240 then
    raise exception 'Tag descriptions must contain 240 characters or fewer.';
  end if;

  update public.tags
  set
    label = normalized_label,
    description = normalized_description
  where id = target_tag_id
    and is_active;

  if not found then
    raise exception 'Tag not found.';
  end if;
end;
$$;

revoke all on function public.update_tag_details_for_management(uuid, text, text) from public;
grant execute on function public.update_tag_details_for_management(uuid, text, text) to authenticated;

commit;

notify pgrst, 'reload schema';
