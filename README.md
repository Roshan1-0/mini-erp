# 📦 Mini ERP + CRM Operations Portal

An enterprise-grade internal **ERP + CRM Operations Portal** built for wholesale, distribution, and supply chain businesses. Designed to manage **Customer Relationships**, **Inventory Tracking**, and **Sales Challan Workflows** with strict **Role-Based Access Control (RBAC)**, **Atomic Stock Transactions**, **Data Snapshots**, and **Automated PDF Invoice Generation**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1.svg?logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000.svg?logo=vercel)](https://mini-erp-plum-two.vercel.app)
[![Deployed on Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E.svg?logo=railway)](https://mini-erp-production-545a.up.railway.app/api/health)

---

## 🌐 Live Application Links

- **Live Frontend**: [https://mini-erp-plum-two.vercel.app](https://mini-erp-plum-two.vercel.app)
- **Live Backend API**: `https://mini-erp-production-545a.up.railway.app/api`
- **API Health Check**: [https://mini-erp-production-545a.up.railway.app/api/health](https://mini-erp-production-545a.up.railway.app/api/health)

---

## 🔐 Key Features & Capabilities

- **Role-Based Access Control (RBAC)**: Backend-enforced permissions across 4 distinct roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
- **CRM Module**: Lead & customer management, status workflows (`LEAD` ➔ `ACTIVE` ➔ `INACTIVE`), interaction logs, and scheduled follow-up tracking.
- **Inventory Management**: Real-time stock levels, low-stock threshold alerts, categorised products, and itemized stock `IN`/`OUT` movement logs.
- **Sales Challans Workflow**: Two-phase lifecycle (`DRAFT` ➔ `CONFIRMED` or `CANCELLED`).
- **Atomic Stock Deduction**: Uses Prisma `$transaction` to validate stock, deduct quantities, log movements, and update status atomically.
- **Immutability & Snapshot Pattern**: Preserves historical accuracy by snapshotting customer and product data (name, SKU, unit price) at the exact moment of order creation.
- **PDF Invoice Generation**: Server-side HTML-to-PDF invoice rendering powered by headless Puppeteer.

---

## 🔑 Demo Access Credentials

All test accounts share the default password: **`password123`**

| Role | Email | Permitted Actions |
| :--- | :--- | :--- |
| 👑 **Admin** | `admin@example.com` | Full system access across all modules, settings, and users |
| 💼 **Sales** | `sales@example.com` | Customer CRM, Follow-up notes, Create & Confirm Sales Challans |
| 📦 **Warehouse** | `warehouse@example.com` | Inventory CRUD, Stock IN/OUT adjustments, View Movements |
| 📊 **Accounts** | `accounts@example.com` | View Challans, Generate & Export PDF Invoices, View Dashboard |

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["React 18 + Vite SPA (Vercel)"] -->|HTTPS / REST API| AuthMiddleware["Auth Middleware (JWT Verification)"]
    AuthMiddleware --> RBACGuard["Role Middleware (RBAC Check)"]
    RBACGuard --> Controller["Express Controller Layer"]
    Controller --> Service["Service Layer (Business Logic & Zod Validation)"]
    Service -->|Prisma ORM| Database[("Neon PostgreSQL Cloud DB")]
    Service -->|Puppeteer| PDFEngine["Headless Chrome PDF Generator"]
```

### Request Processing Flow
`HTTP Request` ➔ `CORS Middleware` ➔ `JWT Auth` ➔ `Role Guard` ➔ `Zod Validator` ➔ `Controller` ➔ `Service` ➔ `Prisma Transaction` ➔ `PostgreSQL`

---

## 🗄️ Database Schema & Entities

```mermaid
erDiagram
    User ||--o{ StockMovement : creates
    User ||--o{ FollowUpNote : creates
    User ||--o{ SalesChallan : creates
    Customer ||--o{ FollowUpNote : has
    Customer ||--o{ SalesChallan : places
    Product ||--o{ StockMovement : tracks
    Product ||--o{ ChallanItem : contains
    SalesChallan ||--|{ ChallanItem : contains

    User {
        int id PK
        string email UK
        string passwordHash
        Role role "ADMIN | SALES | WAREHOUSE | ACCOUNTS"
    }

    Customer {
        int id PK
        string name
        string mobile
        string businessName
        CustomerStatus status "LEAD | ACTIVE | INACTIVE"
        CustomerType type "WHOLESALE | RETAIL | DISTRIBUTOR"
        datetime followUpDate
    }

    Product {
        int id PK
        string sku UK
        string name
        decimal unitPrice
        int currentStock
        int minimumStock
    }

    SalesChallan {
        int id PK
        string challanNumber UK
        ChallanStatus status "DRAFT | CONFIRMED | CANCELLED"
        string customerNameSnapshot
        decimal totalAmount
    }
```

---

## ⚡ Core Business Logic & Security

### 1. Atomic Challan Confirmation (`$transaction`)
When a challan changes status from `DRAFT` to `CONFIRMED`, the server guarantees zero stock inconsistency:

```typescript
// backend/src/services/challan.service.ts
await prisma.$transaction(async (tx) => {
  // 1. Verify stock availability for all items
  for (const item of challan.items) {
    if (item.product.currentStock < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK: ${item.productNameSnapshot}`);
    }
  }

  // 2. Atomically deduct stock & record movement logs
  for (const item of challan.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { currentStock: { decrement: item.quantity } }
    });
    await tx.stockMovement.create({
      data: { productId: item.productId, quantity: item.quantity, movementType: 'OUT', ... }
    });
  }

  // 3. Mark Challan as CONFIRMED
  await tx.salesChallan.update({
    where: { id: challanId },
    data: { status: 'CONFIRMED' }
  });
});
```

### 2. Snapshot Pattern
Price fluctuations or product name modifications never retroactively modify historical financial documents. Product name, SKU, unit price, and customer contact details are duplicated into `ChallanItem` and `SalesChallan` tables at time of draft creation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Axios, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Zod, Puppeteer, Bcrypt, JWT |
| **Database** | PostgreSQL (Neon Cloud Serverless) |
| **Hosting** | Vercel (Frontend), Railway (Backend Container) |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL Database**: Neon Cloud URL or local instance

### Step 1: Clone Repository
```bash
git clone https://github.com/Roshan1-0/mini-erp.git
cd mini-erp
```

### Step 2: Backend Setup
```bash
cd backend
npm install

# Create .env file inside backend/
cp .env.example .env
```

Configure `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
JWT_SECRET="your_secure_random_jwt_secret_key"
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Run database migrations & initial seeding:
```bash
# Apply migrations to PostgreSQL
npm run db:migrate

# Seed demo users, customers, and inventory
npm run db:seed

# Start backend development server
npm run dev
```
Backend API will run at: `http://localhost:5000`

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file inside frontend/
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# Start Vite development server
npm run dev
```
Frontend Web UI will run at: `http://localhost:5173`

---

## 📡 API Endpoint Reference

### Authentication
- `POST /api/auth/login` — Authenticate user and return JWT token
- `GET /api/auth/me` — Return current authenticated user profile

### Customer Relationship Management (CRM)
- `GET /api/customers` — List customers (supports `page`, `limit`, `search`, `status`, `type`)
- `POST /api/customers` — Create a new customer record
- `GET /api/customers/:id` — Retrieve customer details
- `PUT /api/customers/:id` — Update customer information
- `POST /api/customers/:id/follow-ups` — Add a follow-up note
- `GET /api/customers/:id/follow-ups` — List follow-up notes for customer

### Product & Inventory Management
- `GET /api/products` — List products (supports `page`, `limit`, `search`, `category`)
- `POST /api/products` — Create a new product SKU
- `GET /api/products/:id` — Retrieve product details
- `PUT /api/products/:id` — Update product details
- `POST /api/products/:id/stock/add` — Record stock `IN` movement
- `POST /api/products/:id/stock/remove` — Record manual stock `OUT` adjustment
- `GET /api/products/:id/stock-movements` — Audit trail of stock movements

### Sales Challans
- `GET /api/challans` — List sales orders (supports `page`, `limit`, `search`, `status`)
- `POST /api/challans` — Create a `DRAFT` sales order with snapshot items
- `GET /api/challans/:id` — Retrieve sales challan details
- `POST /api/challans/:id/confirm` — Atomic execution: validate, deduct stock, confirm order
- `POST /api/challans/:id/cancel` — Cancel a draft sales order
- `GET /api/challans/:id/invoice` — Download generated PDF invoice binary

### System
- `GET /api/dashboard` — Analytical KPIs, low stock alerts, and due follow-ups
- `GET /api/health` — System status check

---

## 🧪 Postman Collection

A pre-configured Postman Collection is included in the codebase under [`postman/Mini-ERP-CRM.postman_collection.json`](postman/Mini-ERP-CRM.postman_collection.json).

To import:
1. Open Postman ➔ **Import**.
2. Select `postman/Mini-ERP-CRM.postman_collection.json`.
3. Set collection variable `baseUrl` to `http://localhost:5000/api` or your Railway URL.

---

## 📜 License

This project is open-source under the **MIT License**.
