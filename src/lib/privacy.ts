export const PRIVACY_COOKIE = "privacy_mode";

const ENABLED = "1";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function isPrivacyEnabled(cookieValue: string | undefined): boolean {
  return cookieValue === ENABLED;
}

/**
 * Persists the preference so the admin layout can read it during SSR and render
 * the masked value on first paint, instead of flashing the real one on hydration.
 */
export function persistPrivacyPreference(hidden: boolean): void {
  const value = hidden ? ENABLED : "0";
  document.cookie = `${PRIVACY_COOKIE}=${value}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
}
