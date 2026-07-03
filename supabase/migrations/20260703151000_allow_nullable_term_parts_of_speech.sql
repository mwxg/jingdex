alter table public.terms
  alter column parts_of_speech drop not null,
  alter column parts_of_speech drop default;

update public.terms
set parts_of_speech = null
where parts_of_speech = '{}'::text[];

notify pgrst, 'reload schema';
