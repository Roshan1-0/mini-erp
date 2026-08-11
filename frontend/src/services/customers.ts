import api from './api';
import type { Customer, FollowUpNote, PaginatedResponse } from '../types';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}

export async function getCustomers(params: ListParams = {}) {
  const res = await api.get<{ success: boolean; data: PaginatedResponse<Customer> }>('/customers', { params });
  return res.data.data;
}

export async function getCustomer(id: number) {
  const res = await api.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
  return res.data.data;
}

export async function createCustomer(data: Partial<Customer>) {
  const res = await api.post<{ success: boolean; data: Customer }>('/customers', data);
  return res.data.data;
}

export async function updateCustomer(id: number, data: Partial<Customer>) {
  const res = await api.put<{ success: boolean; data: Customer }>(`/customers/${id}`, data);
  return res.data.data;
}

export async function getFollowUps(customerId: number) {
  const res = await api.get<{ success: boolean; data: FollowUpNote[] }>(`/customers/${customerId}/follow-ups`);
  return res.data.data;
}

export async function addFollowUp(customerId: number, note: string, followUpDate?: string | null) {
  const res = await api.post<{ success: boolean; data: FollowUpNote }>(`/customers/${customerId}/follow-ups`, {
    note,
    followUpDate,
  });
  return res.data.data;
}
