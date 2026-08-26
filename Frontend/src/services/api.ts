// ============================================================
// General API Service
// ============================================================

const BASE_URL = '/openwa-api';
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
