<div align="center">
  <img width="180" height="180" alt="apple-touch-icon" src="https://github.com/user-attachments/assets/1aa6467a-b41e-49b0-a438-05b7ee5ae4ed" />
  <h1>Waflow</h1>
  <p><b>An Open Source WhatsApp CRM, Automation & Bulk-Messaging Platform</b></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
  [![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)



<br />

**Waflow** is a powerful, self-hosted Customer Relationship Management (CRM) platform built specifically for WhatsApp. It combines a robust, multi-engine backend API (powered by NestJS and OpenWA) with a stunning, highly responsive React frontend dashboard.

Whether you need to manage customer support via an Inbox, automate workflows with Flow Builders, or send massive Broadcast campaigns, Waflow provides a full-stack solution to scale your WhatsApp operations without vendor lock-in.

---

## ✨ Key Features

### 💻 Frontend (Dashboard & CRM)
- **Unified Inbox:** Manage all your WhatsApp conversations in a beautiful, real-time chat interface.
- **Visual Flow Builder:** Drag-and-drop node canvas (using React Flow) to build complex chatbots, auto-responders, and decision trees.
- **Broadcast Engine:** Send bulk marketing messages with scheduling, delivery tracking, and templating.
- **Contact Management:** A fully-featured CRM to store customer data, tags, and custom fields.
- **Real-time Analytics:** Track session statuses, message delivery rates, and active conversations using ApexCharts.
- **Multi-device Support:** Easily link and manage multiple WhatsApp numbers (sessions) via QR code scanning directly in the dashboard.

### ⚙️ Backend (API Gateway)
- **Multi-Engine Architecture:** Seamlessly switch between WhatsApp Web JS and Baileys engines for maximum stability.
- **Queue-Based Processing:** Built on BullMQ and Redis to ensure reliable, high-throughput message delivery and webhook processing.
- **Database Agnostic:** Uses TypeORM, allowing you to run lightweight instances on SQLite or scale up to enterprise workloads on PostgreSQL.
- **Real-time WebSockets:** Powered by Socket.io for instantaneous UI updates when messages arrive or session statuses change.
- **Extensive Webhooks:** Forward incoming messages and events to your own external services effortlessly.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, ApexCharts, Socket.io-client, FullCalendar |
| **Backend** | NestJS 11, TypeORM, BullMQ, Redis, Passport (JWT Auth), Socket.io, Express |
| **WhatsApp Core** | @whiskeysockets/baileys, whatsapp-web.js |
| **Database** | SQLite (Default for Dev) / PostgreSQL (Production ready) |

---

## 📂 Repository Structure

This repository is organized as a monorepo, keeping the client and server code neatly separated:

```text
waflow/
├── frontend/             # React/Vite Dashboard Application
│   ├── src/
│   │   ├── components/   # Reusable UI elements (Buttons, Modals, Forms)
│   │   ├── pages/        # Dashboard, Inbox, Flows, Contacts, Broadcasts
│   │   ├── context/      # React Context (Auth, Theme)
│   │   └── services/     # API integration (openwa.ts, inbox.api.ts)
│   └── package.json
│
└── backend/              # NestJS API Gateway
    ├── src/
    │   ├── engine/       # WhatsApp Adapters (Baileys, WWebJS)
    │   ├── modules/      # Auth, CRM, Inbox, Webhook, Broadcast, Message
    │   └── database/     # TypeORM migrations and entities
    └── package.json
```

---

## 🚀 Getting Started (Local Setup)

To run Waflow locally, you need [Node.js (v20+)](https://nodejs.org/) installed on your machine. You will need to run both the frontend and backend simultaneously in separate terminal windows.

### 1. Setup the Backend API
The backend acts as the bridge to WhatsApp and serves the database.

```bash
cd backend
npm install

# Optional: Copy the example environment file and adjust if necessary
cp .env.example .env

# Start the NestJS development server
npm run dev
```
*The backend API will start on `http://localhost:2785`.*

### 2. Setup the Frontend Dashboard
The frontend is the UI you will interact with in your browser.

```bash
cd frontend
npm install

# Create an environment file to point to the backend
echo VITE_API_URL=http://localhost:2785 > .env

# Start the Vite development server
npm run dev
```
*The dashboard will start on `http://localhost:5173`.*

---

## ☁️ Deployment (Production)

To deploy Waflow to a production environment (like an Azure Ubuntu VM or AWS EC2), follow these general steps:

1. **Install Prerequisites:** Ensure your server has Node.js, Git, PM2, Redis, and Nginx installed.
2. **Clone the Repo:** `git clone https://github.com/your-username/Convoreach-App.git`
3. **Run the Backend (PM2):**
   ```bash
   cd backend
   npm install
   npm run build
   pm2 start dist/main.js --name "waflow-api"
   ```
4. **Build the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```
5. **Configure Nginx:** Set up an Nginx reverse proxy to serve the frontend `dist` folder on port `80` (or `443` for SSL) and proxy `/api/*` requests to your backend running on `localhost:2785`.

---

## 🛡️ Security & Privacy

Waflow is a self-hosted solution. **Your data belongs to you.**
- Messages and customer contacts are stored in your own local database (SQLite/PostgreSQL).
- WhatsApp session data and tokens (e.g., `.wwebjs_auth`) remain strictly on your server and are explicitly ignored by Git to prevent accidental credential leaks.
- API endpoints are protected using JWT-based authentication.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
