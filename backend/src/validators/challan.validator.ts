import { z } from 'zod';

const challanItemSchema = z.object({
  productId: z.number().int().positive('Invalid product'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createChallanSchema = z.object({
  customerId: z.number().int().positive('Please select a customer'),
  items: z.array(challanItemSchema).min(1, 'At least one product is required'),
});
