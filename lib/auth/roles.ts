export const appRoles = ["member", "moderator", "admin", "developer"] as const;

export type AppRole = (typeof appRoles)[number];

export const administrativeRoles = ["moderator", "admin", "developer"] as const;

export type AdministrativeRole = (typeof administrativeRoles)[number];

export const roleLabels = {
  member: "Member",
  moderator: "Moderator",
  admin: "Admin",
  developer: "Developer",
} as const satisfies Record<AppRole, string>;

export type AppPermission =
  | "accessModerationPage"
  | "searchUsers"
  | "manageCommunityDecks"
  | "reviewTermSubmissions"
  | "manageTerms"
  | "manageModeratorRole"
  | "manageAdminRole"
  | "manageUserTags";

export const rolePermissions: Readonly<Record<AppRole, readonly AppPermission[]>> = {
  member: [],
  moderator: ["accessModerationPage", "searchUsers"],
  admin: [
    "accessModerationPage",
    "searchUsers",
    "manageCommunityDecks",
    "reviewTermSubmissions",
    "manageTerms",
    "manageModeratorRole",
  ],
  developer: [
    "accessModerationPage",
    "searchUsers",
    "manageCommunityDecks",
    "reviewTermSubmissions",
    "manageTerms",
    "manageModeratorRole",
    "manageAdminRole",
    "manageUserTags",
  ],
};

export function isAppRole(role: string | null | undefined): role is AppRole {
  return appRoles.includes(role as AppRole);
}

export function hasPermission(
  role: string | null | undefined,
  permission: AppPermission,
) {
  return isAppRole(role) && rolePermissions[role].includes(permission);
}

export function getAdministrativeRole(role: string | null | undefined) {
  return hasPermission(role, "accessModerationPage")
    ? (role as AdministrativeRole)
    : null;
}

export function canEditRole(
  actorRole: string | null | undefined,
  targetRole: string | null | undefined,
) {
  if (targetRole === "member" || targetRole === "moderator") {
    return hasPermission(actorRole, "manageModeratorRole");
  }

  if (targetRole === "admin") {
    return hasPermission(actorRole, "manageAdminRole");
  }

  return false;
}

export function getAssignableRoles(actorRole: string | null | undefined) {
  const roles: AppRole[] = ["member"];

  if (hasPermission(actorRole, "manageModeratorRole")) {
    roles.push("moderator");
  }

  if (hasPermission(actorRole, "manageAdminRole")) {
    roles.push("admin");
  }

  return roles;
}
