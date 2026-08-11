import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(5, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().datetime({ offset: true }).optional().or(z.literal('')).nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const followUpNoteSchema = z.object({
  note: z.string().min(1, 'Note is required').max(1000, 'Note too long'),
  followUpDate: z.string().datetime({ offset: true }).optional().or(z.literal('')).nullable(),
});
