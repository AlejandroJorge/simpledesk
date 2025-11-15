import { env } from "$env/dynamic/private";

const normalize = (value?: string) => value?.trim() ?? "";

const assertPresent = (value: string, name: string) => {
  if (!value)
    throw new Error(`${name} is not set`);
  return value;
};

const isValidTimezone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const resolveTimezone = (value?: string) => {
  const normalized = normalize(value) || "UTC";
  return isValidTimezone(normalized) ? normalized : "UTC";
};

export const APP_SESSION_COOKIE = "app_session";

export function getRuntimeEnv() {
  return {
    sessionSecret: assertPresent(normalize(env.SESSION_SECRET), "SESSION_SECRET"),
    databaseUrl: assertPresent(normalize(env.DATABASE_URL), "DATABASE_URL"),
    workspaceTimezone: resolveTimezone(env.WORKSPACE_TIMEZONE)
  }
};
