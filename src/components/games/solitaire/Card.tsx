import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { Card, Rank, Suit } from "./types.js";

const suits: Record<Suit, string> = {
  H: "♥",
  D: "♦",
  C: "♣",
  S: "♠",
};
const ranks: Record<Rank, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};
const cardVariants = cva(
  "w-full aspect-5/7 select-none relative flex items-center justify-center p-3 shadow-sm rounded-sm border",
  {
    variants: {
      faceDown: {
        true: "bg-linear-to-tl from-zinc-500 to-zinc-700 border-zinc-600",
        false: "bg-zinc-50 border-zinc-200",
      },
      size: {
        sm: "p-2",
        md: "p-3",
        lg: "p-4",
      },
    },
    defaultVariants: {
      faceDown: false,
      size: "md",
    },
  },
);

const suitVariants = cva("text-sm", {
  variants: {
    color: {
      red: "text-red-600/75",
      black: "text-zinc-800/75",
    },
  },
  defaultVariants: {
    color: "black",
  },
});

const rankVariants = cva("font-mono", {
  variants: {
    size: {
      sm: "text-lg",
      md: "text-2xl",
      lg: "text-3xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface CardProps extends VariantProps<typeof cardVariants> {
  card: Card;
  className?: string;
}

export default function Card({
  card,
  size = "md",
  className,
  ...props
}: CardProps) {
  const { suit, rank, color, faceUp } = card;

  if (!faceUp) {
    return (
      <div
        className={clsx(
          cardVariants({ faceDown: true, size, ...props }),
          className,
        )}
      />
    );
  }

  const cardClass = cardVariants({
    faceDown: false,
    size,
    ...props,
    className,
  });

  return (
    <div className={cardClass}>
      <span
        className={clsx(
          "absolute top-2 left-2 flex flex-col",
          suitVariants({ color }),
        )}
      >
        <span className="text-xs hidden md:inline">{ranks[rank]}</span>
        {suits[suit]}
      </span>
      <span className={clsx(rankVariants({ size }), suitVariants({ color }))}>
        {ranks[rank]}
      </span>
    </div>
  );
}

function EmptyCardStack({ suit }: { suit: keyof typeof suits }) {
  return (
    <div className="w-full aspect-5/7 border border-dashed border-zinc-700/50 rounded-sm flex items-center justify-center select-none">
      <span className="text-zinc-700/50 text-2xl">{suits[suit]}</span>
    </div>
  );
}

Card.EmptyStack = EmptyCardStack;
