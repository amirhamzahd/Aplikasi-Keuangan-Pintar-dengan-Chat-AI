import { PrismaClient } from '@prisma/client';

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
  const users = await prisma.user.findMany();
  for (const user of users) {
    // Check if user has categories
    const existingCats = await prisma.category.findMany({ where: { userId: user.id } });
    const existingNames = new Set(existingCats.map(c => c.name));
    
    const categoriesToAdd = defaultCategories.filter(cat => !existingNames.has(cat.name));
    
    if (categoriesToAdd.length > 0) {
      await prisma.category.createMany({
        data: categoriesToAdd.map(cat => ({ ...cat, userId: user.id }))
      });
      console.log(`Seeded ${categoriesToAdd.length} categories for user ${user.email}`);
    } else {
      console.log(`User ${user.email} already has complete default categories.`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
