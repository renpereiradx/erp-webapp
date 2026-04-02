import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: "outlined" | "filled" | "underlined";
  state?: "error" | "success" | "warning" | "";
  size?: "sm" | "default" | "md" | "lg";
}

const variantClasses = {
  outlined: "",
  filled: "input--filled",
  underlined: "input--underlined",
}

const stateClasses = {
  error: "input--error",
  success: "input--success",
  warning: "input--warning",
  "": "",
}

const sizeClasses = {
  sm: "input--small",
  default: "",
  md: "",
  lg: "input--large",
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "outlined", state, size = "default", ...props }, ref) => {
    const variantClass = variantClasses[variant] || ""
    const stateClass = state ? stateClasses[state] : ""
    const sizeClass = sizeClasses[size] || ""

    return (
      <input
        type={type}
        ref={ref}
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
)
Input.displayName = "Input"

export { Input }
