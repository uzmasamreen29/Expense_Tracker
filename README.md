# MediTrack — Clinical Operations & Expense Intelligence Portal

A full-stack, enterprise-grade healthcare financial tracking and compliance monitoring platform designed to eliminate manual data entry in medical facilities, track departmental burn rates, and ensure statutory regulatory compliance.

---

## 🌟 Key Highlights & Features

- **Automated Receipt Ingestion (OCR):** In-browser OCR powered by `Tesseract.js` using a bottom-up priority heuristic engine to auto-extract grand totals, invoice dates, purpose descriptions, and pharmaceutical/clinical suppliers directly into ledger forms.
- **Statutory Bio-Waste Compliance Monitoring:** Live operational threshold calculation that monitors biomedical hazardous waste expenditure ratios against regulatory benchmarks (alerting at >15% facility spend).
- **Printable Clinical Audit Manifest:** PDF-ready layout designed with pure CSS `@media print` directives for Chief Medical Officer (CMO) and statutory auditor sign-offs.
- **Interactive Financial Visualizations:** Dynamic 7-day spend curves and department breakdown pie charts powered by `Recharts`.
- **Department & Budget Governance:** Department-level allocation tracking with configurable monthly expenditure ceilings and progress indicators.
- **Theme Persistence:** Seamless Dark/Light mode toggle persisted across sessions via `localStorage`.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS, Recharts, Lucide Icons, Tesseract.js |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt.js password hashing |
| **State & API** | React Context API, Axios (Bearer Token Interceptors) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **MongoDB Atlas** account or local MongoDB instance

### 2. Backend Setup
```bash
cd backend
npm install

Create a .env file in the backend/ directory:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

Start the backend API server:
npm run dev
# Server listening on http://localhost:5000

Frontend Setup
cd ../frontend
npm install

Create a .env file in the frontend/ directory (if configuring custom API URL):
VITE_API_URL=http://localhost:5000/api

Start the frontend Vite server:
npm run dev
# Application running at http://localhost:5173

| Method | Endpoint | Request Body / Params | Auth Required | Purpose / Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ "name": "...", "email": "...", "password": "..." }` | No | Registers clinic admin, seeds default departments, and returns `{ user, token }` |
| `POST` | `/api/auth/login` | `{ "email": "...", "password": "..." }` | No | Validates credentials and returns JWT Bearer token |
| `GET` | `/api/expenses` | *None* | **Yes** (Bearer) | Fetches complete list of facility expense ledger rows |
| `POST` | `/api/expenses` | `{ "title": "...", "amount": 8700, "category": "ID", "vendor": "...", "date": "YYYY-MM-DD", "paymentMethod": "UPI" }` | **Yes** (Bearer) | Creates a verified clinical expenditure record |
| `DELETE` | `/api/expenses/:id` | `id` (MongoDB ObjectID in URL) | **Yes** (Bearer) | Deletes a ledger entry from the database |
| `GET` | `/api/categories` | *None* | **Yes** (Bearer) | Retrieves all clinic cost-center departments |
| `POST` | `/api/categories` | `{ "name": "Diagnostic Reagents", "color": "#0d9488" }` | **Yes** (Bearer) | Creates a new clinical cost center |

🧪 OCR Demonstration Samples
To test the automated invoice processing pipeline, navigate to the Record Expense modal and upload sample invoice images containing standardized fields:

PURPOSE : Auto-fills the Item Title

DATE : Auto-formats to YYYY-MM-DD

GRAND TOTAL : Parsed bottom-up to capture terminal bill totals over line items

BILL NO : Auto-constructs procurement reference metadata
