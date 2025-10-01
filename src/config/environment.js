const sanitize = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
};

const resolveFallbackOrigin = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  const { protocol, host } = window.location;
  return `${protocol}//${host}`;
};

const envApiBase = sanitize(import.meta.env.VITE_ALERT_API_BASE_URL);
const envWsBase = sanitize(import.meta.env.VITE_ALERT_WS_URL);

const fallbackOrigin = !import.meta.env.DEV ? resolveFallbackOrigin() : '';

const apiBaseUrl = envApiBase || fallbackOrigin;
const wsUrl = envWsBase || (apiBaseUrl ? apiBaseUrl.replace(/^http/, 'ws') : '');

export const environment = {
  apiBaseUrl,
  wsUrl,
  isBackendConfigured: Boolean(envWsBase || envApiBase || fallbackOrigin),
};

export const buildApiUrl = (path) => {
  if (!apiBaseUrl) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};
