import type { LayoutServerLoad } from "./$types";
import { appConfig } from "$lib/server/config";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    auth: {
      enabled: appConfig.authEnabled,
      isAuthenticated: locals.auth?.isAuthenticated ?? false
    }
  };
};
