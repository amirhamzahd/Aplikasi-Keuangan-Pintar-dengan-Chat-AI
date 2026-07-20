import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email wajib disertakan' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        transactions: { orderBy: { date: 'desc' } },
        accounts: { orderBy: { createdAt: 'asc' } },
        categories: true,
        budgets: true,
        goals: { orderBy: { createdAt: 'desc' } },
        subscriptions: true,
        debts: { orderBy: { createdAt: 'desc' } },
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Smart seed/update default categories
    const defaultCats = [
      { name: 'Makanan & Minuman', icon: 'Coffee', color: '#F59E0B', type: 'expense', isBuiltIn: true },
      { name: 'Transportasi', icon: 'Car', color: '#2563EB', type: 'expense', isBuiltIn: true },
      { name: 'Belanja', icon: 'ShoppingBag', color: '#EC4899', type: 'expense', isBuiltIn: true },
      { name: 'Tagihan & Utilitas', icon: 'Zap', color: '#6366F1', type: 'expense', isBuiltIn: true },
      { name: 'Hiburan', icon: 'Activity', color: '#14B8A6', type: 'expense', isBuiltIn: true },
      { name: 'Pekerjaan', icon: 'Briefcase', color: '#64748B', type: 'expense', isBuiltIn: true },
      { name: 'Kesehatan', icon: 'Heart', color: '#EF4444', type: 'expense', isBuiltIn: true },
      { name: 'Pendidikan', icon: 'GraduationCap', color: '#8B5CF6', type: 'expense', isBuiltIn: true },
      { name: 'Hutang', icon: 'ArrowDownRight', color: '#6366F1', type: 'expense', isBuiltIn: true },
      { name: 'Piutang', icon: 'ArrowUpRight', color: '#10B981', type: 'expense', isBuiltIn: true },
      { name: 'Pendapatan', icon: 'DollarSign', color: '#10B981', type: 'income', isBuiltIn: true },
      { name: 'Lainnya', icon: 'Receipt', color: '#64748B', type: 'expense', isBuiltIn: true }
    ];

    let userCategories = user.categories;
    const existingCatNames = new Set(userCategories.map((c: any) => c.name.toLowerCase()));
    const missingCats = defaultCats.filter(c => !existingCatNames.has(c.name.toLowerCase()));

    if (missingCats.length > 0) {
      await prisma.category.createMany({
        data: missingCats.map(c => ({ ...c, userId: user.id }))
      });
      // Fetch updated categories
      userCategories = await prisma.category.findMany({
        where: { userId: user.id }
      });
    }

    // Pisahkan user object dari relasi datanya
    const { password, verificationToken, ...userData } = user;

    return NextResponse.json({
      user: userData,
      transactions: user.transactions.map((tx: any) => {
        let parsedTags = [];
        try {
          parsedTags = tx.tags ? JSON.parse(tx.tags) : [];
        } catch (e) {
          parsedTags = tx.tags ? tx.tags.split(',').map((t: string) => t.trim()) : [];
        }
        return { ...tx, tags: parsedTags };
      }),
      accounts: user.accounts,
      categories: userCategories,
      budgets: user.budgets.map((b: any) => {
        const now = new Date();
        const spent = user.transactions
          .filter((t: any) => 
            t.type === 'expense' && 
            t.category.toLowerCase() === b.category.toLowerCase() &&
            new Date(t.date).getMonth() === now.getMonth() &&
            new Date(t.date).getFullYear() === now.getFullYear()
          )
          .reduce((sum: number, t: any) => sum + t.amount, 0);
        return { ...b, spent };
      }),
      goals: user.goals,
      subscriptions: user.subscriptions.map((s: any) => ({
        ...s,
        billingCycle: s.cycle,
        nextBilling: s.nextPayment,
      })),
      debts: user.debts.map((d: any) => ({
        ...d,
        person: d.name,
        type: d.type === 'take' ? 'debt' : 'receivable',
        status: d.status === 'active' ? 'pending' : 'paid'
      })),
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: 'Gagal mengambil data sinkronisasi' }, { status: 500 });
  }
}
