# Mini ERP + CRM Operations Portal

An internal ERP + CRM operations portal for a wholesale/distribution company. Demonstrates full-stack development, REST API design, database relationships, role-based access, inventory business logic, atomic transactions, and PDF generation.

## Features

- **Authentication** — JWT login, 4 user roles (Admin, Sales, Warehouse, Accounts)
- **CRM** — Customer management, follow-up notes, status tracking, search/filter/pagination
- **Inventory** — Product management, stock IN/OUT movements, low stock alerts
- **Sales Challans** — Draft → Confirm workflow with atomic stock deduction
- **Snapshots** — Product and customer data preserved on challans at creation time
- **PDF Invoice** — Puppeteer-generated invoice PDF for confirmed challans
- **RBAC** — Backend-enforced role permissions on every endpoint

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, TypeScript, Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Neon hosted) |
| Auth | JWT + bcrypt |
| Validation | Zod |
| PDF | Puppeteer |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| HTTP | Axios |
| Routing | React Router v7 |
| Animation | Framer Motion + Lenis |

## Architecture

```
Route → Middleware (auth + role) → Controller → Service → Prisma → PostgreSQL
```

Frontend: `AuthContext → Protected Routes → Pages → Services (Axios) → API`

## Database Structure

```
User            — Admin, Sales, Warehouse, Accounts
Customer        — CRM entity with follow-up tracking
FollowUpNote    — Separate table for multiple notes per customer
Product         — Inventory with currentStock / minimumStock
StockMovement   — Audit log of every IN/OUT movement
SalesChallan    — Sales order with customer snapshot
ChallanItem     — Line items with product snapshot (name, SKU, price)
```

## Environment Variables

**backend/.env**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

**frontend/.env**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Local Setup

### Prerequisites
- Node.js 18+
- A free [Neon PostgreSQL](https://neon.tech) database

### 1. Get Neon Database URL

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up (free)
3. Create a new project
4. Copy the connection string from **Connection Details**
5. Paste it as `DATABASE_URL` in `backend/.env`

### 2. Backend Setup

```bash
cd backend

# Install dependencies (already done)
npm install

# Run Prisma migration (creates all tables)
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed the database with test data
npm run db:seed

# Start development server
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

Frontend runs on: http://localhost:5173

## Test Credentials

All accounts use password: **password123**

| Role | Email |
|------|-------|
| Admin | admin@example.com |
| Sales | sales@example.com |
| Warehouse | warehouse@example.com |
| Accounts | accounts@example.com |

## API Overview

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/customers              ?page=1&limit=10&search=&status=&type=
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
POST   /api/customers/:id/follow-ups
GET    /api/customers/:id/follow-ups

GET    /api/products               ?page=1&limit=10&search=&category=
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
POST   /api/products/:id/stock/add
POST   /api/products/:id/stock/remove
GET    /api/products/:id/stock-movements

GET    /api/challans               ?page=1&limit=10&search=&status=
POST   /api/challans
GET    /api/challans/:id
POST   /api/challans/:id/confirm
POST   /api/challans/:id/cancel
GET    /api/challans/:id/invoice   (returns PDF stream)

GET    /api/dashboard
GET    /api/health
```

## Business Logic

### Challan Confirmation (Critical Flow)

```
POST /api/challans/:id/confirm
  ↓
Check challan.status === DRAFT
  ↓
For each item: check product.currentStock >= item.quantity
  ↓
prisma.$transaction([
  product.update (currentStock - quantity) × N
  stockMovement.create (OUT) × N
  salesChallan.update (status = CONFIRMED)
])
  ↓
All or nothing — any failure rolls back
```

### Stock Rules
- `currentStock` can never go below 0
- Every change creates a `StockMovement` record
- Low stock when `currentStock <= minimumStock`

### Snapshot Pattern
When a challan is created, `productNameSnapshot`, `skuSnapshot`, `unitPrice`, and customer details are copied into the challan. Editing a product/customer later does not change old challans.

## Deployment

### Database (Neon)
1. Create project at https://neon.tech
2. Copy connection string to `DATABASE_URL`

### Backend (Render)
1. New Web Service → Connect GitHub repo
2. Root: `backend/`, Build: `npm run build`, Start: `npm start`
3. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`
4. Run migrations: `npx prisma migrate deploy`

### Frontend (Vercel)
1. Import repo on Vercel
2. Root: `frontend/`
3. Add: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

## Known Limitations

- No purchase order or supplier management
- Confirmed challans cannot be cancelled (prevents complex stock reversal)
- No real-time notifications
- No tax calculation engine
- No email/SMS integration
- Single currency (INR)
