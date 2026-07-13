alter table public.term_submissions
drop constraint if exists term_submissions_rejection_requires_notes;

alter table public.term_submissions
add constraint term_submissions_rejection_requires_notes check (
  status <> 'rejected'
  or nullif(btrim(coalesce(reviewer_notes, '')), '') is not null
) not valid;

alter table public.decks
drop constraint if exists decks_rejection_requires_notes;

alter table public.decks
add constraint decks_rejection_requires_notes check (
  publication_status <> 'rejected'
  or nullif(btrim(coalesce(review_notes, '')), '') is not null
) not valid;
