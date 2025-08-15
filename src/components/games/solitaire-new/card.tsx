import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { Card, Suit } from "./types.js";

const suits: Record<Suit, string> = {
  H: "♥",
  D: "♦",
  C: "♣",
  S: "♠",
};

const cardVariants = cva(
  "w-full aspect-5/7 select-none relative flex items-center justify-center p-3 shadow-sm rounded-sm border cursor-default pointer-events-none",
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
      <span className={clsx("absolute top-2 left-2", suitVariants({ color }))}>
        {suits[suit]}
      </span>
      <span className={clsx(rankVariants({ size }))}>
        {rank === 1
          ? "A"
          : rank === 11
            ? "J"
            : rank === 12
              ? "Q"
              : rank === 13
                ? "K"
                : rank}
      </span>
      <span
        className={clsx(
          "hidden md:block absolute bottom-2 right-2",
          suitVariants({ color }),
        )}
      >
        {suits[suit]}
      </span>
    </div>
  );
}

function EmptyCardStack({ suit }: { suit: keyof typeof suits }) {
  return (
    <div className="w-full aspect-5/7 border border-dashed border-zinc-700/50 rounded-sm flex items-center justify-center">
      <span className="text-zinc-700/50 text-2xl">{suits[suit]}</span>
    </div>
  );
}

Card.EmptyStack = EmptyCardStack;
