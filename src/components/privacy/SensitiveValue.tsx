"use client";

import { usePrivacy } from "./PrivacyProvider";

const MASK_CHARACTER = "•";
const MIN_MASK_LENGTH = 3;
const MAX_MASK_LENGTH = 6;

interface Props {
  children: React.ReactNode;
  /** Mask width in characters. Inferred from `children` when it is plain text. */
  maskLength?: number;
  className?: string;
}

/**
 * Replaces its content with a mask while privacy mode is on, so nothing sensitive
 * is on screen or in a screenshot. This guards against onlookers, not against the
 * browser itself: the admin's session still fetches the real values from the API.
 *
 * Prefer using this from a Client Component. Rendered from a Server Component the
 * masked value is still serialized into the RSC payload, and so remains in the
 * page source.
 */
export default function SensitiveValue({ children, maskLength, className }: Props) {
  const { hidden } = usePrivacy();

  if (!hidden) {
    return <span className={className}>{children}</span>;
  }

  const inferredLength =
    maskLength ??
    (typeof children === "string" || typeof children === "number"
      ? String(children).length
      : MIN_MASK_LENGTH);

  const length = Math.min(Math.max(inferredLength, MIN_MASK_LENGTH), MAX_MASK_LENGTH);

  return (
    <span className={`select-none ${className ?? ""}`} aria-label="Dato oculto">
      {MASK_CHARACTER.repeat(length)}
    </span>
  );
}
