import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { appConfig, APP_SESSION_COOKIE } from "$lib/server/config";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!appConfig.authEnabled)
    throw redirect(303, "/dashboard");

  if (locals.auth?.isAuthenticated)
    throw redirect(303, url.searchParams.get("redirectTo") ?? "/dashboard");

  return {};
};

export const actions = {
  default: async ({ request, cookies, url }) => {
    if (!appConfig.authEnabled)
      throw redirect(303, "/dashboard");

    const data = await request.formData();
    const secret = (data.get("secret") as string | null)?.trim() ?? "";

    if (!secret)
      return fail(400, { message: "Secret is required" });

    if (secret !== appConfig.applicationSecret)
      return fail(401, { message: "Invalid secret" });

    const secure = url.protocol === "https:";

    cookies.set(APP_SESSION_COOKIE, crypto.randomUUID(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure,
      maxAge: 60 * 60 * 24 * 7
    });

    throw redirect(303, url.searchParams.get("redirectTo") ?? "/dashboard");
  }
} satisfies Actions;
