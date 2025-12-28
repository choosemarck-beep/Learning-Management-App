import { type ClassValue, clsx } from "clsx";

/**
 * Utility function to merge CSS class names
 * Useful for combining CSS Modules classes with conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

