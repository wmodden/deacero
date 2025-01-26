import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Fake product data
const productData = [
  {
    name: 'Rebar',
    description: 'High-strength steel rebar for concrete reinforcement',
    category: 'Construction',
    price: new Decimal(499.99),
    sku: 'DEACERO-001',
  },
  {
    name: 'Wire Rod',
    description: 'Versatile wire rod for industrial and construction use',
    category: 'Industrial',
    price: new Decimal(599.99),
    sku: 'DEACERO-002',
  },
  {
    name: 'Nails',
    description: 'Durable steel nails for construction and general use',
    category: 'Construction',
    price: new Decimal(99.99),
    sku: 'DEACERO-003',
  },
  {
    name: 'Chain Link Fence',
    description: 'Galvanized steel chain link fence for security',
    category: 'Agriculture',
    price: new Decimal(299.99),
    sku: 'DEACERO-004',
  },
  {
    name: 'Barbed Wire',
    description: 'High-tensile barbed wire for fencing and security',
    category: 'Agriculture',
    price: new Decimal(199.99),
    sku: 'DEACERO-005',
  },
  {
    name: 'Welded Wire Mesh',
    description: 'Steel wire mesh for construction and reinforcement',
    category: 'Construction',
    price: new Decimal(699.99),
    sku: 'DEACERO-006',
  },
  {
    name: 'Steel Wire',
    description: 'Industrial-grade steel wire for various applications',
    category: 'Industrial',
    price: new Decimal(249.99),
    sku: 'DEACERO-007',
  },
  {
    name: 'Roofing Nails',
    description: 'Galvanized nails designed for roofing applications',
    category: 'Construction',
    price: new Decimal(149.99),
    sku: 'DEACERO-008',
  },
  {
    name: 'Hexagonal Wire Mesh',
    description: 'Flexible wire mesh for agricultural use',
    category: 'Agriculture',
    price: new Decimal(399.99),
    sku: 'DEACERO-009',
  },
  {
    name: 'Galvanized Steel Pipe',
    description: 'Corrosion-resistant steel pipes for construction',
    category: 'Construction',
    price: new Decimal(899.99),
    sku: 'DEACERO-010',
  },
];

async function main() {
  // Seed product table with fake products
  const products = await Promise.all(
    productData.map((product) =>
      prisma.product.upsert({
        where: { sku: product.sku },
        create: product,
        update: {},
      }),
    ),
  );

  // Log created products
  console.log('Seeded Products: ', products.length);
}

main()
  .catch((e) => {
    console.error('Error while seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
