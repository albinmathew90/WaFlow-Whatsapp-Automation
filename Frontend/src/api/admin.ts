const BASE_URL = '/openwa-api/admin';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const AdminAPI = {
  // Auth
  login: (email: string, password: string) => fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  }).then(res => res.json()),
  
  verify2FALogin: (email: string, password: string, code: string) => fetch(`${BASE_URL}/auth/verify-2fa`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, code })
  }).then(res => res.json()),

  // Forgot Password
  forgotPassword: () => fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json()),
  
  verifyResetOtp: (code: string) => fetch(`${BASE_URL}/auth/verify-reset-otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
  }).then(res => res.json()),

  resetPassword: (code: string, newPassword: string) => fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, newPassword })
  }).then(res => res.json()),

  // Users
  getUsers: () => fetch(`${BASE_URL}/users`, { headers: getHeaders() }).then(handleResponse),
  createUser: (data: any) => fetch(`${BASE_URL}/users`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  updateUser: (id: number, data: any) => fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  deleteUser: (id: number) => fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Blogs
  getBlogs: () => fetch(`${BASE_URL}/blogs`, { headers: getHeaders() }).then(handleResponse),
  createBlog: (data: any) => fetch(`${BASE_URL}/blogs`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  updateBlog: (id: number, data: any) => fetch(`${BASE_URL}/blogs/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  deleteBlog: (id: number) => fetch(`${BASE_URL}/blogs/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Topics
  getTopics: () => fetch(`${BASE_URL}/topics`, { headers: getHeaders() }).then(handleResponse),
  createTopic: (data: any) => fetch(`${BASE_URL}/topics`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  updateTopic: (id: number, data: any) => fetch(`${BASE_URL}/topics/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  deleteTopic: (id: number) => fetch(`${BASE_URL}/topics/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Media
  getMedia: () => fetch(`${BASE_URL}/media`, { headers: getHeaders() }).then(handleResponse),
  createMedia: (data: any) => fetch(`${BASE_URL}/media`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  deleteMedia: (id: number) => fetch(`${BASE_URL}/media/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // SEO
  getSeo: () => fetch(`${BASE_URL}/seo`, { headers: getHeaders() }).then(handleResponse),
  createSeo: (data: any) => fetch(`${BASE_URL}/seo`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  updateSeo: (id: number, data: any) => fetch(`${BASE_URL}/seo/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  deleteSeo: (id: number) => fetch(`${BASE_URL}/seo/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Settings
  getSettings: () => fetch(`${BASE_URL}/settings`, { headers: getHeaders() }).then(handleResponse),
  updateSettings: (data: any) => fetch(`${BASE_URL}/settings`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),

  // Profile & 2FA
  getProfile: () => fetch(`${BASE_URL}/profile`, { headers: getHeaders() }).then(handleResponse),
  updateProfile: (data: any) => fetch(`${BASE_URL}/profile`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  updatePassword: (data: any) => fetch(`${BASE_URL}/profile/password`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(handleResponse),
  generate2FA: () => fetch(`${BASE_URL}/auth/2fa/generate`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
  turnOn2FA: (code: string) => fetch(`${BASE_URL}/auth/2fa/turn-on`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify({ code })
  }).then(handleResponse),
  turnOff2FA: (code: string) => fetch(`${BASE_URL}/auth/2fa/turn-off`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify({ code })
  }).then(handleResponse),
};
