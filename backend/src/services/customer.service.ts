import prisma from '../config/prisma';

interface ListCustomersParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  type?: string;
}

export async function listCustomers({ page, limit, search, status, type }: ListCustomersParams) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (type) where.type = type;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function createCustomer(data: any) {
  return prisma.customer.create({ data });
}

export async function getCustomerById(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
  return customer;
}

export async function updateCustomer(id: number, data: any) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
  return prisma.customer.update({ where: { id }, data });
}

export async function addFollowUpNote(customerId: number, note: string, followUpDate: string | null | undefined, createdById: number) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

  const followUp = await prisma.followUpNote.create({
    data: {
      customerId,
      note,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      createdById,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  // Update customer follow-up date if provided
  if (followUpDate) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { followUpDate: new Date(followUpDate) },
    });
  }

  return followUp;
}

export async function getFollowUpNotes(customerId: number) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

  return prisma.followUpNote.findMany({
    where: { customerId },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
