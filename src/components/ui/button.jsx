import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

/**
 * Button component refactored to use 100% Tailwind CSS utilities.
 */

const variantClasses = {
  default: "bg-[#0078d4] text-white hover:bg-[#106ebe] active:bg-[#005a9e] border-transparent",
  primary: "bg-[#0078d4] text-white hover:bg-[#106ebe] active:bg-[#005a9e] border-transparent",
  secondary: "bg-white text-[#242424] border-[#d1d1d1] hover:bg-[#f3f2f1] active:bg-[#edebe9]",
  outline: "bg-white text-[#242424] border-[#d1d1d1] hover:bg-[#f3f2f1] active:bg-[#edebe9]",
  ghost: "bg-transparent text-[#242424] border-transparent hover:bg-[#f3f2f1] active:bg-[#edebe9]",
  subtle: "bg-[#f3f2f1] text-[#242424] border-transparent hover:bg-[#edebe9] active:bg-[#e1dfdd]",
  destructive: "bg-[#a4262c] text-white border-transparent hover:bg-[#82191f] active:bg-[#740a12]",
  danger: "bg-[#a4262c] text-white border-transparent hover:bg-[#82191f] active:bg-[#740a12]",
  success: "bg-[#107c10] text-white border-transparent hover:bg-[#0b5a0b] active:bg-[#094509]",
  warning: "bg-[#fff4ce] text-[#242424] border-transparent hover:bg-[#fde7e9]",
  link: "bg-transparent text-[#0078d4] border-transparent hover:underline p-0 h-auto",
  text: "bg-transparent text-[#242424] border-transparent hover:bg-[#f3f2f1]",
  filter: "bg-white text-[#242424] border-[#d1d1d1] hover:border-[#0078d4] hover:text-[#0078d4]",
}

const sizeClasses = {
  default: "h-8 px-4 py-1.5",
  sm: "h-6 px-2 text-[11px]",
  md: "h-8 px-4 py-1.5",
  lg: "h-10 px-6 py-2 text-base",
  icon: "h-8 w-8 p-0 flex items-center justify-center",
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
  const sizeClass = sizeClasses[size] || sizeClasses.default
  
  const classes = cn(
    "inline-flex items-center justify-center rounded-[4px] text-sm font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none border select-none cursor-pointer",
    variantClass,
    sizeClass,
    block && "w-full",
    circular && "rounded-full aspect-square",
    pill && "rounded-full px-6",
    loading && "relative !text-transparent pointer-events-none",
    className
  )

  return (
    <Comp
      data-slot="button"
      className={classes}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-current">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      {props.children}
    </Comp>
  )
}

const buttonVariants = ({ variant = "default", size = "default", className = "" } = {}) => {
  const variantClass = variantClasses[variant] || variantClasses.default
  const sizeClass = sizeClasses[size] || sizeClasses.default
  return cn("inline-flex items-center justify-center rounded-[4px] text-sm font-semibold transition-all border", variantClass, sizeClass, className)
}

export { Button, buttonVariants }
