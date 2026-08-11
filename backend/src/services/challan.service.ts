import prisma from '../config/prisma';
import { generateChallanNumber } from '../utils/challanNumber';

interface ChallanItem {
  productId: number;
  quantity: number;
}

interface ListChallansParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export async function listChallans({ page, limit, search, status }: ListChallansParams) {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { challanNumber: { contains: search, mode: 'insensitive' } },
      { customerNameSnapshot: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    }),
    prisma.salesChallan.count({ where }),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function createChallan(customerId: number, items: ChallanItem[], createdById: number) {
  // Load customer for snapshot
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

  // Load all products for snapshot + validation
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== productIds.length) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Build challan items with snapshots
  let totalQuantity = 0;
  let totalAmount = 0;

  const challanItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.unitPrice);
    const totalPrice = unitPrice * item.quantity;
    totalQuantity += item.quantity;
    totalAmount += totalPrice;

    return {
      productId: item.productId,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku,
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      totalPrice,
    };
  });

  const challanNumber = await generateChallanNumber();

  return prisma.salesChallan.create({
    data: {
      challanNumber,
      customerId,
      customerNameSnapshot: customer.name,
      businessNameSnapshot: customer.businessName,
      mobileSnapshot: customer.mobile,
      gstNumberSnapshot: customer.gstNumber,
      totalQuantity,
      totalAmount,
      status: 'DRAFT',
      createdById,
      items: { create: challanItems },
    },
    include: { items: true, customer: true },
  });
}

export async function getChallanById(id: number) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      items: true,
      customer: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!challan) throw new Error('CHALLAN_NOT_FOUND');
  return challan;
}

// Critical: atomic stock deduction + movement creation + status update
export async function confirmChallan(challanId: number, userId: number) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id: challanId },
    include: { items: true },
  });

  if (!challan) throw new Error('CHALLAN_NOT_FOUND');
  if (challan.status === 'CONFIRMED') throw new Error('CHALLAN_ALREADY_CONFIRMED');
  if (challan.status === 'CANCELLED') throw new Error('CHALLAN_CANCELLED');

  // Load current stock for all products
  const productIds = challan.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Check stock before starting transaction
  for (const item of challan.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productNameSnapshot}`);
    if (product.currentStock < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK:${item.productNameSnapshot}`);
    }
  }

  // Atomic transaction — all or nothing
  return prisma.$transaction(async (tx) => {
    // Deduct stock and create OUT movements for each item
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdById: userId,
        },
      });
    }

    // Update challan status
    return tx.salesChallan.update({
      where: { id: challanId },
      data: { status: 'CONFIRMED' },
      include: {
        items: true,
        customer: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
  });
}

export async function cancelChallan(challanId: number) {
  const challan = await prisma.salesChallan.findUnique({ where: { id: challanId } });
  if (!challan) throw new Error('CHALLAN_NOT_FOUND');
  if (challan.status === 'CONFIRMED') throw new Error('CONFIRMED_CHALLAN_CANNOT_BE_CANCELLED');
  if (challan.status === 'CANCELLED') throw new Error('CHALLAN_ALREADY_CANCELLED');

  return prisma.salesChallan.update({
    where: { id: challanId },
    data: { status: 'CANCELLED' },
    include: { items: true },
  });
}

export async function getRecentChallans(limit = 5) {
  return prisma.salesChallan.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { createdBy: { select: { name: true } } },
  });
}
