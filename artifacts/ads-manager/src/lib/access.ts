/**
 * Frontend-only access gate password.
 *
 * CHANGE YOUR PASSWORD HERE — edit the value in quotes below.
 * (Or set a VITE_ACCESS_PASSWORD env var before building to override it.)
 *
 * Note: this is a casual, client-side lock. It keeps regular visitors out,
 * but is not bank-grade security. For true protection use a real login.
 */
export const ACCESS_PASSWORD =
  (import.meta.env.VITE_ACCESS_PASSWORD as string | undefined)?.trim() || "meta2026";

/** localStorage key that marks this device as unlocked. */
export const ACCESS_KEY = "metabs_access_ok";
