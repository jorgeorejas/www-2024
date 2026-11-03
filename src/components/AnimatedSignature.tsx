import {
  motion,
  useReducedMotion,
  type SVGMotionProps,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";
import { SIGNATURE_PATHS, SIGNATURE_VIEWBOX } from "./signature-paths";

export type SignatureProps = SVGMotionProps<SVGSVGElement> & {
  className?: string;
  /** "pen": drawn in the Margin pen blue (Flexoki blue-600); default uses currentColor */
  tone?: "pen" | "current";
};

const DRAW_DURATION = 0.01;
const createDrawVariant = (index: number): Variants => ({
  initial: { opacity: 0, strokeDashoffset: 1 },
  animate: {
    opacity: 1,
    strokeDashoffset: 0,
    transition: {
      opacity: { duration: 0.01, delay: index * DRAW_DURATION },
      strokeDashoffset: {
        ease: [0.4, 0, 0.2, 1],
        duration: DRAW_DURATION,
        delay: index * DRAW_DURATION,
      },
    },
  },
});

export const AnimatedSignature = ({
  className,
  tone = "current",
  ...props
}: SignatureProps) => {
  // With reduced motion the signature is simply there, already drawn
  const reduceMotion = useReducedMotion();
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={SIGNATURE_VIEWBOX}
      className={cn("w-full h-auto", tone === "pen" && "text-pen", className)}
      aria-label="Firma"
      {...props}
    >
      {SIGNATURE_PATHS.map((path, index) => (
        <motion.path
          key={index}
          d={path.d}
          strokeWidth={path.strokeWidth}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          variants={createDrawVariant(index)}
          initial={reduceMotion ? "animate" : "initial"}
          animate="animate"
        />
      ))}
    </motion.svg>
  );
};
