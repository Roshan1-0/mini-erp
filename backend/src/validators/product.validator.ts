import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative').optional(),
  location: z.string().min(1, 'Location is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const stockMovementSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().min(1, 'Reason is required').max(200),
});
