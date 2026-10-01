/**
 * Utility functions for styling and class merging.
 *
 * This file provides a standard `cn` helper combining `clsx` (for conditional
 * class expressions) and `tailwind-merge` (to resolve Tailwind class conflicts
 * such as overriding "px-2" with "px-4").
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple conditional class names into a single clean string,
 * automatically resolving conflicting Tailwind utility classes.
 *
 * @param inputs - List of class names, conditionals, or arrays
 * @returns Cleaned and merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric price into standard Kenyan Shillings (KES) currency string.
 *
 * @param amount - Number value of the price
 * @returns Formatted string (e.g., "KES 15,000")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a Date object or ISO string into a human-readable format.
 *
 * @param date - Date object or string
 * @returns Formatted date string (e.g., "Oct 14, 2026, 4:30 PM")
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
