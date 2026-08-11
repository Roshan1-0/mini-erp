import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

router.get('/', customerController.list);
router.post('/', requireRole('ADMIN', 'SALES'), customerController.create);
router.get('/:id', customerController.getOne);
router.put('/:id', requireRole('ADMIN', 'SALES'), customerController.update);
router.post('/:id/follow-ups', requireRole('ADMIN', 'SALES'), customerController.addFollowUp);
router.get('/:id/follow-ups', customerController.getFollowUps);

export default router;
