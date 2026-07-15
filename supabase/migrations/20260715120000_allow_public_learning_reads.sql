-- Public learning pages use these read-only RPCs. Row-level security on the
-- underlying tables continues to limit anonymous visitors to published data.
grant execute on function public.get_jingdex_deck_summaries(text, integer, boolean) to anon;
grant execute on function public.get_public_deck_summaries(text, text, integer, integer) to anon;
grant execute on function public.get_profile_tags(uuid) to anon;

notify pgrst, 'reload schema';
