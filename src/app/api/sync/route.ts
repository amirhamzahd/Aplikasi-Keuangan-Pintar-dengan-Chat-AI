import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.id;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

    // Fetch all related data
    const [transactions, accounts, budgets, goals, subscriptions, debts, categories] = await Promise.all([
      prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' }, include: { category: true } }),
      prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.budget.findMany({ where: { userId }, include: { category: true } }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.subscription.findMany({ where: { userId }, orderBy: { nextPayment: 'asc' } }),
      prisma.debt.findMany({ where: { userId }, orderBy: { dueDate: 'asc' } }),
      prisma.category.findMany({ where: { userId } })
    ]);

    // For backwards compatibility with the frontend, we need to map categoryId back to category string in some places
    // if the frontend hasn't been completely updated yet.
    // However, the best approach is to fix the frontend components.

    return NextResponse.json({
      user,
      transactions: transactions.map(t => ({
        ...t,
        category: t.category?.name || 'Uncategorized' // Fallback for UI that still expects string
      })),
      accounts,
      budgets: budgets.map(b => ({
        ...b,
        category: b.category?.name || 'Uncategorized' // Fallback for UI
      })),
      goals,
      subscriptions: subscriptions.map(s => ({
        ...s,
        billingCycle: s.cycle,
        nextBilling: s.nextPayment.toISOString()
      })),
      debts: debts.map(d => ({
        ...d,
        person: d.name,
        type: d.type === 'give' ? 'receivable' : 'debt',
        dueDate: d.dueDate.toISOString(),
        status: d.status === 'active' ? 'pending' : 'paid'
      })),
      categories
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: 'Gagal sinkronisasi data' }, { status: 500 });
  }
}
