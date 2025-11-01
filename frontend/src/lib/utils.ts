import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const withBasePath = (path: string) => {
  // 如果已经是完整的URL（http/https），直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // data: 或 blob: 等特殊协议直接返回，避免破坏 base64/本地 Blob
  if (path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  if (!normalizedPath) {
    return normalizedBase ? `${normalizedBase}/` : '/';
  }

  return `${normalizedBase}/${normalizedPath}`;
}
