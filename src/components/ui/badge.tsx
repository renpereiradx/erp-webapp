import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// size/shape own font-size, padding and radius: cn() has no tailwind-merge,
// so any of these in the base would race the variants in the stylesheet cascade.
const badgeVariants = cva(
  "inline-flex items-center border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        destructive:
          "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/80",
        success:
          "border-transparent bg-green-500 text-slate-50 hover:bg-green-500/80 dark:bg-green-900 dark:text-slate-50 dark:hover:bg-green-900/80",
        warning:
          "border-transparent bg-yellow-500 text-slate-50 hover:bg-yellow-500/80 dark:bg-yellow-900 dark:text-slate-50 dark:hover:bg-yellow-900/80",
        info:
          "border-transparent bg-blue-500 text-slate-50 hover:bg-blue-500/80 dark:bg-blue-900 dark:text-slate-50 dark:hover:bg-blue-900/80",
        outline: "text-slate-950 dark:text-slate-50",
      },
      size: {
        default: "rounded-full px-2.5 py-0.5 text-xs",
        sm: "rounded-full px-2 py-0.25 text-[0.6667rem]",
        lg: "rounded-full px-3 py-1 text-sm",
      },
      shape: {
        default: "rounded-full",
        square: "rounded-md",
        pill: "rounded-full",
      },
      dot: {
        true: "pl-1.5",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
      asChild?: boolean
    }

function Badge({ className, variant, size, shape, dot, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, shape, dot }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
