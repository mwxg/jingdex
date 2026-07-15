begin;

-- Terms created through the moderation panel used to retain the developer's
-- profile ID. The profile attribution backfill consequently replaced the
-- Jingdex label with that developer's username. This one-time backfill detaches
-- every existing term currently linked to a developer. Future normal review
-- submissions still retain their submitter attribution through
-- review_term_contribution; only add_terms_for_moderation creates Jingdex terms.
update public.terms as terms
set
  added_by = 'Jingdex',
  added_by_user_id = null
where exists (
  select 1
  from public.profiles as profiles
  where profiles.id = terms.added_by_user_id
    and profiles.role = 'developer'
);

-- Every term creation path must choose its attribution explicitly. Only the
-- moderation RPC below assigns the Jingdex label.
alter table public.terms alter column added_by drop default;

create or replace function public.add_terms_for_moderation(term_rows jsonb)
returns table (
  inserted_count integer,
  skipped_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_count integer;
  created_count integer;
begin
  if not public.current_user_has_app_permission('manage_terms') then
    raise exception 'Only admins and developers can add terms.';
  end if;

  with normalized_terms as materialized (
    select distinct on (
      btrim(value ->> 'canonical_simplified'),
      coalesce(nullif(btrim(value ->> 'traditional'), ''), ''),
      btrim(value ->> 'pinyin')
    )
      btrim(value ->> 'simplified') as simplified,
      nullif(btrim(value ->> 'traditional'), '') as traditional,
      btrim(value ->> 'pinyin') as pinyin,
      btrim(value ->> 'zhuyin') as zhuyin,
      btrim(value ->> 'canonical_simplified') as canonical_simplified,
      btrim(value ->> 'english_definition') as english_definition,
      nullif(
        array(
          select distinct btrim(part)
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(value -> 'parts_of_speech') = 'array'
                then value -> 'parts_of_speech'
              else '[]'::jsonb
            end
          ) as part
          where btrim(part) <> ''
        ),
        '{}'::text[]
      ) as parts_of_speech,
      coalesce((value ->> 'is_verified')::boolean, true) as is_verified
    from jsonb_array_elements(coalesce(term_rows, '[]'::jsonb))
    where btrim(coalesce(value ->> 'simplified', '')) <> ''
      and btrim(coalesce(value ->> 'pinyin', '')) <> ''
      and btrim(coalesce(value ->> 'zhuyin', '')) <> ''
      and btrim(coalesce(value ->> 'canonical_simplified', '')) <> ''
      and btrim(coalesce(value ->> 'english_definition', '')) <> ''
    order by
      btrim(value ->> 'canonical_simplified'),
      coalesce(nullif(btrim(value ->> 'traditional'), ''), ''),
      btrim(value ->> 'pinyin')
  ),
  inserted_terms as (
    insert into public.terms (
      simplified,
      traditional,
      pinyin,
      zhuyin,
      canonical_simplified,
      english_definition,
      parts_of_speech,
      added_by,
      added_by_user_id,
      is_verified
    )
    select
      simplified,
      traditional,
      pinyin,
      zhuyin,
      canonical_simplified,
      english_definition,
      parts_of_speech,
      'Jingdex',
      null,
      is_verified
    from normalized_terms
    on conflict do nothing
    returning id
  )
  select
    (select count(*)::integer from normalized_terms),
    (select count(*)::integer from inserted_terms)
  into requested_count, created_count;

  return query select
    coalesce(created_count, 0),
    greatest(coalesce(requested_count, 0) - coalesce(created_count, 0), 0);
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

  if decision not in ('accepted', 'rejected') then
    raise exception 'Choose a valid review decision.';
  end if;

  select * into submission
  from public.term_submissions
  where id = submission_id
  for update;

  if not found then
    raise exception 'Submission not found.';
  end if;

  if submission.status <> 'pending' then
    raise exception 'That submission has already been reviewed.';
  end if;

  if decision = 'accepted' then
    select id into term_id
    from public.terms
    where btrim(canonical_simplified) = btrim(submission.canonical_simplified)
      and coalesce(nullif(btrim(traditional), ''), '') =
        coalesce(nullif(btrim(submission.traditional), ''), '')
      and btrim(pinyin) = btrim(submission.pinyin)
    limit 1;

    if term_id is null then
      select username into strict submitter_name
      from public.profiles
      where id = submission.submitted_by_user_id;

      insert into public.terms (
        simplified,
        traditional,
        pinyin,
        zhuyin,
        canonical_simplified,
        english_definition,
        parts_of_speech,
        notes,
        added_by,
        added_by_user_id,
        is_verified
      ) values (
        submission.simplified,
        submission.traditional,
        submission.pinyin,
        submission.zhuyin,
        submission.canonical_simplified,
        submission.english_definition,
        submission.parts_of_speech,
        submission.notes,
        submitter_name,
        submission.submitted_by_user_id,
        true
      )
      returning id into term_id;
    end if;
  end if;

  update public.term_submissions
  set
    status = decision::public.term_submission_status,
    reviewer_notes = nullif(btrim(review_note), ''),
    reviewed_by_user_id = auth.uid(),
    reviewed_at = now(),
    accepted_term_id = term_id,
    updated_at = now()
  where id = submission_id;

  return term_id;
end;
$$;

revoke all on function public.add_terms_for_moderation(jsonb) from public;
grant execute on function public.add_terms_for_moderation(jsonb) to authenticated;
revoke all on function public.review_term_contribution(uuid, text, text) from public;
grant execute on function public.review_term_contribution(uuid, text, text) to authenticated;

commit;

notify pgrst, 'reload schema';
