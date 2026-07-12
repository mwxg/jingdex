drop index if exists public.terms_canonical_simplified_unique_idx;

create unique index if not exists terms_form_triple_unique_idx
on public.terms (
  btrim(canonical_simplified),
  coalesce(nullif(btrim(traditional), ''), ''),
  btrim(pinyin)
);

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

  with normalized_terms as (
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
      coalesce(nullif(btrim(value ->> 'added_by'), ''), 'Jingdex') as added_by,
      auth.uid() as added_by_user_id,
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
  )
  select count(*)::integer
  into requested_count
  from normalized_terms;

  with normalized_terms as (
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
      coalesce(nullif(btrim(value ->> 'added_by'), ''), 'Jingdex') as added_by,
      auth.uid() as added_by_user_id,
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
      added_by,
      added_by_user_id,
      is_verified
    from normalized_terms
    on conflict do nothing
    returning id
  )
  select count(*)::integer
  into created_count
  from inserted_terms;

  return query select
    coalesce(created_count, 0),
    greatest(coalesce(requested_count, 0) - coalesce(created_count, 0), 0);
end;
$$;

revoke all on function public.add_terms_for_moderation(jsonb) from public;
grant execute on function public.add_terms_for_moderation(jsonb) to authenticated;

notify pgrst, 'reload schema';
