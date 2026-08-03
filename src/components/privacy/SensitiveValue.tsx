"use client";

import { usePrivacy } from "./PrivacyProvider";

/**
 * The one placeholder every masked value renders. It is deliberately constant:
 * a mask sized after the real value would leak its magnitude and make amounts
 * jump around as rows change.
 */
const MASK = "••••••";

interface Props {
  children: React.ReactNode;
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
export default function SensitiveValue({ children, className }: Props) {
  const { hidden } = usePrivacy();

  if (!hidden) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`select-none ${className ?? ""}`}
      aria-label="Dato oculto"
      title="Dato oculto"
    >
      {MASK}
    </span>
  );
}
