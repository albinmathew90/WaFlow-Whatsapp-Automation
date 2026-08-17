const BASE_URL = '/openwa-api/admin';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
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
  getUsers: () => fetch(`${BASE_URL}/users`, { headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  createUser: (data: any) => fetch(`${BASE_URL}/users`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  updateUser: (id: number, data: any) => fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  deleteUser: (id: number) => fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),

  // Blogs
  getBlogs: () => fetch(`${BASE_URL}/blogs`, { headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  createBlog: (data: any) => fetch(`${BASE_URL}/blogs`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  updateBlog: (id: number, data: any) => fetch(`${BASE_URL}/blogs/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  deleteBlog: (id: number) => fetch(`${BASE_URL}/blogs/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),

  // Topics
  getTopics: () => fetch(`${BASE_URL}/topics`, { headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  createTopic: (data: any) => fetch(`${BASE_URL}/topics`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  updateTopic: (id: number, data: any) => fetch(`${BASE_URL}/topics/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  deleteTopic: (id: number) => fetch(`${BASE_URL}/topics/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),

  // Media
  getMedia: () => fetch(`${BASE_URL}/media`, { headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  createMedia: (data: any) => fetch(`${BASE_URL}/media`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  deleteMedia: (id: number) => fetch(`${BASE_URL}/media/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),

  // SEO
  getSeo: () => fetch(`${BASE_URL}/seo`, { headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  createSeo: (data: any) => fetch(`${BASE_URL}/seo`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  updateSeo: (id: number, data: any) => fetch(`${BASE_URL}/seo/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  deleteSeo: (id: number) => fetch(`${BASE_URL}/seo/${id}`, { method: 'DELETE', headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),

  // Settings
  getSettings: () => fetch(`${BASE_URL}/settings`, { headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  updateSettings: (data: any) => fetch(`${BASE_URL}/settings`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),

  // Profile & 2FA
  getProfile: () => fetch(`${BASE_URL}/profile`, { headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  updateProfile: (data: any) => fetch(`${BASE_URL}/profile`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  updatePassword: (data: any) => fetch(`${BASE_URL}/profile/password`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  generate2FA: () => fetch(`${BASE_URL}/auth/2fa/generate`, { method: 'POST', headers: getHeaders() }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  turnOn2FA: (code: string) => fetch(`${BASE_URL}/auth/2fa/turn-on`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify({ code })
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
  turnOff2FA: (code: string) => fetch(`${BASE_URL}/auth/2fa/turn-off`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify({ code })
  }).then(res => { if(!res.ok) throw new Error(); return res.json(); }),
};
