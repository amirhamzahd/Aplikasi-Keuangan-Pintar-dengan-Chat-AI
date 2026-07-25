import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const notification = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = notification;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    
    // Validasi Signature (Hanya jika bukan test notification)
    if (!order_id?.includes('payment_notif_test')) {
      const hash = crypto.createHash('sha512').update(order_id + status_code + gross_amount + serverKey).digest('hex');
      
      if (hash !== signature_key) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // Kalau ini adalah "Tes Notifikasi" dari tombol Midtrans, langsung kembalikan 200 OK
    if (order_id?.includes('payment_notif_test')) {
      console.log('Received Midtrans Test Notification');
      return NextResponse.json({ status: 'ok', message: 'Test notification received' }, { status: 200 });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { orderId: order_id }
    });

    if (!transaction) {
      // Return 200 instead of 404 so Midtrans doesn't keep retrying
      return NextResponse.json({ error: 'Order not found' }, { status: 200 });
    }

    if (transaction_status == 'capture' || transaction_status == 'settlement') {
      if (fraud_status == 'accept' || !fraud_status) {
        // Lunas
        await prisma.paymentTransaction.update({
          where: { orderId: order_id },
          data: { status: 'success' }
        });

        // Cek user untuk mempertahankan expiration date jika upgrade
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId }
        });
        const isExpired = user?.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : true;
        
        let premiumUntil = user?.planExpiredAt && !isExpired ? new Date(user.planExpiredAt) : new Date();
        
        // Jika belum ada plan, atau sudah expired, set ke +1 Tahun
        if (isExpired || !user?.planExpiredAt) {
          premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
        }

        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            isPremium: true,
            premiumUntil: premiumUntil,
            planType: transaction.planType,
            planExpiredAt: premiumUntil
          }
        });
      }
    } else if (transaction_status == 'cancel' || transaction_status == 'deny' || transaction_status == 'expire') {
      await prisma.paymentTransaction.update({
        where: { orderId: order_id },
        data: { status: 'failed' }
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
