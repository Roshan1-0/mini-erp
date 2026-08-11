import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: password,
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'sales@example.com',
      passwordHash: password,
      role: 'SALES',
    },
  });

  const warehouse = await prisma.user.upsert({
    where: { email: 'warehouse@example.com' },
    update: {},
    create: {
      name: 'Deepak Patel',
      email: 'warehouse@example.com',
      passwordHash: password,
      role: 'WAREHOUSE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'accounts@example.com' },
    update: {},
    create: {
      name: 'Priya Mehta',
      email: 'accounts@example.com',
      passwordHash: password,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Users seeded');

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'RICE-25' },
      update: {},
      create: {
        name: 'Premium Basmati Rice 25kg',
        sku: 'RICE-25',
        category: 'Grains',
        unitPrice: 1200,
        currentStock: 150,
        minimumStock: 20,
        location: 'Rack A-1',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'OIL-5L' },
      update: {},
      create: {
        name: 'Refined Sunflower Oil 5L',
        sku: 'OIL-5L',
        category: 'Oils',
        unitPrice: 650,
        currentStock: 80,
        minimumStock: 15,
        location: 'Rack B-2',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'FLOUR-10' },
      update: {},
      create: {
        name: 'Wheat Flour 10kg',
        sku: 'FLOUR-10',
        category: 'Grains',
        unitPrice: 380,
        currentStock: 4,
        minimumStock: 10,
        location: 'Rack A-3',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SUGAR-25' },
      update: {},
      create: {
        name: 'Sugar 25kg',
        sku: 'SUGAR-25',
        category: 'Sweeteners',
        unitPrice: 900,
        currentStock: 60,
        minimumStock: 10,
        location: 'Rack C-1',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'TEA-1' },
      update: {},
      create: {
        name: 'Premium Tea Powder 1kg',
        sku: 'TEA-1',
        category: 'Beverages',
        unitPrice: 450,
        currentStock: 3,
        minimumStock: 8,
        location: 'Rack D-2',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SALT-5' },
      update: {},
      create: {
        name: 'Iodized Salt 5kg',
        sku: 'SALT-5',
        category: 'Condiments',
        unitPrice: 120,
        currentStock: 200,
        minimumStock: 30,
        location: 'Rack E-1',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'DAL-5' },
      update: {},
      create: {
        name: 'Toor Dal 5kg',
        sku: 'DAL-5',
        category: 'Pulses',
        unitPrice: 520,
        currentStock: 45,
        minimumStock: 12,
        location: 'Rack A-5',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'MUSTARD-1' },
      update: {},
      create: {
        name: 'Mustard Oil 1L',
        sku: 'MUSTARD-1',
        category: 'Oils',
        unitPrice: 180,
        currentStock: 120,
        minimumStock: 20,
        location: 'Rack B-4',
      },
    }),
  ]);

  console.log('✅ Products seeded');

  // Create stock movements for seeded products
  const movementData = products.map((p) => ({
    productId: p.id,
    quantity: p.currentStock,
    movementType: 'IN' as const,
    reason: 'Initial stock entry',
    createdById: warehouse.id,
  }));

  await prisma.stockMovement.createMany({ data: movementData });
  console.log('✅ Stock movements seeded');

  // Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Arvind Patel',
        mobile: '9876543210',
        email: 'arvind@shretraders.com',
        businessName: 'Shree Traders',
        gstNumber: '27AABCS1429B1Z1',
        type: 'WHOLESALE',
        address: '12, Main Market, Surat, Gujarat 395001',
        status: 'ACTIVE',
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.customer.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Suresh Patel',
        mobile: '9823456789',
        email: 'suresh@patelwholesale.com',
        businessName: 'Patel Wholesale Mart',
        gstNumber: '27AADCP1234C1Z2',
        type: 'DISTRIBUTOR',
        address: '45, Industrial Estate, Vadodara, Gujarat 390001',
        status: 'ACTIVE',
        followUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.customer.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Aarav Shah',
        mobile: '9812345678',
        email: 'aarav@aaravdist.com',
        businessName: 'Aarav Distributors',
        gstNumber: '27AACSA5678D1Z3',
        type: 'DISTRIBUTOR',
        address: '78, Ring Road, Ahmedabad, Gujarat 380001',
        status: 'ACTIVE',
      },
    }),
    prisma.customer.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'Meena Joshi',
        mobile: '9745678901',
        email: 'meena@kirana.com',
        businessName: 'Joshi Kirana Store',
        type: 'RETAIL',
        address: '23, Gandhi Nagar, Rajkot, Gujarat 360001',
        status: 'LEAD',
        followUpDate: new Date(),
      },
    }),
    prisma.customer.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: 'Ramesh Gupta',
        mobile: '9678901234',
        email: 'ramesh@guptamart.com',
        businessName: 'Gupta General Mart',
        type: 'RETAIL',
        address: '56, Market Street, Surat, Gujarat 395002',
        status: 'INACTIVE',
      },
    }),
  ]);

  console.log('✅ Customers seeded');

  // Add a follow-up note for the first customer
  await prisma.followUpNote.create({
    data: {
      customerId: customers[0].id,
      note: 'Interested in bulk rice order next month. Discussed pricing for 500 bags.',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdById: sales.id,
    },
  });

  await prisma.followUpNote.create({
    data: {
      customerId: customers[1].id,
      note: 'Follow up about the pending oil shipment. Payment expected by end of week.',
      createdById: sales.id,
    },
  });

  console.log('✅ Follow-up notes seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest credentials (all use password: password123)');
  console.log('  admin@example.com     — ADMIN');
  console.log('  sales@example.com     — SALES');
  console.log('  warehouse@example.com — WAREHOUSE');
  console.log('  accounts@example.com  — ACCOUNTS');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
