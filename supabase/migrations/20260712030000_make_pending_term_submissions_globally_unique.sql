drop index if exists public.term_submissions_pending_form_unique_idx;

create unique index term_submissions_pending_form_unique_idx
on public.term_submissions (
  btrim(canonical_simplified),
  coalesce(nullif(btrim(traditional), ''), ''),
  btrim(pinyin)
) where status = 'pending';

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
  if auth.uid() is null then
    raise exception 'Sign in to contribute a word.';
  end if;

  if normalized_simplified = '' or normalized_pinyin = ''
    or btrim(coalesce(term_row ->> 'zhuyin', '')) = ''
    or btrim(coalesce(term_row ->> 'english_definition', '')) = '' then
    raise exception 'Complete all required term fields.';
  end if;

  if exists (
    select 1
    from public.terms
    where btrim(canonical_simplified) = normalized_simplified
      and coalesce(nullif(btrim(traditional), ''), '') = coalesce(normalized_traditional, '')
      and btrim(pinyin) = normalized_pinyin
  ) then
    raise exception 'That term is already in the dictionary.';
  end if;

  if exists (
    select 1
    from public.term_submissions
    where status = 'pending'
      and btrim(canonical_simplified) = normalized_simplified
      and coalesce(nullif(btrim(traditional), ''), '') = coalesce(normalized_traditional, '')
      and btrim(pinyin) = normalized_pinyin
  ) then
    raise exception 'That term has already been submitted for review.';
  end if;

  insert into public.term_submissions (
    submitted_by_user_id,
    simplified,
    traditional,
    pinyin,
    zhuyin,
    canonical_simplified,
    english_definition,
    parts_of_speech,
    notes
  ) values (
    auth.uid(),
    normalized_simplified,
    normalized_traditional,
    normalized_pinyin,
    btrim(term_row ->> 'zhuyin'),
    normalized_simplified,
    btrim(term_row ->> 'english_definition'),
    case
      when jsonb_typeof(term_row -> 'parts_of_speech') = 'array'
        then array(select jsonb_array_elements_text(term_row -> 'parts_of_speech'))
      else null
    end,
    nullif(btrim(term_row ->> 'notes'), '')
  )
  returning id into new_id;

  return new_id;
exception
  when unique_violation then
    raise exception 'That term has already been submitted for review.';
end;
$$;

revoke all on function public.submit_term_contribution(jsonb) from public;
grant execute on function public.submit_term_contribution(jsonb) to authenticated;

notify pgrst, 'reload schema';
