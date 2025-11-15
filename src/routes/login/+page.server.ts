import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { APP_SESSION_COOKIE, getRuntimeEnv } from "$lib/server/config";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "$lib/server/auth/password";
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from "$lib/server/auth/session";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.auth?.isAuthenticated)
    throw redirect(303, url.searchParams.get("redirectTo") ?? "/dashboard");

  return {};
};

export const actions = {
  default: async ({ request, cookies, url, locals }) => {
    if (locals.auth?.isAuthenticated)
      throw redirect(303, url.searchParams.get("redirectTo") ?? "/dashboard");

    const data = await request.formData();
    const username = (data.get("username") as string | null)?.trim() ?? "";
    const password = data.get("password");

    if (!username || typeof password !== "string" || password.length === 0)
      return fail(400, { message: "Username and password are required" });

    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!userRecord)
      return fail(401, { message: "Invalid username or password" });

    const passwordValid = await verifyPassword(password, userRecord.passwordHash);
    if (!passwordValid)
      return fail(401, { message: "Invalid username or password" });

    try {
      const secure = url.protocol === "https:";
      const sessionToken = createSessionToken(
        { userId: userRecord.id, issuedAt: Date.now() },
        getRuntimeEnv().sessionSecret
      );

      cookies.set(APP_SESSION_COOKIE, sessionToken, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure,
        maxAge: SESSION_MAX_AGE_SECONDS
      });
    } catch (err) {
      console.error("[auth] login", err);
      return fail(500, { message: "Unable to complete login" });
    }

    throw redirect(303, url.searchParams.get("redirectTo") ?? "/dashboard");
  }
} satisfies Actions;
