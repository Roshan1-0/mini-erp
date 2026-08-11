import prisma from '../config/prisma';

// Generate CH-YYYY-NNNN format challan numbers
export async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  // Count challans this year
  const count = await prisma.salesChallan.count({
    where: {
      challanNumber: { startsWith: prefix },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}${sequence}`;
}
