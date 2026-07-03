alter table public.terms
  drop column if exists source;

alter table public.terms
  add column if not exists zhuyin text;

update public.terms
set zhuyin = ''
where zhuyin is null;

alter table public.terms
  alter column zhuyin set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'terms_zhuyin_not_blank'
  ) then
    alter table public.terms
      add constraint terms_zhuyin_not_blank
      check (zhuyin is null or btrim(zhuyin) <> '')
      not valid;
  end if;
end;
$$;

notify pgrst, 'reload schema';
