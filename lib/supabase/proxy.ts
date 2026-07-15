import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasPermission } from "@/lib/auth/roles";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/auth/callback",
  "/dictionary",
  "/dictionary/search",
  "/community",
  "/community/featured",
  "/community/browse",
  "/community/jingdex",
]);
const LOGGED_IN_REDIRECT_PATHS = new Set(["/login"]);
const MODERATOR_PATHS = new Set(["/demo"]);
const PUBLIC_PATH_PREFIXES = ["/users/"];
const GUEST_RENDERABLE_PATHS = new Set([
  "/dictionary/contribute",
  "/community/review",
  "/my-stuff",
  "/settings",
  "/reset-password",
  "/demo",
]);

function matchesPath(pathname: string, paths: ReadonlySet<string>) {
  return [...paths].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (matchesPath(pathname, GUEST_RENDERABLE_PATHS)) return true;

  return pathname.startsWith("/community/")
    && !pathname.startsWith("/community/review");
}

function redirectWithNext(request: NextRequest, pathname: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const isLoggedIn = !error && Boolean(userId);
  const isPublicRequest = isPublicPath(request.nextUrl.pathname);
  const requiresModerator = matchesPath(request.nextUrl.pathname, MODERATOR_PATHS);

  if (!isLoggedIn && !isPublicRequest) {
    return redirectWithNext(request, "/login");
  }

  if (!isLoggedIn) {
    return supabaseResponse;
  }

  const needsProfile =
    requiresModerator ||
    LOGGED_IN_REDIRECT_PATHS.has(request.nextUrl.pathname);
  const { data: profile } = needsProfile
    ? await supabase
        .from("profiles")
        .select("id,role")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  if (requiresModerator && !profile) {
    return redirectWithNext(request, "/login");
  }

  if (
    requiresModerator &&
    !hasPermission(profile?.role, "accessModerationPage")
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/settings/account";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (profile && LOGGED_IN_REDIRECT_PATHS.has(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
