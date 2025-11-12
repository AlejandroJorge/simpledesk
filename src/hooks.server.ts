import { redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit";
import { appConfig, APP_SESSION_COOKIE } from "$lib/server/config";

const isLoginRoute = (pathname: string) => pathname === "/login";
const isAssetRequest = (pathname: string) => pathname.startsWith("/_app/") || pathname.startsWith("/favicon");

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(APP_SESSION_COOKIE);
  const authenticated = Boolean(sessionToken);

  event.locals.auth = {
    enabled: appConfig.authEnabled,
    isAuthenticated: appConfig.authEnabled ? authenticated : true
  };

  if (!appConfig.authEnabled || isAssetRequest(event.url.pathname))
    return resolve(event);

  if (!authenticated && !isLoginRoute(event.url.pathname)) {
    const redirectTarget = encodeURIComponent(event.url.pathname + event.url.search);
    throw redirect(303, `/login${redirectTarget ? `?redirectTo=${redirectTarget}` : ""}`);
  }

  if (authenticated && isLoginRoute(event.url.pathname))
    throw redirect(303, "/dashboard");

  return resolve(event);
};
