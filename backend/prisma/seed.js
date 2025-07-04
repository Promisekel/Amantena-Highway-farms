const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@amantena.com' },
    update: {},
    create: {
      name: 'Farm Administrator',
      email: 'admin@amantena.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@amantena.com' },
    update: {},
    create: {
      name: 'Farm Staff',
      email: 'staff@amantena.com',
      passwordHash: staffPassword,
      role: 'STAFF',
    },
  });

  // Create sample products
  const products = [
    {
      name: 'Premium Corn Feed',
      category: 'Main',
      description: 'High-quality corn feed for livestock',
      price: 25.99,
      quantity: 150,
      sku: 'PCF-001',
      threshold: 20,
    },
    {
      name: 'Protein Concentrate',
      category: 'Concentrate',
      description: 'High-protein supplement for animals',
      price: 45.50,
      quantity: 75,
      sku: 'PC-002',
      threshold: 15,
    },
    {
      name: 'Vitamin Supplement',
      category: 'Supplement',
      description: 'Essential vitamins and minerals',
      price: 18.75,
      quantity: 200,
      sku: 'VS-003',
      threshold: 30,
    },
    {
      name: 'Organic Hay',
      category: 'Main',
      description: 'Fresh organic hay bales',
      price: 12.00,
      quantity: 8, // Low stock for testing alerts
      sku: 'OH-004',
      threshold: 10,
    },
    {
      name: 'Mineral Block',
      category: 'Supplement',
      description: 'Salt and mineral lick blocks',
      price: 8.99,
      quantity: 45,
      sku: 'MB-005',
      threshold: 10,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  // Create sample sales
  const salesData = [
    {
      productId: (await prisma.product.findFirst({ where: { sku: 'PCF-001' } })).id,
      quantitySold: 5,
      unitPrice: 25.99,
      totalAmount: 129.95,
      userId: staff.id,
      soldAt: new Date(Date.now() - 86400000), // Yesterday
    },
    {
      productId: (await prisma.product.findFirst({ where: { sku: 'PC-002' } })).id,
      quantitySold: 2,
      unitPrice: 45.50,
      totalAmount: 91.00,
      userId: staff.id,
      soldAt: new Date(Date.now() - 172800000), // 2 days ago
    },
  ];

  for (const sale of salesData) {
    await prisma.sale.create({
      data: sale,
    });
  }

  // Create sample album
  const album = await prisma.album.upsert({
    where: { id: 'sample-album' },
    update: {},
    create: {
      id: 'sample-album',
      title: 'Farm Gallery',
    },
  });

  // Create sample calendar events
  const events = [
    {
      title: 'Monthly Inventory Check',
      date: new Date(Date.now() + 86400000 * 7), // Next week
      type: 'MAINTENANCE',
      description: 'Complete inventory audit and restocking',
      userId: admin.id,
    },
    {
      title: 'Staff Meeting',
      date: new Date(Date.now() + 86400000 * 3), // In 3 days
      type: 'MEETING',
      description: 'Weekly team meeting and updates',
      userId: admin.id,
    },
  ];

  for (const event of events) {
    await prisma.calendarEvent.create({
      data: event,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin Login: admin@amantena.com / admin123');
  console.log('👤 Staff Login: staff@amantena.com / staff123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
