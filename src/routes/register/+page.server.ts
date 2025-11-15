import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "$lib/server/auth/password";
import { APP_SESSION_COOKIE, getRuntimeEnv } from "$lib/server/config";
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from "$lib/server/auth/session";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.auth?.isAuthenticated)
    throw redirect(303, url.searchParams.get("redirectTo") ?? "/dashboard");

  return {};
};

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

export const actions = {
  default: async ({ request, cookies, url, locals }) => {
    if (locals.auth?.isAuthenticated)
      throw redirect(303, "/dashboard");

    const data = await request.formData();
    const username = (data.get("username") as string | null)?.trim() ?? "";
    const password = data.get("password");

    if (username.length < MIN_USERNAME_LENGTH)
      return fail(400, { message: `Username must be at least ${MIN_USERNAME_LENGTH} characters` });

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH)
      return fail(400, { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0)
      return fail(400, { message: "That username is already taken" });

    try {
      const passwordHash = await hashPassword(password);
      await db.insert(users).values({ username, passwordHash });
    } catch (err) {
      console.error("[auth] register", err);
      return fail(500, { message: "Unable to create user" });
    }

    const [userRecord] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!userRecord)
      return fail(500, { message: "Unable to complete registration" });

    const sessionToken = createSessionToken(
      { userId: userRecord.id, issuedAt: Date.now() },
      getRuntimeEnv().sessionSecret
    );

    const secure = url.protocol === "https:";
    cookies.set(APP_SESSION_COOKIE, sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure,
      maxAge: SESSION_MAX_AGE_SECONDS
    });

    throw redirect(303, url.searchParams.get("redirectTo") ?? "/dashboard");
  }
} satisfies Actions;
