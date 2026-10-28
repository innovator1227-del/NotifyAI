import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        critical: "border-critical/40 bg-critical/15 text-critical",
        high: "border-high/40 bg-high/15 text-high",
        medium: "border-medium/40 bg-medium/15 text-medium",
        low: "border-low/40 bg-low/10 text-low",
        ai: "border-violet/40 bg-violet/15 text-violet",
        fallback: "border-border bg-muted text-muted-foreground",
        soft: "border-border bg-secondary/60 text-secondary-foreground font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
function Badge({ className, variant, ...props }) {
  return _jsx("div", {
    className: cn(badgeVariants({ variant }), className),
    ...props,
  });
}
export { Badge, badgeVariants };
