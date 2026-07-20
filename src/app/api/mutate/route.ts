import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, entity, action, data, id } = body;

    if (!email || !entity || !action) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User tidak valid' }, { status: 403 });

    let result;
    const model = (prisma as any)[entity]; // e.g., prisma.transaction

    if (!model) {
      return NextResponse.json({ error: 'Entitas tidak ditemukan' }, { status: 400 });
    }

    // --- MANIPULASI DATA SEBELUM DISIMPAN ---
    let payload = { ...data };

    if (entity === 'user') {
      if (payload.monthlyCutoffDate !== undefined) {
        payload.monthlyCutoffDate = parseInt(payload.monthlyCutoffDate, 10);
      }
      if (payload.currentPeriodStart !== undefined) {
        payload.currentPeriodStart = payload.currentPeriodStart ? new Date(payload.currentPeriodStart) : null;
      }
      if (payload.currentPeriodEnd !== undefined) {
        payload.currentPeriodEnd = payload.currentPeriodEnd ? new Date(payload.currentPeriodEnd) : null;
      }
    }

    // 1. Fix untuk AI Chat: Jika ada tags berbentuk Array, jadikan JSON String
    if (entity === 'transaction' && payload.tags && Array.isArray(payload.tags)) {
      payload.tags = JSON.stringify(payload.tags);
    }

    if (entity === 'transaction' && payload.date) {
      payload.date = new Date(payload.date);
    }

    // 2. Fix untuk Format Tanggal MySQL dan Schema Mapping
    if (entity === 'subscription') {
      if (payload.billingCycle) {
        payload.cycle = payload.billingCycle;
        delete payload.billingCycle;
      }
      if (payload.nextBilling) {
        payload.nextPayment = new Date(payload.nextBilling);
        delete payload.nextBilling;
      }
      if (!payload.startDate) {
        payload.startDate = new Date();
      }
    }

    if (entity === 'debt') {
      if (payload.person) {
        payload.name = payload.person;
        delete payload.person;
      }
      if (payload.dueDate) {
        payload.dueDate = new Date(payload.dueDate);
      } else {
        payload.dueDate = new Date();
      }
      if (payload.type === 'debt' || payload.type === 'receivable') {
        payload.type = payload.type === 'debt' ? 'take' : 'give';
      }
      if (typeof payload.remaining === 'undefined') {
        payload.remaining = payload.amount;
      }
      if (!payload.status || payload.status === 'pending') {
        payload.status = 'active';
      }
    }

    if (entity === 'goal' && payload.targetDate) {
      payload.targetDate = new Date(payload.targetDate);
    }

    // --- FUNGSI BANTUAN KALKULASI SALDO ---
    const applyBalanceChange = async (tx: any, isRevert = false) => {
      const multiplier = isRevert ? -1 : 1;
      
      if (tx.type === 'income') {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: { balance: { increment: tx.amount * multiplier } }
        });
      } else if (tx.type === 'expense') {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: { balance: { decrement: tx.amount * multiplier } }
        });
      } else if (tx.type === 'transfer' && tx.toAccountId) {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: { balance: { decrement: tx.amount * multiplier } }
        });
        await prisma.account.update({
          where: { id: tx.toAccountId },
          data: { balance: { increment: tx.amount * multiplier } }
        });
      }
    };

    const applyDebtBalanceChange = async (debt: any, actionType: 'CREATE' | 'PAY' | 'UNPAY' | 'DELETE_PENDING', customAmount?: number) => {
      if (!debt.accountId) return;
      
      const amt = customAmount !== undefined ? customAmount : debt.amount;
      let incrementValue = 0;
      
      if (debt.type === 'give' || debt.type === 'receivable') { // Piutang (We lend money)
        if (actionType === 'CREATE') incrementValue = -amt;
        if (actionType === 'PAY') incrementValue = amt;
        if (actionType === 'UNPAY') incrementValue = -amt;
        if (actionType === 'DELETE_PENDING') incrementValue = amt;
      } else if (debt.type === 'take' || debt.type === 'debt') { // Hutang (We borrow money)
        if (actionType === 'CREATE') incrementValue = amt;
        if (actionType === 'PAY') incrementValue = -amt;
        if (actionType === 'UNPAY') incrementValue = amt;
        if (actionType === 'DELETE_PENDING') incrementValue = -amt;
      }

      if (incrementValue !== 0) {
        await prisma.account.update({
          where: { id: debt.accountId },
          data: { balance: { increment: incrementValue } }
        });
      }
    };

    // --- EKSEKUSI AKSI ---
    if (action === 'RESET_DATA') {
      await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { userId: user.id } }),
        prisma.account.deleteMany({ where: { userId: user.id } }),
        prisma.budget.deleteMany({ where: { userId: user.id } }),
        prisma.debt.deleteMany({ where: { userId: user.id } }),
        prisma.goal.deleteMany({ where: { userId: user.id } }),
        prisma.subscription.deleteMany({ where: { userId: user.id } }),
        prisma.category.deleteMany({ where: { userId: user.id } }),
      ]);
      return NextResponse.json({ success: true, message: 'Data berhasil direset' });
    }
    
    if (action === 'CREATE') {
      result = await model.create({
        data: {
          ...payload,
          userId: user.id,
        }
      });
      
      // Jika yang dibuat adalah transaksi, hitung saldonya!
      if (entity === 'transaction') {
        await applyBalanceChange(result, false);
      }
      if (entity === 'debt') {
        await applyDebtBalanceChange(result, 'CREATE');
      }
      
    } else if (action === 'UPDATE') {
      if (!id) return NextResponse.json({ error: 'ID wajib untuk update' }, { status: 400 });

      // Jika update transaksi, kita harus mengembalikan saldo lama dulu, baru menerapkan saldo baru
      if (entity === 'transaction') {
        const oldTx = await model.findUnique({ where: { id } });
        if (oldTx) {
          await applyBalanceChange(oldTx, true); // Revert saldo lama
        }
      }

      // Khusus Update Debt
      let oldDebt = null;
      if (entity === 'debt') {
        oldDebt = await model.findUnique({ where: { id } });
      }

      result = await model.update({
        where: { id },
        data: payload
      });

      if (entity === 'transaction') {
        await applyBalanceChange(result, false); // Terapkan saldo baru
      }
      
      if (entity === 'debt' && oldDebt) {
        const diff = oldDebt.amount - result.amount;
        
        // Handle amount change (e.g. partial payment or manual edit)
        if (diff !== 0) {
          if (diff > 0) {
            await applyDebtBalanceChange(result, 'PAY', diff);
          } else {
            await applyDebtBalanceChange(result, 'CREATE', -diff);
          }
        }

        // Handle full status toggle (without amount change)
        if (oldDebt.status === 'active' && result.status === 'paid' && diff === 0) {
          await applyDebtBalanceChange(result, 'PAY', result.amount);
        } else if (oldDebt.status === 'paid' && result.status === 'active' && diff === 0) {
          await applyDebtBalanceChange(result, 'UNPAY', result.amount);
        }
      }

    } else if (action === 'DELETE') {
      if (!id) return NextResponse.json({ error: 'ID wajib untuk delete' }, { status: 400 });
      
      // Jika hapus transaksi, kembalikan saldonya
      if (entity === 'transaction') {
        const oldTx = await model.findUnique({ where: { id } });
        if (oldTx) {
          await applyBalanceChange(oldTx, true); // Revert saldo yang pernah terpotong/bertambah
        }
      }
      
      let oldDebt = null;
      if (entity === 'debt') {
        oldDebt = await model.findUnique({ where: { id } });
      }

      result = await model.delete({
        where: { id }
      });
      
      if (entity === 'debt' && oldDebt) {
        if (oldDebt.status === 'active') {
          await applyDebtBalanceChange(oldDebt, 'DELETE_PENDING');
        }
      }
    } else {
      return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Mutate Error:", error);
    return NextResponse.json({ error: 'Gagal melakukan operasi database' }, { status: 500 });
  }
}
