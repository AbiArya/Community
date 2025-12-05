/**
 * Utility for conditionally joining classNames together.
 * A lightweight alternative to clsx/classnames.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

