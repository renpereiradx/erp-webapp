import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

/**
 * Button component using Fluent Design System 2 SCSS classes.
 * 
 * Variants:
 * - default/primary: Primary action button
 * - secondary: Outlined button for secondary actions
 * - ghost: Transparent background, visible on hover
 * - subtle: Soft background color
 * - destructive: For delete/danger actions
 * - danger: Critical/destructive actions
 * - success: Positive confirmation actions
 * - warning: Cautionary actions
 * - link: Text-only button styled as link
 * 
 * Sizes:
 * - sm: Small (24px height)
 * - default/md: Medium (32px height)
 * - lg: Large (40px height)
 * - icon: Square icon-only button
 * 
 * Additional modifiers:
 * - loading: Shows loading spinner
 * - block: Full width button
 * - circular: Circular border radius
 * - pill: Pill-shaped border radius
 */

const variantClasses = {
  default: "btn--primary",
  primary: "btn--primary",
  secondary: "btn--secondary",
  ghost: "btn--ghost",
  subtle: "btn--subtle",
  destructive: "btn--destructive",
  danger: "btn--danger",
  success: "btn--success",
  warning: "btn--warning",
  outline: "btn--secondary",
  link: "btn--ghost",
  filter: "btn--filter",
}

const sizeClasses = {
  default: "",
  sm: "btn--small",
  md: "",
  lg: "btn--large",
  icon: "btn--icon-only",
}

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  block = false,
  circular = false,
  pill = false,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"
  
  const variantClass = variantClasses[variant] || variantClasses.default
  const sizeClass = sizeClasses[size] || ""
  
  const classes = cn(
    "btn",
    variantClass,
    sizeClass,
    {
      "btn--loading": loading,
      "btn--block": block,
      "btn--circular": circular,
      "btn--pill": pill,
    },
    // Handle link variant special case
    variant === "link" && "btn--link",
    className
  )

  return (
    <Comp
      data-slot="button"
      className={classes}
      disabled={loading || props.disabled}
      {...props}
    />
  )
}

// Export buttonVariants for backward compatibility with existing code
// that may use the CVA pattern
const buttonVariants = ({ variant = "default", size = "default", className = "" } = {}) => {
  const variantClass = variantClasses[variant] || variantClasses.default
  const sizeClass = sizeClasses[size] || ""
  return cn("btn", variantClass, sizeClass, className)
}

export { Button, buttonVariants }
