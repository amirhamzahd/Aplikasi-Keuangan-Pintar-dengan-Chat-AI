const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'alzhamirdinnillah@gmail.com' },
    data: { planType: 'NONE', planExpiredAt: null, isPremium: false, premiumUntil: null }
  });
  console.log('Reset done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
