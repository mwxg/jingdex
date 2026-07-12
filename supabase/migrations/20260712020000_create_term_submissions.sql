do $$
begin
  create type public.term_submission_status as enum (
    'pending', 'accepted', 'rejected', 'withdrawn'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.term_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by_user_id uuid not null references public.profiles(id) on delete cascade,
  simplified text not null,
  traditional text,
  pinyin text not null,
  zhuyin text not null,
  canonical_simplified text not null,
  english_definition text not null,
  parts_of_speech text[],
  notes text,
  status public.term_submission_status not null default 'pending',
  reviewer_notes text,
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  accepted_term_id uuid references public.terms(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint term_submissions_required_values check (
    btrim(simplified) <> '' and btrim(pinyin) <> '' and btrim(zhuyin) <> ''
    and btrim(canonical_simplified) <> '' and btrim(english_definition) <> ''
  ),
  constraint term_submissions_review_fields check (
    (reviewed_at is null and reviewed_by_user_id is null)
    or (reviewed_at is not null and reviewed_by_user_id is not null)
  )
);

create index if not exists term_submissions_status_created_idx
on public.term_submissions (status, created_at);
create index if not exists term_submissions_submitter_idx
on public.term_submissions (submitted_by_user_id, created_at desc);
create unique index if not exists term_submissions_pending_form_unique_idx
on public.term_submissions (
  submitted_by_user_id,
  btrim(canonical_simplified),
  coalesce(nullif(btrim(traditional), ''), ''),
  btrim(pinyin)
) where status = 'pending';

alter table public.term_submissions enable row level security;

create or replace function public.app_role_has_permission(
  role_to_check public.app_user_role,
  permission_to_check text
)
returns boolean
language sql
stable
as $$
  select case role_to_check::text
    when 'moderator' then permission_to_check in (
      'access_moderation_page', 'search_users'
    )
    when 'admin' then permission_to_check in (
      'access_moderation_page', 'search_users', 'manage_community_decks',
      'review_term_submissions', 'manage_terms', 'manage_moderator_role'
    )
    when 'developer' then permission_to_check in (
      'access_moderation_page', 'search_users', 'manage_community_decks',
      'review_term_submissions', 'manage_terms', 'manage_moderator_role',
      'manage_admin_role'
    )
    else false
  end;
$$;

drop policy if exists "Users can read their own term submissions" on public.term_submissions;
create policy "Users can read their own term submissions"
on public.term_submissions for select to authenticated
using (
  submitted_by_user_id = auth.uid()
  or public.current_user_has_app_permission('review_term_submissions')
);

create or replace function public.submit_term_contribution(term_row jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  normalized_simplified text := btrim(term_row ->> 'canonical_simplified');
  normalized_traditional text := nullif(btrim(term_row ->> 'traditional'), '');
  normalized_pinyin text := btrim(term_row ->> 'pinyin');
begin
  if auth.uid() is null then raise exception 'Sign in to contribute a word.'; end if;
  if normalized_simplified = '' or normalized_pinyin = ''
    or btrim(coalesce(term_row ->> 'zhuyin', '')) = ''
    or btrim(coalesce(term_row ->> 'english_definition', '')) = '' then
    raise exception 'Complete all required term fields.';
  end if;

  if exists (
    select 1 from public.terms
    where btrim(canonical_simplified) = normalized_simplified
      and coalesce(nullif(btrim(traditional), ''), '') = coalesce(normalized_traditional, '')
      and btrim(pinyin) = normalized_pinyin
  ) then raise exception 'That term is already in the dictionary.'; end if;

  insert into public.term_submissions (
    submitted_by_user_id, simplified, traditional, pinyin, zhuyin,
    canonical_simplified, english_definition, parts_of_speech, notes
  ) values (
    auth.uid(), normalized_simplified, normalized_traditional, normalized_pinyin,
    btrim(term_row ->> 'zhuyin'), normalized_simplified,
    btrim(term_row ->> 'english_definition'),
    case when jsonb_typeof(term_row -> 'parts_of_speech') = 'array'
      then array(select jsonb_array_elements_text(term_row -> 'parts_of_speech'))
      else null end,
    nullif(btrim(term_row ->> 'notes'), '')
  ) returning id into new_id;
  return new_id;
exception
  when unique_violation then raise exception 'You already have this term awaiting review.';
end;
$$;

create or replace function public.review_term_contribution(
  submission_id uuid,
  decision text,
  review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  submission public.term_submissions%rowtype;
  term_id uuid;
  submitter_name text;
begin
  if not public.current_user_has_app_permission('review_term_submissions') then
    raise exception 'Only admins and developers can review term submissions.';
  end if;
  if decision not in ('accepted', 'rejected') then raise exception 'Choose a valid review decision.'; end if;

  select * into submission from public.term_submissions
  where id = submission_id for update;
  if not found then raise exception 'Submission not found.'; end if;
  if submission.status <> 'pending' then raise exception 'That submission has already been reviewed.'; end if;

  if decision = 'accepted' then
    select id into term_id from public.terms
    where btrim(canonical_simplified) = btrim(submission.canonical_simplified)
      and coalesce(nullif(btrim(traditional), ''), '') = coalesce(nullif(btrim(submission.traditional), ''), '')
      and btrim(pinyin) = btrim(submission.pinyin)
    limit 1;

    if term_id is null then
      select username into submitter_name from public.profiles where id = submission.submitted_by_user_id;
      insert into public.terms (
        simplified, traditional, pinyin, zhuyin, canonical_simplified,
        english_definition, parts_of_speech, notes, added_by,
        added_by_user_id, is_verified
      ) values (
        submission.simplified, submission.traditional, submission.pinyin,
        submission.zhuyin, submission.canonical_simplified,
        submission.english_definition, submission.parts_of_speech,
        submission.notes, coalesce(submitter_name, 'Jingdex'),
        submission.submitted_by_user_id, true
      ) returning id into term_id;
    end if;
  end if;

  update public.term_submissions set
    status = decision::public.term_submission_status,
    reviewer_notes = nullif(btrim(review_note), ''),
    reviewed_by_user_id = auth.uid(), reviewed_at = now(),
    accepted_term_id = term_id, updated_at = now()
  where id = submission_id;
  return term_id;
end;
$$;

revoke all on function public.submit_term_contribution(jsonb) from public;
grant execute on function public.submit_term_contribution(jsonb) to authenticated;
revoke all on function public.review_term_contribution(uuid, text, text) from public;
grant execute on function public.review_term_contribution(uuid, text, text) to authenticated;
notify pgrst, 'reload schema';
