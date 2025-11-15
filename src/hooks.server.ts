import { redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit";
import { APP_SESSION_COOKIE, getRuntimeEnv } from "$lib/server/config";
import { parseSessionToken } from "$lib/server/auth/session";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

const isPublicRoute = (pathname: string) => pathname === "/login" || pathname === "/register";
const isAssetRequest = (pathname: string) => pathname.startsWith("/_app/") || pathname.startsWith("/favicon");

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(APP_SESSION_COOKIE);
  let user: { id: string; username: string } | null = null;

  if (sessionToken) {
    const parsed = parseSessionToken(sessionToken, getRuntimeEnv().sessionSecret);
    if (parsed) {
      const [record] = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.id, parsed.userId))
        .limit(1);

      if (record)
        user = record;
      else
        event.cookies.delete(APP_SESSION_COOKIE, { path: "/" });
    } else {
      event.cookies.delete(APP_SESSION_COOKIE, { path: "/" });
    }
  }

  event.locals.user = user;
  event.locals.auth = {
    isAuthenticated: Boolean(user)
  };

  if (isAssetRequest(event.url.pathname))
    return resolve(event);

  if (!user && !isPublicRoute(event.url.pathname)) {
    const redirectTarget = encodeURIComponent(event.url.pathname + event.url.search);
    throw redirect(303, `/login${redirectTarget ? `?redirectTo=${redirectTarget}` : ""}`);
  }

  if (user && isPublicRoute(event.url.pathname))
    throw redirect(303, "/dashboard");

  return resolve(event);
};
