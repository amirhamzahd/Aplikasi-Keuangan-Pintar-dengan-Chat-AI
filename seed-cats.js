const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Makanan & Minuman', type: 'expense', icon: 'pizza', color: '#ff6b6b' },
  { name: 'Transportasi', type: 'expense', icon: 'car', color: '#4dabf7' },
  { name: 'Belanja', type: 'expense', icon: 'shopping-cart', color: '#fcc419' },
  { name: 'Tagihan & Utilitas', type: 'expense', icon: 'zap', color: '#fa5252' },
  { name: 'Hiburan', type: 'expense', icon: 'film', color: '#be4bdb' },
  { name: 'Pekerjaan', type: 'expense', icon: 'briefcase', color: '#4c6ef5' },
  { name: 'Kesehatan', type: 'expense', icon: 'heart', color: '#e64980' },
  { name: 'Pendidikan', type: 'expense', icon: 'book', color: '#fd7e14' },
  { name: 'Gaji', type: 'income', icon: 'wallet', color: '#51cf66' },
  { name: 'Investasi', type: 'income', icon: 'trending-up', color: '#20c997' },
  { name: 'Lainnya', type: 'expense', icon: 'more-horizontal', color: '#868e96' }
];

async function main() {
  // Get all users
  const users = await prisma.user.findMany({
    include: { categories: true }
  });

  let updatedCount = 0;

  for (const user of users) {
    if (user.categories.length === 0) {
      await prisma.category.createMany({
        data: defaultCategories.map(cat => ({
          ...cat,
          userId: user.id
        }))
      });
      updatedCount++;
      console.log(`Added categories for user: ${user.email}`);
    }
  }

  console.log(`Finished! Seeded categories for ${updatedCount} users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
