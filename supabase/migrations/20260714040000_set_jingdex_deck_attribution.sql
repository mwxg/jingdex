begin;

-- Registered decks are Jingdex publications, not personal decks owned by the
-- admin or developer who published them.
alter table public.decks disable trigger decks_prevent_unauthorized_moderation;

update public.decks as decks
set
  created_by = 'Jingdex',
  created_by_user_id = null
where exists (
  select 1
  from public.jingdex_decks as jingdex_decks
  where jingdex_decks.deck_id = decks.id
)
and (
  decks.created_by is distinct from 'Jingdex'
  or decks.created_by_user_id is not null
);

alter table public.decks enable trigger decks_prevent_unauthorized_moderation;

create or replace function public.set_jingdex_deck_attribution()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.decks
  set
    created_by = 'Jingdex',
    created_by_user_id = null
  where id = new.deck_id
    and (
      created_by is distinct from 'Jingdex'
      or created_by_user_id is not null
    );

  return new;
end;
$$;

drop trigger if exists jingdex_decks_set_attribution on public.jingdex_decks;
create trigger jingdex_decks_set_attribution
after insert on public.jingdex_decks
for each row execute function public.set_jingdex_deck_attribution();

commit;

notify pgrst, 'reload schema';
