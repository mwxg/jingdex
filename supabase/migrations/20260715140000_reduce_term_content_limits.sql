alter table public.terms
drop constraint if exists terms_english_definition_length;

alter table public.terms
add constraint terms_english_definition_length
check (char_length(english_definition) <= 2000) not valid;

alter table public.terms
drop constraint if exists terms_notes_length;

alter table public.terms
add constraint terms_notes_length
check (notes is null or char_length(notes) <= 500) not valid;

alter table public.term_submissions
drop constraint if exists term_submissions_english_definition_length;

alter table public.term_submissions
add constraint term_submissions_english_definition_length
check (char_length(english_definition) <= 2000) not valid;

alter table public.term_submissions
drop constraint if exists term_submissions_notes_length;

alter table public.term_submissions
add constraint term_submissions_notes_length
check (notes is null or char_length(notes) <= 500) not valid;

notify pgrst, 'reload schema';
