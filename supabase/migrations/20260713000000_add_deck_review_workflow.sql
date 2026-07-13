create or replace function public.prevent_unauthorized_deck_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_resubmission boolean;
begin
  if public.current_user_has_app_permission('manage_community_decks') then
    return new;
  end if;

  if old.created_by_user_id is distinct from new.created_by_user_id then
    raise exception 'Deck ownership cannot be changed.';
  end if;

  if old.publication_status in ('approved', 'archived') then
    raise exception 'Published and archived decks can only be changed by an admin or developer.';
  end if;

  is_resubmission :=
    old.publication_status = 'rejected'
    and new.publication_status = 'under_review';

  if (
    old.reviewed_at is distinct from new.reviewed_at
    or old.reviewed_by_user_id is distinct from new.reviewed_by_user_id
    or old.review_notes is distinct from new.review_notes
  ) and not (
    is_resubmission
    and new.reviewed_at is null
    and new.reviewed_by_user_id is null
    and new.review_notes is null
  ) then
    raise exception 'Only admins and developers can change deck review fields.';
  end if;

  if old.publication_status is distinct from new.publication_status
    and not (
      old.publication_status in ('draft', 'rejected')
      and new.publication_status = 'under_review'
    ) then
    raise exception 'Decks can only be submitted or resubmitted for review.';
  end if;

  if old.publication_status is distinct from new.publication_status
    and new.publication_status = 'under_review' then
    new.submitted_at := now();
  elsif old.submitted_at is distinct from new.submitted_at then
    raise exception 'The deck submission time cannot be changed.';
  end if;

  if new.publication_status = 'under_review'
    and nullif(btrim(coalesce(new.description, '')), '') is null then
    raise exception 'Add a description before submitting this deck for review.';
  end if;

  if old.visibility is distinct from new.visibility then
    raise exception 'Only admins and developers can change deck visibility.';
  end if;

  return new;
end;
$$;

drop policy if exists "Users can insert their own decks" on public.decks;
create policy "Users can insert their own decks"
on public.decks for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and publication_status in ('draft', 'under_review')
  and (
    publication_status = 'draft'
    or nullif(btrim(coalesce(description, '')), '') is not null
  )
  and reviewed_at is null
  and reviewed_by_user_id is null
  and review_notes is null
  and (
    visibility <> 'community'
    or public.current_user_has_app_permission('manage_community_decks')
  )
);

notify pgrst, 'reload schema';
