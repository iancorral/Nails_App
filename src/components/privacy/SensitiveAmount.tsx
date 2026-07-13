"use client";

import SensitiveValue from "./SensitiveValue";
import { formatCurrency } from "@/lib/format";

interface Props {
  value: number;
  className?: string;
}

export default function SensitiveAmount({ value, className }: Props) {
  return <SensitiveValue className={className}>{formatCurrency(value)}</SensitiveValue>;
}
