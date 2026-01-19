import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Map variants to SCSS classes from _badge.scss
const badgeVariants = cva(
  "badge",
  {
    variants: {
      variant: {
        default: "badge--primary", // Default maps to primary
        primary: "badge--primary",
        secondary: "badge--secondary",
        destructive: "badge--error", // Mapping destructive to error for consistency
        outline: "badge--ghost", // Mapping outline to ghost
        success: "badge--success",
        warning: "badge--warning",
        error: "badge--error",
        info: "badge--info",
        "subtle-primary": "badge--subtle-primary",
        "subtle-success": "badge--subtle-success",
        "subtle-warning": "badge--subtle-warning",
        "subtle-error": "badge--subtle-error",
        "subtle-info": "badge--subtle-info",
        ghost: "badge--ghost",
      },
      size: {
        default: "badge--medium",
        sm: "badge--small",
        lg: "badge--large",
      },
      shape: {
        default: "",
        pill: "badge--pill",
        square: "badge--square",
        circular: "badge--circular",
      },
      dot: {
        true: "badge--dot",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  shape,
  dot,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, shape, dot }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }