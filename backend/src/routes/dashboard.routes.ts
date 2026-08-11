import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/prisma';
import { getRecentChallans } from '../services/challan.service';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      totalProducts,
      draftChallans,
      lowStockProducts,
      recentChallans,
      followUpsDue,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
      prisma.$queryRaw<any[]>`
        SELECT id, name, sku, "currentStock", "minimumStock", location
        FROM "Product"
        WHERE "currentStock" <= "minimumStock"
        ORDER BY "currentStock" ASC
        LIMIT 8
      `,
      getRecentChallans(5),
      prisma.customer.findMany({
        where: { followUpDate: { lte: new Date() }, status: { not: 'INACTIVE' } },
        orderBy: { followUpDate: 'asc' },
        take: 5,
        select: { id: true, name: true, businessName: true, followUpDate: true, status: true, mobile: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalCustomers, totalProducts, draftChallans, lowStockCount: lowStockProducts.length },
        lowStockProducts,
        recentChallans,
        followUpsDue,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
