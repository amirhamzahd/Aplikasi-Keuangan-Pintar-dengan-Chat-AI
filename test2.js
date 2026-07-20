const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany();
  
  // Aggregate per user for expense
  const users = {};
  txs.forEach(t => {
    if (!users[t.userId]) users[t.userId] = { inc: 0, exp: 0 };
    if (t.type === 'expense') users[t.userId].exp += t.amount;
    if (t.type === 'income') users[t.userId].inc += t.amount;
  });
  
  console.log("Total per user:");
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
