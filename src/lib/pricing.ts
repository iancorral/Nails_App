/**
 * Single source of truth for how much an appointment is worth and where it
 * belongs in the revenue breakdown. Kept free of React so both the API routes
 * and the admin client components derive the same numbers.
 */

/** Buckets an appointment can fall into on the revenue breakdown. */
export type RevenueBucket = "CASH" | "TRANSFER" | "CARD" | "PENDING" | "FREE";

/** Buckets that carry money. FREE is tracked apart and never sums into revenue. */
export const MONETARY_BUCKETS = ["CASH", "TRANSFER", "CARD", "PENDING"] as const;

/** Display order of the breakdown sections: money first, courtesy last. */
export const REVENUE_BUCKETS: readonly RevenueBucket[] = [...MONETARY_BUCKETS, "FREE"];

type PricedAppointment = {
  finalPrice?: number | null;
  services: { price: number }[];
};

/**
 * Amount charged for an appointment. An explicit `finalPrice` always wins over
 * the catalog total — including `0`, which is how a courtesy appointment is
 * recorded.
 */
export function getAppointmentAmount(appointment: PricedAppointment): number {
  return appointment.finalPrice != null
    ? Number(appointment.finalPrice)
    : appointment.services.reduce((total, service) => total + service.price, 0);
}

/**
 * Free (courtesy) appointments count as appointments but never as revenue, and
 * they need no payment method.
 */
export function isFreeAmount(amount: number): boolean {
  return amount <= 0;
}

/** Bucket an appointment belongs to, given its amount and recorded method. */
export function getRevenueBucket(
  amount: number,
  paymentMethod?: string | null
): RevenueBucket {
  if (isFreeAmount(amount)) return "FREE";

  const method = paymentMethod ?? "";
  return MONETARY_BUCKETS.includes(method as (typeof MONETARY_BUCKETS)[number])
    ? (method as RevenueBucket)
    : "PENDING";
}
