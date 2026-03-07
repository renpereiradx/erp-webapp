import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input component using Fluent Design System 2 SCSS classes.
 * 
 * Variants:
 * - outlined (default): Standard outlined input
 * - filled: Stronger background color
 * - underlined: Minimal style with bottom border only
 * 
 * States:
 * - error: Red border for validation errors
 * - success: Green border for success state
 * - warning: Yellow border for warnings
 * 
 * Sizes:
 * - sm: Small (24px height)
 * - default/md: Medium (32px height)  
 * - lg: Large (40px height)
 */

const variantClasses = {
  outlined: "",
  filled: "input--filled",
  underlined: "input--underlined",
}

const stateClasses = {
  error: "input--error",
  success: "input--success",
  warning: "input--warning",
}

const sizeClasses = {
  sm: "input--small",
  default: "",
  md: "",
  lg: "input--large",
}

function Input({
  className,
  type,
  variant = "outlined",
  state,
  size = "default",
  ...props
}) {
  const variantClass = variantClasses[variant] || ""
  const stateClass = state ? stateClasses[state] : ""
  const sizeClass = sizeClasses[size] || ""

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        variantClass,
        stateClass,
        sizeClass,
        size === "sm" && "h-8 px-2 text-xs",
        size === "default" && "h-10",
        size === "lg" && "h-12 px-4 text-base",
        className
      )}
      {...props}
    />
  )
}

export { Input }
