import { Request, Response, NextFunction } from 'express';
import { createProductSchema, updateProductSchema, stockMovementSchema } from '../validators/product.validator';
import * as productService from '../services/product.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    const result = await productService.listProducts({ page, limit, search, category });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const product = await productService.createProduct(parsed.data);
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid product ID', error: 'INVALID_ID' }); return; }

    const product = await productService.getProductById(id);
    res.json({ success: true, data: product });
  } catch (err: any) {
    if (err.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Product not found', error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid product ID', error: 'INVALID_ID' }); return; }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const product = await productService.updateProduct(id, parsed.data);
    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (err: any) {
    if (err.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Product not found', error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function addStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid product ID', error: 'INVALID_ID' }); return; }

    const parsed = stockMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const product = await productService.addStock(id, parsed.data.quantity, parsed.data.reason, req.user!.id);
    res.json({ success: true, message: `Stock added successfully. New stock: ${product.currentStock}`, data: product });
  } catch (err: any) {
    if (err.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Product not found', error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function removeStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid product ID', error: 'INVALID_ID' }); return; }

    const parsed = stockMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const product = await productService.removeStock(id, parsed.data.quantity, parsed.data.reason, req.user!.id);
    res.json({ success: true, message: `Stock removed successfully. New stock: ${product.currentStock}`, data: product });
  } catch (err: any) {
    if (err.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Product not found', error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    if (err.message.startsWith('INSUFFICIENT_STOCK')) {
      const name = err.message.split(':')[1] || 'product';
      res.status(400).json({ success: false, message: `Insufficient stock for ${name}`, error: 'INSUFFICIENT_STOCK' });
      return;
    }
    next(err);
  }
}

export async function getMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid product ID', error: 'INVALID_ID' }); return; }

    const movements = await productService.getStockMovements(id);
    res.json({ success: true, data: movements });
  } catch (err: any) {
    if (err.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Product not found', error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    next(err);
  }
}
