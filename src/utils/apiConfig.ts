const PRODUCTION_API_URL = 'https://college-placement-backend-two.vercel.app/api';
const DEVELOPMENT_API_URL = 'http://localhost:5001/api';

export const RAW_API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API_URL : DEVELOPMENT_API_URL);

export const NORMALIZED_API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

export const API_BASE_URL = NORMALIZED_API_BASE_URL.endsWith('/api')
  ? NORMALIZED_API_BASE_URL
  : `${NORMALIZED_API_BASE_URL}/api`;

export const API_ORIGIN = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;
