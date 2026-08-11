import prisma from '../config/prisma';

interface ListProductsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export async function listProducts({ page, limit, search, category }: ListProductsParams) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) where.category = category;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function createProduct(data: any) {
  return prisma.product.create({ data });
}

export async function getProductById(id: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');
  return product;
}

export async function updateProduct(id: number, data: any) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');
  return prisma.product.update({ where: { id }, data });
}

export async function addStock(productId: number, quantity: number, reason: string, createdById: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { currentStock: { increment: quantity } },
    }),
    prisma.stockMovement.create({
      data: { productId, quantity, movementType: 'IN', reason, createdById },
    }),
  ]);

  return updated;
}

export async function removeStock(productId: number, quantity: number, reason: string, createdById: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  // Check available stock
  if (product.currentStock < quantity) {
    throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { currentStock: { decrement: quantity } },
    }),
    prisma.stockMovement.create({
      data: { productId, quantity, movementType: 'OUT', reason, createdById },
    }),
  ]);

  return updated;
}

export async function getStockMovements(productId: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  return prisma.stockMovement.findMany({
    where: { productId },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getDashboardStats() {
  const totalProducts = await prisma.product.count();

  // Products where currentStock <= minimumStock
  const lowStockProducts = await prisma.$queryRaw<any[]>`
    SELECT id, name, sku, category, "currentStock", "minimumStock", location
    FROM "Product"
    WHERE "currentStock" <= "minimumStock"
    ORDER BY "currentStock" ASC
    LIMIT 10
  `;

  return { totalProducts, lowStockProducts };
}
