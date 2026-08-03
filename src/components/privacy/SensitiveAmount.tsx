"use client";

import SensitiveValue from "./SensitiveValue";
import { formatCurrency } from "@/lib/format";

interface Props {
  value: number;
  className?: string;
}

/**
 * Monetary value that honours privacy mode. Digits are rendered with tabular
 * figures so amounts keep the same width across rows and toggling privacy does
 * not reflow the column.
 */
export default function SensitiveAmount({ value, className }: Props) {
  return (
    <SensitiveValue className={`tabular-nums ${className ?? ""}`}>
      {formatCurrency(value)}
    </SensitiveValue>
  );
}
