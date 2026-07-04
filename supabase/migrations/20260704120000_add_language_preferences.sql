alter table public.profiles
  add column if not exists preferred_character_set text not null default 'simplified',
  add column if not exists preferred_pronunciation text not null default 'pinyin';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_character_set_valid'
  ) then
    alter table public.profiles
      add constraint profiles_preferred_character_set_valid
      check (preferred_character_set in ('simplified', 'traditional'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_pronunciation_valid'
  ) then
    alter table public.profiles
      add constraint profiles_preferred_pronunciation_valid
      check (preferred_pronunciation in ('pinyin', 'zhuyin'));
  end if;
end;
$$;

notify pgrst, 'reload schema';
