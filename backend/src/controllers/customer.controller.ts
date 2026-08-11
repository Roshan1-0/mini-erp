import { Request, Response, NextFunction } from 'express';
import { createCustomerSchema, updateCustomerSchema, followUpNoteSchema } from '../validators/customer.validator';
import * as customerService from '../services/customer.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const result = await customerService.listCustomers({ page, limit, search, status, type });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const customer = await customerService.createCustomer(parsed.data);
    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid customer ID', error: 'INVALID_ID' }); return; }

    const customer = await customerService.getCustomerById(id);
    res.json({ success: true, data: customer });
  } catch (err: any) {
    if (err.message === 'CUSTOMER_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Customer not found', error: 'CUSTOMER_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid customer ID', error: 'INVALID_ID' }); return; }

    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const customer = await customerService.updateCustomer(id, parsed.data);
    res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (err: any) {
    if (err.message === 'CUSTOMER_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Customer not found', error: 'CUSTOMER_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function addFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = parseInt(req.params.id as string);
    if (isNaN(customerId)) { res.status(400).json({ success: false, message: 'Invalid customer ID', error: 'INVALID_ID' }); return; }

    const parsed = followUpNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const note = await customerService.addFollowUpNote(
      customerId,
      parsed.data.note,
      parsed.data.followUpDate as string | null | undefined,
      req.user!.id
    );
    res.status(201).json({ success: true, message: 'Follow-up note added', data: note });
  } catch (err: any) {
    if (err.message === 'CUSTOMER_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Customer not found', error: 'CUSTOMER_NOT_FOUND' });
      return;
    }
    next(err);
  }
}

export async function getFollowUps(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = parseInt(req.params.id as string);
    if (isNaN(customerId)) { res.status(400).json({ success: false, message: 'Invalid customer ID', error: 'INVALID_ID' }); return; }

    const notes = await customerService.getFollowUpNotes(customerId);
    res.json({ success: true, data: notes });
  } catch (err: any) {
    if (err.message === 'CUSTOMER_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Customer not found', error: 'CUSTOMER_NOT_FOUND' });
      return;
    }
    next(err);
  }
}
