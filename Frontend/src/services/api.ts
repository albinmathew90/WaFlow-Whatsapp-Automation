// ============================================================
// General API Service
// ============================================================

const BASE_URL = '/openwa-api';
const API_KEY = 'owa_k1_466b33226f05f4df85cd5621e0a5b31bfa314b1052e3b1b24e9d5388d6ff5bcf';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default {
  get: <T = any>(path: string, options?: RequestInit) => apiFetch<{ data: T } | T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, body?: any, options?: RequestInit) => apiFetch<{ data: T } | T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(path: string, body?: any, options?: RequestInit) => apiFetch<{ data: T } | T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(path: string, options?: RequestInit) => apiFetch<{ data: T } | T>(path, { ...options, method: 'DELETE' }),
};
