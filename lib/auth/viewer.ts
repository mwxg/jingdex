import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ViewerProfile = {
  is_public: boolean;
  preferred_character_set: string;
  preferred_pronunciation: string;
  role: string;
  username: string;
};

export type Viewer = {
  email: string | null;
  profile: ViewerProfile | null;
  userId: string | null;
};

export type ViewerIdentity = Pick<Viewer, "email" | "userId">;

export const getViewerIdentity = cache(async (): Promise<ViewerIdentity> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? null : data?.claims?.sub ?? null;
  const claimEmail = data?.claims?.email;

  return {
    email: typeof claimEmail === "string" ? claimEmail : null,
    userId,
  };
});

export const getViewer = cache(async (): Promise<Viewer> => {
  const identity = await getViewerIdentity();

  if (!identity.userId) {
    return { ...identity, profile: null };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username,role,preferred_character_set,preferred_pronunciation,is_public")
    .eq("id", identity.userId)
    .maybeSingle();

  return {
    ...identity,
    profile,
  };
});
