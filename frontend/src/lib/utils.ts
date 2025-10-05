import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const withBasePath = (path: string) => {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  if (!normalizedPath) {
    return normalizedBase ? `${normalizedBase}/` : '/';
  }

  return `${normalizedBase}/${normalizedPath}`;
}
