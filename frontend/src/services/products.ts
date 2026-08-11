import api from './api';
import type { Product, StockMovement, PaginatedResponse } from '../types';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export async function getProducts(params: ListParams = {}) {
  const res = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>('/products', { params });
  return res.data.data;
}

export async function getProduct(id: number) {
  const res = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
  return res.data.data;
}

export async function createProduct(data: Partial<Product>) {
  const res = await api.post<{ success: boolean; data: Product }>('/products', data);
  return res.data.data;
}

export async function updateProduct(id: number, data: Partial<Product>) {
  const res = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
  return res.data.data;
}

export async function addStock(productId: number, quantity: number, reason: string) {
  const res = await api.post<{ success: boolean; data: Product }>(`/products/${productId}/stock/add`, { quantity, reason });
  return res.data.data;
}

export async function removeStock(productId: number, quantity: number, reason: string) {
  const res = await api.post<{ success: boolean; data: Product }>(`/products/${productId}/stock/remove`, { quantity, reason });
  return res.data.data;
}

export async function getStockMovements(productId: number) {
  const res = await api.get<{ success: boolean; data: StockMovement[] }>(`/products/${productId}/stock-movements`);
  return res.data.data;
}
