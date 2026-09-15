<div align="center">
  <!-- <img width="180" height="180" alt="apple-touch-icon" src="https://github.com/user-attachments/assets/1aa6467a-b41e-49b0-a438-05b7ee5ae4ed" /> -->
  <h1>Waflow</h1>
  <p><b>An Open Source WhatsApp CRM, Automation & Bulk-Messaging Platform</b></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
  [![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)

</div>

<br />

**Waflow** is a powerful, self-hosted Customer Relationship Management (CRM) platform built specifically for WhatsApp. It combines a robust, multi-engine backend API (powered by NestJS, OpenWA, Baileys, and WhatsApp Web JS) with a stunning, highly responsive React frontend dashboard (TailAdmin based).

Whether you need to manage customer support via an Inbox, automate workflows with Flow Builders, or send massive Broadcast campaigns, Waflow provides a full-stack solution to scale your WhatsApp operations without vendor lock-in.

---

## ✨ Key Features

### 💻 Frontend (Dashboard & CRM)
- **Unified Inbox:** Manage all your WhatsApp conversations in a beautiful, real-time chat interface.
- **Visual Flow Builder:** Drag-and-drop node canvas (using **React Flow**) to build complex chatbots, auto-responders, and decision trees.
- **Broadcast Engine:** Send bulk marketing messages with scheduling, delivery tracking, and templating.
- **Contact Management:** A fully-featured CRM to store customer data, tags, custom fields, and detailed OTP/Audit logs.
- **Real-time Analytics:** Track session statuses, message delivery rates, and active conversations using **ApexCharts**.
- **Rich Media & Content:** Built-in support for rich text editing (TipTap), maps integration (Leaflet/jVectorMap), and dynamic scheduling (FullCalendar).
- **Public Pages:** Out-of-the-box templates for Home, Blogs, Terms & Conditions, and Refund Policies.
- **Multi-device Support:** Easily link and manage multiple WhatsApp numbers (sessions) via QR code scanning directly in the dashboard.

### ⚙️ Backend (API Gateway)
- **Multi-Engine Architecture:** Seamlessly switch between WhatsApp Web JS and Baileys engines for maximum stability.
- **Queue-Based Processing:** Built on **BullMQ** and **Redis** to ensure reliable, high-throughput message delivery and webhook processing.
- **Database Agnostic:** Uses **TypeORM**, allowing you to run lightweight instances on SQLite for local dev or scale up to enterprise workloads on PostgreSQL.
- **Real-time WebSockets:** Powered by **Socket.io** for instantaneous UI updates when messages arrive or session statuses change.
- **Extensive Webhooks:** Forward incoming messages and events to your own external services effortlessly.
- **Comprehensive Security:** Secures endpoints via Helmet, Throttler (Rate Limiting), Passport JWT Auth, and class-validators.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, React Flow, ApexCharts, Socket.io-client, FullCalendar, TipTap, Leaflet |
| **Backend** | NestJS 11, TypeORM, BullMQ, Redis, Passport (JWT Auth), Socket.io, Express, Swagger |
| **WhatsApp Core** | `@whiskeysockets/baileys`, `whatsapp-web.js` |
| **Database & Cache** | SQLite (Local Dev) / PostgreSQL (Production), Redis (Queue & Cache) |

---

## 📂 Repository Structure

This repository is organized as a monorepo, keeping the client and server code neatly separated:

```text
waflow/
├── Frontend/             # React/Vite Dashboard Application
│   ├── public/           # Static pages (home, blogs, policies)
│   ├── src/
│   │   ├── components/   # Reusable UI elements
│   │   ├── pages/        # Inbox, OTP Builder, Analytics, Settings
│   │   ├── context/      # Global state (UserContext, Theme)
│   │   └── ...
│   └── package.json
│
└── Backend/              # NestJS API Gateway
    ├── src/
    │   ├── engine/       # WhatsApp Adapters (Baileys, WWebJS)
    │   ├── modules/      # Auth, CRM, Inbox, Webhook, Session, Integration
    │   └── database/     # TypeORM migrations and entities
    └── package.json
```

---

## 🚀 Getting Started (Local Setup)

To run Waflow locally, you need [Node.js (v20+)](https://nodejs.org/) and optionally **Redis** installed on your machine. You will need to run both the frontend and backend simultaneously in separate terminal windows.

### 1. Setup the Backend API

The backend acts as the bridge to WhatsApp and serves the database.

```bash
cd Backend
npm install

# Copy the example environment file and adjust variables (e.g., set up DB and Redis)
cp .env.example .env

# Start the NestJS development server
npm run start:dev
# OR use concurrently for all modules
npm run dev
```
*The backend API will typically start on `http://localhost:2785` or the port specified in your `.env`.*
*You can access the **Swagger UI** for API documentation if configured.*

### 2. Setup the Frontend Dashboard

The frontend is the UI you will interact with in your browser.

```bash
cd Frontend
npm install

# Create an environment file to point to the backend
echo VITE_API_URL=http://localhost:2785 > .env

# Start the Vite development server
npm run dev
```
*The dashboard will start on `http://localhost:5173`.*

---

## 🚀 Testing the API Locally

To test the API on your own machine, follow the steps below to run the server and import the Postman collection.

### 1. Clone the Project

First, clone the repository to your local machine:

```bash
git clone https://github.com/albinmathew90/WaFlow-Whatsapp-Automation.git
cd WaFlow-Whatsapp-Automation
```

### 2. Start the Backend Server

Navigate into the backend directory and install the necessary dependencies:

```bash
cd Backend
npm install
```

Copy the provided `.env.minimal` file to create your own `.env` file. It contains a lightweight configuration (using SQLite) perfect for local development:

```bash
cp .env.minimal .env
```
Make sure to review and fill out the necessary variables inside the `.env` file (such as SMTP, Razorpay, or AI keys if you need them).

Start the development server:

```bash
npm run dev
```

The API should now be running on `http://localhost:2785`.

### 3. Test with Postman

I have included a Postman collection so you can easily test all the available endpoints.

1. Locate the `waflow-api-collection.json` file inside the `docs/` folder of this repository.
2. Open Postman and click **Import** in the top left corner.
3. Drag and drop the `waflow-api-collection.json` file to import it.
4. First, run the "Login user" or "Create new user" request to receive a JWT token.
5. Copy that token and paste it into the `access_token` variable to authenticate all other requests.
6. You can now test endpoints like "Create Contact", "Fetch Contacts", and "Update a Contact"!

---

## ☁️ Deployment (Production)

To deploy Waflow to a production environment, follow these general steps:

1. **Install Prerequisites:** Ensure your server has Node.js (v22+ recommended), PostgreSQL, Redis, and a process manager like PM2 or Docker installed.
2. **Clone the Repo:** `git clone https://github.com/your-username/Convoreach-App.git`
3. **Setup Database & Cache:** Ensure your PostgreSQL and Redis instances are running and accessible. Update the backend `.env` accordingly.
4. **Build and Run Backend:**
   ```bash
   cd Backend
   npm install
   npm run build
   # Migrate your database
   npm run migration:run:prod
   # Run with PM2
   pm2 start dist/main.js --name "waflow-api"
   ```
5. **Build and Serve Frontend:**
   ```bash
   cd ../Frontend
   npm install
   npm run build
   ```
6. **Configure Nginx:** Set up an Nginx reverse proxy to serve the frontend `dist` folder on port `80` (or `443` for SSL) and proxy `/api/*` and WebSocket traffic to your backend running locally.

---

## 🛡️ Security & Privacy

Waflow is a self-hosted solution. **Your data belongs to you.**
- Messages and customer contacts are stored in your own local database.
- WhatsApp session data and tokens remain strictly on your server and are explicitly ignored by Git to prevent accidental credential leaks.
- API endpoints are protected using JWT-based authentication and role-based access limits.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
