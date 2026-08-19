const fs = require('fs');
const path = require('path');

const chatbotFile = 'd:/ConvoReach/Frontend/src/pages/Chatbot/Chatbot.tsx';
let content = fs.readFileSync(chatbotFile, 'utf8');

// 1. Remove 'use client'
content = content.replace(/'use client';\n/g, '');

// 2. Fix Header / PageMeta
content = content.replace(/import Header from '@\/components\/layout\/Header';/g, 'import PageMeta from "../../components/common/PageMeta";');
content = content.replace(/<Header title="(.*?)" subtitle="(.*?)" \/>/g, '<PageMeta title="$1" description="$2" />\n<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">\n  <div>\n    <h2 className="text-title-md2 font-semibold text-black dark:text-white">$1</h2>\n    <p className="text-sm font-medium">$2</p>\n  </div>\n</div>');

// 3. Remove api import and create inline fetch api
content = content.replace(/import { chatbotApi, knowledgeApi } from '@\/lib\/api';/g, `const API_BASE = '/openwa-api'; // Or standard backend url
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('crm_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
  };
};

const chatbotApi = {
  get: async () => fetch(API_BASE + '/sessions/default/chatbot/settings', { headers: getAuthHeaders() }).then(r => r.json()).then(data => ({ data })),
  update: async (payload) => fetch(API_BASE + '/sessions/default/chatbot/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) }).then(r => r.json())
};

const knowledgeApi = {
  list: async () => fetch(API_BASE + '/sessions/default/chatbot/knowledge', { headers: getAuthHeaders() }).then(r => r.json()).then(data => ({ data })),
  create: async (payload) => fetch(API_BASE + '/sessions/default/chatbot/knowledge', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) }).then(r => r.json()),
  update: async (id, payload) => fetch(API_BASE + '/sessions/default/chatbot/knowledge/' + id, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) }).then(r => r.json()),
  delete: async (id) => fetch(API_BASE + '/sessions/default/chatbot/knowledge/' + id, { method: 'DELETE', headers: getAuthHeaders() }),
  test: async (text) => fetch(API_BASE + '/api/v1/chatbot/widget/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'default', message: text }) }).then(r => r.json()).then(data => ({ data }))
};`);

fs.writeFileSync(chatbotFile, content);
console.log('Chatbot.tsx refactored');

const leadsFile = 'd:/ConvoReach/Frontend/src/pages/Chatbot/ChatbotLeads.tsx';
let leadsContent = fs.readFileSync(leadsFile, 'utf8');

leadsContent = leadsContent.replace(/'use client';\n/g, '');
leadsContent = leadsContent.replace(/import Header from '@\/components\/layout\/Header';/g, 'import PageMeta from "../../components/common/PageMeta";');
leadsContent = leadsContent.replace(/<Header title="(.*?)" subtitle="(.*?)" \/>/g, '<PageMeta title="$1" description="$2" />\n<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">\n  <div>\n    <h2 className="text-title-md2 font-semibold text-black dark:text-white">$1</h2>\n    <p className="text-sm font-medium">$2</p>\n  </div>\n</div>');

// Replace leadsApi
leadsContent = leadsContent.replace(/import { chatbotLeadsApi, chatbotApi } from '@\/lib\/api';/g, `
const API_BASE = '/openwa-api';
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('crm_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
  };
};

const chatbotLeadsApi = {
  list: async () => fetch(API_BASE + '/sessions/default/chatbot/leads', { headers: getAuthHeaders() }).then(r => r.json()).then(data => ({ data })),
  reply: async (id, text) => fetch(API_BASE + '/sessions/default/chatbot/leads/' + id + '/reply', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ text }) }).then(r => r.json())
};

const chatbotApi = {
  get: async () => fetch(API_BASE + '/sessions/default/chatbot/settings', { headers: getAuthHeaders() }).then(r => r.json()).then(data => ({ data }))
};`);

fs.writeFileSync(leadsFile, leadsContent);
console.log('ChatbotLeads.tsx refactored');
