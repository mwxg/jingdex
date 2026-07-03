alter table public.terms
  add column if not exists canonical_simplified text;

update public.terms
set canonical_simplified = btrim(simplified)
where canonical_simplified is null
  and simplified is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'terms_canonical_simplified_not_blank'
  ) then
    alter table public.terms
      add constraint terms_canonical_simplified_not_blank
      check (canonical_simplified is null or btrim(canonical_simplified) <> '');
  end if;
end;
$$;

create unique index if not exists terms_canonical_simplified_unique_idx
on public.terms (canonical_simplified);
