import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(authenticate);

router.get('/', productController.list);
router.post('/', requireRole('ADMIN'), productController.create);
router.get('/:id', productController.getOne);
router.put('/:id', requireRole('ADMIN'), productController.update);
// Stock management — Warehouse and Admin only
router.post('/:id/stock/add', requireRole('ADMIN', 'WAREHOUSE'), productController.addStock);
router.post('/:id/stock/remove', requireRole('ADMIN', 'WAREHOUSE'), productController.removeStock);
router.get('/:id/stock-movements', productController.getMovements);

export default router;
