import api from './api';
import type { SalesChallan, PaginatedResponse } from '../types';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface CreateChallanPayload {
  customerId: number;
  items: Array<{ productId: number; quantity: number }>;
}

export async function getChallans(params: ListParams = {}) {
  const res = await api.get<{ success: boolean; data: PaginatedResponse<SalesChallan> }>('/challans', { params });
  return res.data.data;
}

export async function getChallan(id: number) {
  const res = await api.get<{ success: boolean; data: SalesChallan }>(`/challans/${id}`);
  return res.data.data;
}

export async function createChallan(payload: CreateChallanPayload) {
  const res = await api.post<{ success: boolean; data: SalesChallan }>('/challans', payload);
  return res.data.data;
}

export async function confirmChallan(id: number) {
  const res = await api.post<{ success: boolean; data: SalesChallan }>(`/challans/${id}/confirm`);
  return res.data.data;
}

export async function cancelChallan(id: number) {
  const res = await api.post<{ success: boolean; data: SalesChallan }>(`/challans/${id}/cancel`);
  return res.data.data;
}

export async function downloadInvoice(id: number): Promise<Blob> {
  const res = await api.get(`/challans/${id}/invoice`, { responseType: 'blob' });
  return res.data;
}
