/**
 * A phone number is the only stable identity Tangible has for a client, so it
 * needs exactly one canonical form. Everything written to Customer.phone goes
 * through here, and so does every lookup.
 */

/** Mexican national numbers are 10 digits. */
const NATIONAL_LENGTH = 10;

/**
 * Canonical form of a phone number, or null when there are not enough digits to
 * identify anyone. Callers treat null as "this client cannot be linked", which
 * is a valid state: appointments are deliberately allowed without a phone.
 *
 * Note what this does NOT do: it never trims digits off a number it does not
 * recognize. Splitting one client into two records is a cosmetic problem;
 * merging two clients into one would hand someone else's history — and later,
 * someone else's stamps — to the wrong person.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");

  if (digits.length < NATIONAL_LENGTH) return null;
  if (digits.length === NATIONAL_LENGTH) return digits;

  // Country code, and the legacy "1" that Mexican WhatsApp numbers carried.
  // "6141234567", "526141234567" and "5216141234567" are the same client.
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("521")) return digits.slice(3);

  return digits;
}

/** Display form for the admin UI: 614 123 4567. */
export function formatPhone(phone: string): string {
  return phone.length === NATIONAL_LENGTH
    ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
    : phone;
}

/**
 * List form: ••• ••• 4567. Enough to tell two clients apart at a glance without
 * putting a full contact number on screen in a room where other people can see it.
 */
export function maskPhone(phone: string): string {
  const tail = phone.slice(-4);
  return phone.length === NATIONAL_LENGTH ? `••• ••• ${tail}` : `••• ${tail}`;
}
