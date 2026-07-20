import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email wajib disertakan' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil transaksi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, amount, description, type, category, tags, accountId, toAccountId, date } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

    const newTx = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        description,
        type,
        category,
        tags: tags || '',
        accountId,
        toAccountId: toAccountId || null,
        date: date ? new Date(date) : new Date(),
      }
    });

    return NextResponse.json(newTx);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah transaksi' }, { status: 500 });
  }
}
