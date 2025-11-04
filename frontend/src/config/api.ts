const DEFAULT_API_ORIGIN = "http://localhost:1994";

const normalizeUrl = (url: string) => url.replace(/\/+$/, "");

const apiOrigin = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN,
);

export const API_ORIGIN = apiOrigin;

export const API_BASE_URL = `${apiOrigin}/api`;

export const buildApiUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};

export const buildApiOriginUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
};

