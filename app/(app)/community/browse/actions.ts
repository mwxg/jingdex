"use server";

import { getPublicDecks, type PublicDeckSort } from "../data";

export async function searchPublicDecks(
  query: string,
  sort: PublicDeckSort,
  page = 1,
) {
  const normalizedSort: PublicDeckSort = ["latest", "oldest"].includes(sort)
    ? sort
    : "alphabetical";

  return getPublicDecks({
    page,
    query: query.trim().normalize("NFC"),
    sort: normalizedSort,
  });
}
