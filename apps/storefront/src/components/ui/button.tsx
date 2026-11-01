import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

const variants = {
  primary:
    "bg-shahtoot text-white hover:bg-shahtoot/90 active:bg-shahtoot/80 disabled:bg-shahtoot/40",
  secondary:
    "border border-lakeer bg-surface text-syahi hover:border-shahtoot/40 hover:bg-chandni",
  ghost: "text-shahtoot hover:bg-shahtoot/5",
  danger: "bg-khatra text-white hover:bg-khatra/90",
} as const

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-6 text-base",
} as const

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors",
    "touch-manipulation disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className
  )
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />
}
