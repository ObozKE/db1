/**
 * Alert Component
 *
 * Used for prominent success, warning, or error messages.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success";
}

export function Alert({
  className,
  variant = "default",
  children,
  ...props
}: AlertProps) {
  const variants = {
    default: "bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100",
    destructive: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
    warning: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}
