import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import midtransClient from 'midtrans-client';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hapus blok pengecekan isPremium agar user bisa upgrade/perpanjang

    // Midtrans API initialization
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    
    let snap = new midtransClient.Snap({
      isProduction: isProd,
      serverKey: serverKey,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
    });

    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { plan } = await req.json();

    if (!['BASIC', 'PLUS', 'PRO'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const planPrices = {
      BASIC: 49000,
      PLUS: 59000,
      PRO: 69000
    };

    const planNames = {
      BASIC: 'DIAMOND Basic (1 Tahun)',
      PLUS: 'DIAMOND Plus (1 Tahun)',
      PRO: 'DIAMOND Pro (1 Tahun)'
    };

    let price = planPrices[plan as keyof typeof planPrices];

    // Logika Upgrade (Prorated)
    const isExpired = user.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : true;

    if (user.planType && user.planType !== 'NONE' && !isExpired) {
      if (user.planType === 'BASIC' && plan === 'PLUS') {
        price = 10000;
      } else if (user.planType === 'BASIC' && plan === 'PRO') {
        price = 20000;
      } else if (user.planType === 'PLUS' && plan === 'PRO') {
        price = 10000;
      } else if (
        (user.planType === 'PRO') ||
        (user.planType === 'PLUS' && plan === 'BASIC') ||
        (user.planType === plan)
      ) {
        return NextResponse.json({ error: 'Paket ini sudah aktif atau Anda berada di paket yang lebih tinggi.' }, { status: 400 });
      }
    }

    const ppn = Math.round(price * 0.11);
    const grossAmount = price + ppn;

    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      item_details: [
        {
          id: `DIAMOND-${plan}`,
          price: price,
          quantity: 1,
          name: planNames[plan as keyof typeof planNames]
        },
        {
          id: 'PPN-11',
          price: ppn,
          quantity: 1,
          name: 'PPN 11%'
        }
      ]
    };

    const transaction = await snap.createTransaction(parameter);
    
    // Simpan ke DB status pending
    await prisma.paymentTransaction.create({
      data: {
        orderId,
        amount: grossAmount,
        status: 'pending',
        paymentUrl: transaction.redirect_url,
        planType: plan,
        userId: user.id
      }
    });

    return NextResponse.json({ token: transaction.token, redirect_url: transaction.redirect_url });
  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return NextResponse.json({ error: 'Gagal membuat transaksi: ' + error.message }, { status: 500 });
  }
}
