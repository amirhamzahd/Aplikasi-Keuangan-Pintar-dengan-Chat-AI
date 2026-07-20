const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { userId: '7720738b-abcb-48fd-9499-4e27b1e3cfea', type: 'expense' },
    orderBy: { date: 'desc' }
  });
  
  let total = 0;
  txs.forEach(t => {
    console.log(`${t.date.toISOString()} | ${t.amount} | ${t.description}`);
    total += t.amount;
  });
  console.log('Total:', total);
}

main().finally(() => prisma.$disconnect());
