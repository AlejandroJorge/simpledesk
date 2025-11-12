import { env } from "$env/dynamic/private";

const normalize = (value?: string) => value?.trim() ?? "";

export const APP_SESSION_COOKIE = "app_session";

export const appConfig = {
  authEnabled: normalize(env.AUTH).toLowerCase() === "true",
  applicationSecret: normalize(env.APPLICATION_SECRET),
  databaseUrl: normalize(env.DATABASE_URL)
};
