/**
 * Destination for NFC sticker #1, served through the /review route.
 *
 * The official entry point for leaving a Google review is
 * `https://search.google.com/local/writereview?placeid=<PLACE_ID>`. A Maps URL
 * is NOT a review URL: it opens the listing, not the star picker.
 *
 * PLACE_ID below was derived from the studio's Maps listing — the
 * `!1s0x86ea5b3b80a9f203:0x88975646ce3b5096` pair in the URL is the (feature id,
 * CID) tuple that a `ChIJ…` Place ID encodes. It must be confirmed on a real
 * phone before the sticker is written; /admin/qr has the test link.
 *
 * Set GOOGLE_REVIEW_URL to override without touching code or re-writing the tag.
 */

const STUDIO_PLACE_ID = "ChIJA_KpgDtb6oYRllA7zkZWl4g";

/** Official "write a review" form for the studio. */
export const GOOGLE_WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${STUDIO_PLACE_ID}`;

/** The public listing, derived from the same Maps URL. Used only as a fallback. */
export const GOOGLE_LISTING_URL = "https://www.google.com/maps?cid=9842430372749201558";

/**
 * Hosts the sticker is allowed to send a client to. Without this check a
 * mistyped or tampered GOOGLE_REVIEW_URL would turn a sticker sitting on the
 * counter into an open redirect, which is exactly the kind of thing nobody
 * would notice until it mattered.
 */
const ALLOWED_HOSTS = new Set([
  "search.google.com",
  "www.google.com",
  "google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "g.page",
]);

function isAllowedGoogleUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Where /review sends the client. Falls back to the built-in review form when
 * the environment variable is missing or points somewhere unexpected, so the
 * sticker never dead-ends.
 */
export function getGoogleReviewUrl(): string {
  const configured = process.env.GOOGLE_REVIEW_URL?.trim();
  if (configured && isAllowedGoogleUrl(configured)) return configured;

  if (configured) {
    console.warn("GOOGLE_REVIEW_URL is set but not an allowed Google URL; using the default.");
  }
  return GOOGLE_WRITE_REVIEW_URL;
}
