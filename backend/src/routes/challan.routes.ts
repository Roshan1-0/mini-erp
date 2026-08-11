import { Router } from 'express';
import * as challanController from '../controllers/challan.controller';
import * as invoiceController from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(authenticate);

router.get('/', challanController.list);
router.post('/', requireRole('ADMIN', 'SALES'), challanController.create);
router.get('/:id', challanController.getOne);
router.post('/:id/confirm', requireRole('ADMIN', 'SALES'), challanController.confirm);
router.post('/:id/cancel', requireRole('ADMIN', 'SALES'), challanController.cancel);

// Invoice PDF — Accounts and Admin can download
router.get('/:id/invoice', requireRole('ADMIN', 'ACCOUNTS'), invoiceController.generate);

export default router;
