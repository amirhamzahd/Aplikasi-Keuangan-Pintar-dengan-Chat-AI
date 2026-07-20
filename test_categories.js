const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { userId: '7720738b-abcb-48fd-9499-4e27b1e3cfea', type: 'expense' },
  });
  
  const categories = new Set();
  txs.forEach(t => {
    if (t.amount >= 100000) {
        console.log(t.amount, t.description, "->", t.category);
    }
    categories.add(t.category);
  });
  console.log('Categories:', Array.from(categories));
}

main().finally(() => prisma.$disconnect());
