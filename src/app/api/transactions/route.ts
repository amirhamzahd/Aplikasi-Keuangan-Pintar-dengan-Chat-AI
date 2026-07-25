import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  
  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.id },
      orderBy: { date: 'desc' },
      include: {
        category: true // Include category details
      }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengambil transaksi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  
  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, description, type, categoryId, tags, accountId, toAccountId, date } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId wajib diisi' }, { status: 400 });
    }

    const newTx = await prisma.transaction.create({
      data: {
        userId: session.id,
        amount: parseFloat(amount),
        description,
        type,
        categoryId,
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''), // temporary fix for tags string
        accountId,
        toAccountId: toAccountId || null,
        date: date ? new Date(date) : new Date(),
      }
    });

    return NextResponse.json(newTx);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menambah transaksi' }, { status: 500 });
  }
}
