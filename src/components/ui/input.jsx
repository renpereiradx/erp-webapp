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
        "input",
        variantClass,
        stateClass,
        sizeClass,
        className
      )}
      {...props}
    />
  )
}

export { Input }
