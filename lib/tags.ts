export type TagStyle = {
  id: string;
  slug: string;
  label: string;
  light_color: string;
  light_color_end: string;
  dark_color: string;
  dark_color_end: string;
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
  light_color_end: string;
  dark_color: string;
  dark_color_end: string;
  is_automatic: boolean;
};

export type ManageableUserTag = UserTag & {
  is_assigned: boolean;
};

export type TagDefinition = UserTag & {
  display_order: number;
};
