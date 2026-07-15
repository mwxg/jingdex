export type TagStyle = {
  id: string;
  slug: string;
  label: string;
  light_color: string;
  dark_color: string;
  is_system: boolean;
};

export type UserTag = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  style_id: string;
  style_slug: string;
  style_label: string;
  light_color: string;
  dark_color: string;
  is_automatic: boolean;
};

export type ManageableUserTag = UserTag & {
  is_assigned: boolean;
};

export type TagDefinition = UserTag & {
  display_order: number;
};
