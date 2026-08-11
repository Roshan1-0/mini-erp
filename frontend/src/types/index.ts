// Shared TypeScript types for the Mini ERP + CRM frontend

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpNote {
  id: number;
  customerId: number;
  note: string;
  followUpDate?: string | null;
  createdAt: string;
  createdBy: { id: number; name: string };
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number | string;
  currentStock: number;
  minimumStock: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdAt: string;
  createdBy: { id: number; name: string };
}

export interface ChallanItem {
  id: number;
  challanId: number;
  productId: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

export interface SalesChallan {
  id: number;
  challanNumber: string;
  customerId: number;
  customerNameSnapshot: string;
  businessNameSnapshot: string;
  mobileSnapshot: string;
  gstNumberSnapshot?: string | null;
  totalQuantity: number;
  totalAmount: number | string;
  status: ChallanStatus;
  createdAt: string;
  updatedAt: string;
  items: ChallanItem[];
  customer?: Customer;
  createdBy?: { id: number; name: string };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface DashboardData {
  stats: {
    totalCustomers: number;
    totalProducts: number;
    draftChallans: number;
    lowStockCount: number;
  };
  lowStockProducts: Array<{
    id: number;
    name: string;
    sku: string;
    currentStock: number;
    minimumStock: number;
    location: string;
  }>;
  recentChallans: SalesChallan[];
  followUpsDue: Array<{
    id: number;
    name: string;
    businessName: string;
    followUpDate: string;
    status: CustomerStatus;
    mobile: string;
  }>;
}
