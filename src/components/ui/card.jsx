import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card component using Fluent Design System 2 SCSS classes.
 * 
 * Variants:
 * - default: Standard card with subtle border and shadow
 * - elevated: Higher shadow, no border
 * - filled: Secondary background color
 * - outlined: Stronger border, no shadow
 * - ghost: Transparent background
 * 
 * Semantic states:
 * - success, warning, error, info: Left border accent
 * 
 * Sizes:
 * - compact: Less padding
 * - default: Standard padding
 * - comfortable: More padding
 * - spacious: Maximum padding
 */

const variantClasses = {
  default: "",
  elevated: "card--elevated",
  filled: "card--filled",
  outlined: "card--outlined",
  ghost: "card--ghost",
}

const stateClasses = {
  success: "card--success",
  warning: "card--warning",
  error: "card--error",
  info: "card--info",
}

const sizeClasses = {
  compact: "card--compact",
  default: "",
  comfortable: "card--comfortable",
  spacious: "card--spacious",
}

function Card({
  className,
  variant = "default",
  state,
  size = "default",
  interactive = false,
  ...props
}) {
  const variantClass = variantClasses[variant] || ""
  const stateClass = state ? stateClasses[state] : ""
  const sizeClass = sizeClasses[size] || ""

  return (
    <div
      data-slot="card"
      className={cn(
        "card",
        variantClass,
        stateClass,
        sizeClass,
        interactive && "card--interactive",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn("card__header", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }) {
  return (
    <div
      data-slot="card-title"
      className={cn("card__title", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot="card-description"
      className={cn("card__subtitle", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }) {
  return (
    <div
      data-slot="card-action"
      className={cn("card__actions", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }) {
  return (
    <div
      data-slot="card-content"
      className={cn("card__body", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("card__footer", className)}
      {...props}
    />
  )
}

function CardMedia({ className, position = "top", ...props }) {
  return (
    <div
      data-slot="card-media"
      className={cn(
        "card__media",
        position === "bottom" && "card__media--bottom",
        className
      )}
      {...props}
    />
  )
}

function CardDivider({ className, ...props }) {
  return (
    <hr
      data-slot="card-divider"
      className={cn("card__divider", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardMedia,
  CardDivider,
}
