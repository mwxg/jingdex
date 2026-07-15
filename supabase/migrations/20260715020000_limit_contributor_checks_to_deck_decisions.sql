begin;

-- Creating an official Jingdex deck temporarily attributes it to the acting
-- admin before the registry trigger clears that attribution. Ownership and
-- visibility maintenance are not contribution decisions and must not restore
-- an automatic Contributor tag. Only publication decisions and deletion need
-- to reconcile deck-based qualification.
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
after update of publication_status or delete on public.decks
for each row execute function public.reconcile_deck_creator_tag();

select public.reconcile_user_automatic_tags(id)
from public.profiles;

commit;

notify pgrst, 'reload schema';
