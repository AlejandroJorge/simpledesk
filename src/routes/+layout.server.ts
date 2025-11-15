import type { LayoutServerLoad } from "./$types";
import { getRuntimeEnv } from "$lib/server/config";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    auth: {
      isAuthenticated: locals.auth?.isAuthenticated ?? false
    },
    user: locals.user,
    workspaceTimezone: getRuntimeEnv().workspaceTimezone
  };
};
