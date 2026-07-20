import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) return NextResponse.json({ error: 'Email wajib disertakan' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil akun' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, name, type, balance } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

    const newAccount = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type,
        balance: parseFloat(balance),
      }
    });

    return NextResponse.json(newAccount);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah akun' }, { status: 500 });
  }
}
