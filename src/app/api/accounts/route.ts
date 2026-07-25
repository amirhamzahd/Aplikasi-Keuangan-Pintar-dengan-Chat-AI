import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  
  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accounts = await prisma.account.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengambil akun' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  
  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, type, balance } = await req.json();

    const newAccount = await prisma.account.create({
      data: {
        userId: session.id,
        name,
        type,
        balance: parseFloat(balance),
      }
    });

    return NextResponse.json(newAccount);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menambah akun' }, { status: 500 });
  }
}
