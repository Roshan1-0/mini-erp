import { Request, Response, NextFunction } from 'express';
import { createChallanSchema } from '../validators/challan.validator';
import * as challanService from '../services/challan.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await challanService.listChallans({ page, limit, search, status });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createChallanSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const challan = await challanService.createChallan(parsed.data.customerId, parsed.data.items, req.user!.id);
    res.status(201).json({ success: true, message: 'Challan created as draft', data: challan });
  } catch (err: any) {
    if (err.message === 'CUSTOMER_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Customer not found', error: 'CUSTOMER_NOT_FOUND' });
      return;
    }
    if (err.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'One or more products not found', error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid challan ID', error: 'INVALID_ID' }); return; }

    const challan = await challanService.getChallanById(id);
    res.json({ success: true, data: challan });
  } catch (err: any) {
    if (err.message === 'CHALLAN_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Challan not found', error: 'CHALLAN_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid challan ID', error: 'INVALID_ID' }); return; }

    const challan = await challanService.confirmChallan(id, req.user!.id);
    res.json({ success: true, message: 'Challan confirmed and stock deducted', data: challan });
  } catch (err: any) {
    if (err.message === 'CHALLAN_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Challan not found', error: 'CHALLAN_NOT_FOUND' });
      return;
    }
    if (err.message === 'CHALLAN_ALREADY_CONFIRMED') {
      res.status(400).json({ success: false, message: 'Challan has already been confirmed', error: 'CHALLAN_ALREADY_CONFIRMED' });
      return;
    }
    if (err.message === 'CHALLAN_CANCELLED') {
      res.status(400).json({ success: false, message: 'Cancelled challan cannot be confirmed', error: 'CHALLAN_CANCELLED' });
      return;
    }
    if (err.message.startsWith('INSUFFICIENT_STOCK')) {
      const name = err.message.split(':')[1] || 'a product';
      res.status(400).json({ success: false, message: `Insufficient stock for ${name}`, error: 'INSUFFICIENT_STOCK' });
      return;
    }
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid challan ID', error: 'INVALID_ID' }); return; }

    const challan = await challanService.cancelChallan(id);
    res.json({ success: true, message: 'Challan cancelled', data: challan });
  } catch (err: any) {
    if (err.message === 'CHALLAN_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Challan not found', error: 'CHALLAN_NOT_FOUND' });
      return;
    }
    if (err.message === 'CONFIRMED_CHALLAN_CANNOT_BE_CANCELLED') {
      res.status(400).json({ success: false, message: 'Confirmed challan cannot be cancelled', error: 'CONFIRMED_CHALLAN_CANNOT_BE_CANCELLED' });
      return;
    }
    if (err.message === 'CHALLAN_ALREADY_CANCELLED') {
      res.status(400).json({ success: false, message: 'Challan is already cancelled', error: 'CHALLAN_ALREADY_CANCELLED' });
      return;
    }
    next(err);
  }
}
