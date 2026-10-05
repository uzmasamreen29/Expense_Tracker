# 💰 Expense Tracker — Full-Stack MERN Application

A full-stack financial tracking application built to log, categorize, and analyze daily expenses against custom monthly budgets in real-time. Features secure token-based authentication, interactive visual dashboards, and robust cloud persistence.

---

## 🚀 Live Demo

- **Live Application:** [expense-tracker-omega-beryl-59.vercel.app](https://expense-tracker-omega-beryl-59.vercel.app)
- **API Base URL:** Deployed on Render

---

## ✨ Features

- **User Authentication:** Secure registration and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Session Tracking:** Automated `lastLogin` timestamp tracking stored directly in user profiles.
- **Expense Management:** Full CRUD operations (Create, Read, Update, Delete) for daily transactions.
- **Categorization & Filtering:** Tag expenses by category (e.g., Food, Transport, Utilities, Entertainment).
- **Budget Tracking:** Set monthly spending thresholds and monitor remaining balances in real time.
- **Production Architecture:** Decoupled SPA client with client-side rewrite handling and dedicated CORS policies.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router DOM (v6)
- **HTTP Client:** Axios with dynamic auth interceptors
- **Styling:** CSS3 / Modern Flex & Grid UI
- **Hosting:** Vercel

### Backend
- **Runtime:** Node.js & Express.js
- **Database:** MongoDB Atlas (Cloud)
- **ODM:** Mongoose
- **Security:** CORS, bcryptjs, JSON Web Tokens
- **Hosting:** Render

---

## 📂 Project Structure

```text
Expense_Tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection setup
│   │   ├── controllers/    # Request handlers for auth and expenses
│   │   ├── middleware/     # Auth verification and error handlers
│   │   ├── models/         # Mongoose schemas (User, Expense)
│   │   ├── routes/         # Express API routes
│   │   └── server.js       # App entry point & middleware config
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/         # Static assets and icons
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Dashboard, Login, Register views
│   │   ├── services/       # Axios API client & endpoints
│   │   ├── App.jsx         # Root router configuration
│   │   └── main.jsx
│   ├── vercel.json         # SPA routing fallback rules
│   ├── vite.config.js
│   └── package.json
│
└── README.md
