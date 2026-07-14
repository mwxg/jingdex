create or replace function public.get_jingdex_deck_summaries(
  search_query text default '',
  max_results integer default null,
  randomize boolean default false
)
returns table (
  id uuid,
  title text,
  description text,
  created_by text,
  created_at timestamptz,
  term_count bigint,
  first_term jsonb
)
language sql
security invoker
set search_path = public
as $$
  with eligible as (
    select
      d.id,
      d.title,
      d.description,
      d.created_by,
      d.created_at,
      case when randomize then random() else 0 end as random_rank
    from public.jingdex_decks jd
    join public.decks d on d.id = jd.deck_id
    where d.visibility = 'community'
      and d.publication_status = 'approved'
      and (
        nullif(btrim(search_query), '') is null
        or position(lower(btrim(search_query)) in lower(d.title)) > 0
        or position(lower(btrim(search_query)) in lower(coalesce(d.description, ''))) > 0
      )
  ),
  selected as (
    select eligible.*
    from eligible
    order by
      case when randomize then eligible.random_rank end,
      case when not randomize then lower(eligible.title) end,
      eligible.id
    limit case
      when max_results is null then 2147483647
      else greatest(0, least(max_results, 1000))
    end
  )
  select
    selected.id,
    selected.title,
    selected.description,
    selected.created_by,
    selected.created_at,
    coalesce(term_stats.term_count, 0) as term_count,
    term_stats.first_term
  from selected
  left join lateral (
    select
      count(*) as term_count,
      (
        select jsonb_build_object(
          'id', t.id,
          'simplified', t.simplified,
          'traditional', t.traditional,
          'pinyin', t.pinyin,
          'zhuyin', t.zhuyin,
          'english_definition', t.english_definition,
          'short_definition', t.short_definition,
          'parts_of_speech', t.parts_of_speech,
          'notes', t.notes,
          'added_by', t.added_by
        )
        from public.deck_terms first_dt
        join public.terms t on t.id = first_dt.term_id
        where first_dt.deck_id = selected.id
        order by first_dt.position, first_dt.id
        limit 1
      ) as first_term
    from public.deck_terms dt
    where dt.deck_id = selected.id
  ) term_stats on true
  order by
    case when randomize then selected.random_rank end,
    case when not randomize then lower(selected.title) end,
    selected.id;
$$;

create or replace function public.get_public_deck_summaries(
  search_query text default '',
  sort_order text default 'alphabetical',
  result_offset integer default 0,
  result_limit integer default 30
)
returns table (
  id uuid,
  title text,
  description text,
  created_by text,
  created_at timestamptz,
  term_count bigint,
  first_term jsonb,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with eligible as (
    select
      d.id,
      d.title,
      d.description,
      d.created_by,
      d.created_at,
      count(*) over () as total_count
    from public.decks d
    where d.visibility = 'community'
      and d.publication_status = 'approved'
      and (
        nullif(btrim(search_query), '') is null
        or position(lower(btrim(search_query)) in lower(d.title)) > 0
      )
  ),
  page as (
    select eligible.*
    from eligible
    order by
      case when sort_order = 'latest' then eligible.created_at end desc,
      case when sort_order = 'oldest' then eligible.created_at end asc,
      case when sort_order not in ('latest', 'oldest') then lower(eligible.title) end asc,
      eligible.id asc
    offset greatest(result_offset, 0)
    limit greatest(1, least(result_limit, 100))
  )
  select
    page.id,
    page.title,
    page.description,
    page.created_by,
    page.created_at,
    coalesce(term_stats.term_count, 0) as term_count,
    term_stats.first_term,
    page.total_count
  from page
  left join lateral (
    select
      count(*) as term_count,
      (
        select jsonb_build_object(
          'id', t.id,
          'simplified', t.simplified,
          'traditional', t.traditional,
          'pinyin', t.pinyin,
          'zhuyin', t.zhuyin,
          'english_definition', t.english_definition,
          'short_definition', t.short_definition,
          'parts_of_speech', t.parts_of_speech,
          'notes', t.notes,
          'added_by', t.added_by
        )
        from public.deck_terms first_dt
        join public.terms t on t.id = first_dt.term_id
        where first_dt.deck_id = page.id
        order by first_dt.position, first_dt.id
        limit 1
      ) as first_term
    from public.deck_terms dt
    where dt.deck_id = page.id
  ) term_stats on true
  order by
    case when sort_order = 'latest' then page.created_at end desc,
    case when sort_order = 'oldest' then page.created_at end asc,
    case when sort_order not in ('latest', 'oldest') then lower(page.title) end asc,
    page.id asc;
$$;

revoke all on function public.get_jingdex_deck_summaries(text, integer, boolean) from public;
revoke all on function public.get_public_deck_summaries(text, text, integer, integer) from public;

grant execute on function public.get_jingdex_deck_summaries(text, integer, boolean) to authenticated;
grant execute on function public.get_public_deck_summaries(text, text, integer, integer) to authenticated;

notify pgrst, 'reload schema';
