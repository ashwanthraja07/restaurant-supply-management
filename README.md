# SupplyFlow — Restaurant Supply Management System

A full-stack enterprise supply chain and inventory management system designed for restaurants, warehouses, and suppliers. Built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js / Express**, and an **Oracle Database**.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture & Workflow](#architecture--workflow)
- [Tech Stack](#tech-stack)
- [System Prerequisites](#system-prerequisites)
- [Project Structure](#project-structure)
- [Step-by-Step Setup Guide](#step-by-step-setup-guide)
  - [1. Database Configuration (Oracle)](#1-database-configuration-oracle)
  - [2. Backend Configuration & Startup](#2-backend-configuration--startup)
  - [3. Frontend Configuration & Startup](#3-frontend-configuration--startup)
- [API Endpoints Overview](#api-endpoints-overview)
- [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 📌 Overview

**SupplyFlow** streamlines the end-to-end supply chain operations across restaurants, suppliers, and regional warehouses:
- **Supplier & Restaurant Management**: Track vendor profiles, contact details, and restaurant branches.
- **Product Catalog & Cost Tracking**: Manage products categorized across food categories with unit pricing.
- **Multi-Warehouse Inventory**: Monitor real-time warehouse stock levels, with automated low-stock warnings and reorder thresholds.
- **Purchase Order Lifecycle**: Create, track, and manage purchase orders through pending, processing, and delivered stages.
- **Analytics Dashboard**: Interactive charts and KPIs for stock distribution, orders, and expenses.

---

## 🏛 Architecture & Workflow

The system is decoupled into an Express REST API backend and a Vite-powered React client interacting with an Oracle Database instance.

### System Architecture
![Architecture Diagram](docs/Figure_2_Architecture_Diagram.jpg)

### Operational Workflow
![Workflow Diagram](docs/Figure_3_Workflow_Diagram.jpg)

---

## 💻 Tech Stack

- **Frontend**:
  - React 19 + Vite
  - Tailwind CSS + Lucide Icons
  - Recharts (Analytics and data visualization)
  - Axios + React Router DOM
  - React Toastify
- **Backend**:
  - Node.js & Express 5
  - `oracledb` (Oracle Database driver)
  - `dotenv` (Environment variable management)
  - `cors`
- **Database**:
  - Oracle Database 11g / 19c / 21c / XE

---

## ⚙ System Prerequisites

Before starting, ensure you have the following installed:
1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **Oracle Database**: Oracle XE (11g/19c/21c) or Oracle Enterprise with an active listener.
3. **Git**: Installed and configured on your system.

---

## 📁 Project Structure

```text
restaurant-supply-management/
├── backend/
│   ├── scripts/
│   │   └── seed.js             # Automated database seeder script
│   ├── sql/
│   │   ├── schema.sql          # Table DDL definitions (7 tables)
│   │   └── seed.sql            # Raw SQL seed records
│   ├── src/
│   │   ├── config/             # Oracle pool & connection configuration
│   │   ├── routes/             # REST API route controllers
│   │   ├── app.js              # Express app setup and middleware
│   │   └── server.js           # Server entry point
│   ├── .env.example            # Backend environment template
│   ├── .gitignore              # Backend gitignore
│   └── package.json
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # Axios API instance and endpoints
│   │   ├── components/         # Reusable UI components & layouts
│   │   ├── pages/              # Views (Dashboard, Inventory, Orders, etc.)
│   │   ├── App.jsx             # Main router
│   │   └── main.jsx            # Entry point
│   ├── .gitignore              # Frontend gitignore
│   └── package.json
├── docs/                       # Architecture & workflow diagrams
├── .gitignore                  # Root repository gitignore
└── README.md                   # Project documentation
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Database Configuration (Oracle)

#### A. Create the Database Schema
Open **SQL*Plus** or **Oracle SQL Developer** and run the schema DDL script located at `backend/sql/schema.sql`:

```sql
@backend/sql/schema.sql
```

This creates the 7 required relational tables:
1. `SUPPLIER`
2. `RESTAURANT`
3. `WAREHOUSE`
4. `PRODUCT`
5. `INVENTORY`
6. `PURCHASE_ORDER`
7. `ORDER_ITEM`

#### B. Seed Sample Data (Optional via Node script or SQL)
You can seed sample records using SQL*Plus:
```sql
@backend/sql/seed.sql
```
*Or* let the Node.js seeding script populate it in the next step.

---

### 2. Backend Configuration & Startup

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   - On Windows (Command Prompt):
     ```cmd
     copy .env.example .env
     ```
   - On Linux/macOS/Git Bash:
     ```bash
     cp .env.example .env
     ```

4. Edit `.env` with your Oracle Database credentials:
   ```ini
   ORACLE_USER=system
   ORACLE_PASSWORD=your_actual_oracle_password
   ORACLE_CONNECT_STRING=localhost:1521/xe
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```
   *(Note: Common connect strings include `localhost:1521/xe`, `localhost:1521/xepdb1`, or `localhost/XE`).*

5. Run the database seeder (populates initial demo data):
   ```bash
   npm run seed
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will start at: `http://localhost:5000`
   - Health check: `http://localhost:5000/api/health`
   - Database health check: `http://localhost:5000/api/health/db`

---

### 3. Frontend Configuration & Startup

1. Open a **new** terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 🔌 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server status check |
| `GET` | `/api/health/db` | Oracle database connectivity check |
| `GET` | `/api/dashboard/stats` | Dashboard statistics & summary KPIs |
| `GET`, `POST` | `/api/suppliers` | List all suppliers / Create supplier |
| `GET`, `PUT`, `DELETE` | `/api/suppliers/:id` | Get / Update / Delete supplier |
| `GET`, `POST` | `/api/restaurants` | List restaurants / Create restaurant |
| `GET`, `POST` | `/api/warehouses` | List warehouses / Create warehouse |
| `GET`, `POST` | `/api/products` | List products / Create product |
| `GET`, `POST` | `/api/inventory` | Inventory status / Add stock record |
| `GET`, `POST` | `/api/orders` | Purchase orders / Place purchase order |
| `GET`, `POST` | `/api/order-items` | Order line items / Add line item |
| `GET` | `/api/reports/spending` | Supplier spending & order analytics |

---

## 🛠 Troubleshooting & FAQs

- **`ORA-01017: invalid username/password`**:
  Double-check the `ORACLE_USER` and `ORACLE_PASSWORD` values in `backend/.env`.
- **`ORA-12541: TNS:no listener` / `ORA-12514`**:
  Ensure the Oracle Database service and listener are running in Windows Services (`services.msc`) or run `lsnrctl status` in Command Prompt.
- **Port 5000 is already in use**:
  Change `PORT` in `backend/.env` (e.g. to `5001`) and update the Axios base URL in `frontend/src/api/index.js`.
- **CORS Errors**:
  Verify `FRONTEND_URL` in `backend/.env` matches your Vite development URL (`http://localhost:5173`).
- **Thick Mode / Oracle Client Error (11g)**:
  If connecting to an Oracle 11g database requiring Thick mode, place the Oracle Instant Client directory (`instantclient_19_26`) inside the `backend` folder or add its path to your system's `PATH`.

---

## 📄 License

This project is licensed under the ISC License.
