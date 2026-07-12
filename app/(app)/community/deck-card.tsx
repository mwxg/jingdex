import Link from "next/link";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { type CommunityDeckSummary } from "./data";

export function CommunityDeckCard({
  className = "",
  deck,
  preferences,
}: Readonly<{
  className?: string;
  deck: CommunityDeckSummary;
  preferences: LanguagePreferences;
}>) {
  const forms = deck.first_term
    ? getChineseDisplayForms(deck.first_term, preferences.characterSet)
    : null;

  return (
    <li className={`min-w-0 ${className}`}>
      <Link
        className="block h-full rounded-lg border border-muted-background bg-surface p-5 transition-colors hover:border-primary focus:border-primary focus:outline-none"
        href={`/community/${deck.id}`}
      >
        <div className="flex min-h-40 items-center justify-center rounded-lg bg-muted-background px-4 py-6">
          {forms ? (
            <p className="text-center font-chinese text-6xl font-bold leading-none text-foreground sm:text-7xl">
              {forms.primary}
            </p>
          ) : (
            <p className="font-sans text-sm font-bold text-muted">Empty deck</p>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <h2 className="line-clamp-2 font-heading text-2xl font-semibold leading-tight text-foreground">
            {deck.title}
          </h2>
          <p className="line-clamp-3 min-h-18 font-sans text-sm leading-6 text-muted">
            {deck.description || "No description added."}
          </p>
          <div className="flex items-center justify-between gap-3 border-t border-muted-background pt-3 font-sans text-sm text-muted">
            <span>{deck.term_count} terms</span>
            <span className="truncate">By {deck.created_by || "Jingdex"}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
