export const tagStyleKeys = [
  "neutral",
  "moderator",
  "admin",
  "developer",
  "contributor",
  "supporter",
] as const;

export type TagStyleKey = (typeof tagStyleKeys)[number];

export type UserTag = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  style_key: string;
  is_automatic: boolean;
};

export type ManageableUserTag = UserTag & {
  is_assigned: boolean;
};

export function isTagStyleKey(value: string): value is TagStyleKey {
  return tagStyleKeys.includes(value as TagStyleKey);
}
