const DEFAULT_API_BASE = "http://localhost:1994/api";

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const normalizeBase = (raw: string): string => {
  const value = raw.trim();
  if (!value) {
    return DEFAULT_API_BASE;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return trimTrailingSlashes(value);
  }

  if (value.startsWith("/")) {
    return trimTrailingSlashes(value);
  }

  return `/${trimTrailingSlashes(value.replace(/^\/+/, ""))}`;
};

const resolvedBase = normalizeBase(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE,
);

export const API_BASE_URL = resolvedBase;

export const buildApiUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};
