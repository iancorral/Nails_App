interface Props {
  className?: string;
}

/**
 * Price slot for a courtesy appointment. Used wherever an amount would go, so
 * a free appointment never renders as "$0".
 */
export default function FreeTag({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider bg-salon-lavender/10 text-salon-lavender border-salon-lavender/30 ${className}`}
    >
      Gratis
    </span>
  );
}
