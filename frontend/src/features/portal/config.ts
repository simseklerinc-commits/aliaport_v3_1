const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const fromApiBaseEnv = () => {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envValue) {
    return stripTrailingSlash(envValue);
  }
  const legacyValue = import.meta.env.VITE_API_URL?.trim();
  if (legacyValue) {
    try {
      const parsed = new URL(legacyValue);
      const normalizedPath = parsed.pathname.replace(/\/?api(?:\/v1)?\/?$/, '');
      return stripTrailingSlash(`${parsed.origin}${normalizedPath}`);
    } catch (_error) {
      return stripTrailingSlash(legacyValue.replace(/\/?api(?:\/v1)?\/?$/, ''));
    }
  }
  return '';
};

const fromBrowserContext = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  const { protocol, hostname, port } = window.location;
  if (!port || port === '80' || port === '443') {
    return stripTrailingSlash(`${protocol}//${hostname}`);
  }
  const preferredPort = port === '3000' || port === '3001' ? '8000' : port;
  return stripTrailingSlash(`${protocol}//${hostname}:${preferredPort}`);
};

const resolvePortalApiOrigin = () => {
  return fromApiBaseEnv() || fromBrowserContext() || 'http://localhost:8000';
};

export const PORTAL_API_ORIGIN = resolvePortalApiOrigin();
export const PORTAL_API_BASE = `${PORTAL_API_ORIGIN}/api/v1/portal`;
