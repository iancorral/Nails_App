/**
 * Reward rules, kept free of the Prisma client so the admin screens can import
 * them without dragging a database driver into the browser bundle. Data access
 * lives in rewards.server.ts. Same split as lib/pricing.ts.
 */
import type { Prisma, RewardProgram } from "@prisma/client";

export const REWARD_TYPES = ["PERCENT_DISCOUNT", "FIXED_AMOUNT", "FREE_SERVICE"] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

/**
 * Matches a stamp that still counts toward a balance.
 *
 * The `isSet` half is not defensive noise. On MongoDB a field that was never
 * written is absent rather than null, and Prisma's `redemptionId: null` does not
 * match an absent field — it silently matches nothing, which would show every
 * client a balance of zero. Stamps are always created with an explicit null, but
 * a filter whose failure mode is "quietly wrong" should not depend on that.
 */
export const UNSPENT_STAMP = {
  OR: [{ redemptionId: null }, { redemptionId: { isSet: false } }],
} satisfies Prisma.StampWhereInput;

type RewardTerms = Pick<RewardProgram, "rewardType" | "rewardValue" | "maxRewardValue">;

/**
 * What the reward is worth against a given bill, in whole pesos.
 *
 * Never exceeds the bill itself: a reward reduces what is owed, it does not
 * create change. `maxRewardValue` is what keeps "50% off" honest when the next
 * booking happens to be a $1,700 bridal package.
 */
export function computeRewardAmount(terms: RewardTerms, baseAmount: number): number {
  if (baseAmount <= 0) return 0;

  const cap = terms.maxRewardValue ?? Infinity;

  switch (terms.rewardType as RewardType) {
    case "PERCENT_DISCOUNT":
      return Math.round(Math.min(baseAmount * (terms.rewardValue / 100), cap, baseAmount));
    case "FIXED_AMOUNT":
      return Math.round(Math.min(terms.rewardValue, cap, baseAmount));
    case "FREE_SERVICE":
      return Math.round(Math.min(baseAmount, cap));
    default:
      return 0;
  }
}

/** Human summary of the program for the admin UI, e.g. "5 sellos = 50% · tope $600". */
export function describeReward(program: RewardProgram): string {
  const cap = program.maxRewardValue != null ? ` · tope $${program.maxRewardValue}` : "";

  switch (program.rewardType as RewardType) {
    case "PERCENT_DISCOUNT":
      return `${program.stampsRequired} sellos = ${program.rewardValue}% de descuento${cap}`;
    case "FIXED_AMOUNT":
      return `${program.stampsRequired} sellos = $${program.rewardValue} de descuento`;
    case "FREE_SERVICE":
      return `${program.stampsRequired} sellos = servicio gratis${cap}`;
    default:
      return `${program.stampsRequired} sellos`;
  }
}
