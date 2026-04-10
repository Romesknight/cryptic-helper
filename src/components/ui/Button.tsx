import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          "min-h-[44px] min-w-[44px]",
          {
            "bg-primary text-white hover:bg-emerald-700 active:bg-emerald-800":
              variant === "primary",
            "bg-secondary text-white hover:bg-amber-700 active:bg-amber-800":
              variant === "secondary",
            "border border-border bg-transparent hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-800":
              variant === "outline",
            "bg-transparent hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-800":
              variant === "ghost",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
