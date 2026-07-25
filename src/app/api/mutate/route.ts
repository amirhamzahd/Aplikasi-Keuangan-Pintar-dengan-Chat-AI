import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.id;

    // Server-side check for Read-Only mode
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isExpired = user.planExpiredAt ? new Date(user.planExpiredAt) < new Date() : false;
    if (user.planType === 'NONE' || isExpired) {
      return NextResponse.json({ error: 'Akun dalam mode Read-Only. Harap perpanjang langganan Anda.' }, { status: 403 });
    }

    const body = await req.json();
    const { entity, action, data, id } = body;

    let result;

    switch (entity) {
      case 'user':
        if (action === 'UPDATE') {
          result = await prisma.user.update({ where: { id: userId }, data });
        } else if (action === 'RESET_DATA') {
          // Careful with this in production!
          await prisma.$transaction([
            prisma.transaction.deleteMany({ where: { userId } }),
            prisma.account.deleteMany({ where: { userId } }),
            prisma.budget.deleteMany({ where: { userId } }),
            prisma.goal.deleteMany({ where: { userId } }),
            prisma.subscription.deleteMany({ where: { userId } }),
            prisma.debt.deleteMany({ where: { userId } })
          ]);
          result = { success: true };
        }
        break;

      case 'transaction':
        if (action === 'CREATE') {
          let categoryId = data.categoryId;
          if (!categoryId && data.category) {
            const cat = await prisma.category.findFirst({ where: { userId, name: data.category } });
            if (cat) categoryId = cat.id;
            else {
               const fallbackCat = await prisma.category.findFirst({ where: { userId } });
               if (fallbackCat) categoryId = fallbackCat.id;
               else {
                   const newCat = await prisma.category.create({
                       data: { name: 'Lainnya', type: data.type || 'expense', icon: 'list', color: '#ccc', userId }
                   });
                   categoryId = newCat.id;
               }
            }
          }
          
          const cleanData = { ...data, categoryId, tags: Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || '') };
          delete cleanData.category;
          
          const queries = [];
          queries.push(prisma.transaction.create({ data: { ...cleanData, userId } }));
          
          if (cleanData.type === 'expense') {
            queries.push(prisma.account.update({ where: { id: cleanData.accountId, userId }, data: { balance: { decrement: cleanData.amount } } }));
          } else if (cleanData.type === 'income') {
            queries.push(prisma.account.update({ where: { id: cleanData.accountId, userId }, data: { balance: { increment: cleanData.amount } } }));
          } else if (cleanData.type === 'transfer' && cleanData.toAccountId) {
            queries.push(prisma.account.update({ where: { id: cleanData.accountId, userId }, data: { balance: { decrement: cleanData.amount } } }));
            queries.push(prisma.account.update({ where: { id: cleanData.toAccountId, userId }, data: { balance: { increment: cleanData.amount } } }));
          }
          
          const results = await prisma.$transaction(queries);
          result = results[0];
          
        } else if (action === 'UPDATE') {
          const cleanData = { ...data };
          if (cleanData.tags && Array.isArray(cleanData.tags)) cleanData.tags = cleanData.tags.join(',');
          if (cleanData.category && !cleanData.categoryId) {
            const cat = await prisma.category.findFirst({ where: { userId, name: cleanData.category } });
            if (cat) cleanData.categoryId = cat.id;
            delete cleanData.category;
          }
          
          const oldTx = await prisma.transaction.findUnique({ where: { id, userId } });
          if (!oldTx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
          
          const queries = [];
          
          // 1. Reverse old transaction effect
          if (oldTx.type === 'expense') {
             queries.push(prisma.account.update({ where: { id: oldTx.accountId, userId }, data: { balance: { increment: oldTx.amount } } }));
          } else if (oldTx.type === 'income') {
             queries.push(prisma.account.update({ where: { id: oldTx.accountId, userId }, data: { balance: { decrement: oldTx.amount } } }));
          } else if (oldTx.type === 'transfer' && oldTx.toAccountId) {
             queries.push(prisma.account.update({ where: { id: oldTx.accountId, userId }, data: { balance: { increment: oldTx.amount } } }));
             queries.push(prisma.account.update({ where: { id: oldTx.toAccountId, userId }, data: { balance: { decrement: oldTx.amount } } }));
          }
          
          // 2. Apply new transaction effect
          const newType = cleanData.type || oldTx.type;
          const newAmount = cleanData.amount !== undefined ? cleanData.amount : oldTx.amount;
          const newAccountId = cleanData.accountId || oldTx.accountId;
          const newToAccountId = cleanData.toAccountId !== undefined ? cleanData.toAccountId : oldTx.toAccountId;
          
          if (newType === 'expense') {
             queries.push(prisma.account.update({ where: { id: newAccountId, userId }, data: { balance: { decrement: newAmount } } }));
          } else if (newType === 'income') {
             queries.push(prisma.account.update({ where: { id: newAccountId, userId }, data: { balance: { increment: newAmount } } }));
          } else if (newType === 'transfer' && newToAccountId) {
             queries.push(prisma.account.update({ where: { id: newAccountId, userId }, data: { balance: { decrement: newAmount } } }));
             queries.push(prisma.account.update({ where: { id: newToAccountId, userId }, data: { balance: { increment: newAmount } } }));
          }
          
          queries.push(prisma.transaction.update({ where: { id, userId }, data: cleanData }));
          
          const results = await prisma.$transaction(queries);
          result = results[results.length - 1];
          
        } else if (action === 'DELETE') {
          const oldTx = await prisma.transaction.findUnique({ where: { id, userId } });
          if (!oldTx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
          
          const queries = [];
          
          if (oldTx.type === 'expense') {
             queries.push(prisma.account.update({ where: { id: oldTx.accountId, userId }, data: { balance: { increment: oldTx.amount } } }));
          } else if (oldTx.type === 'income') {
             queries.push(prisma.account.update({ where: { id: oldTx.accountId, userId }, data: { balance: { decrement: oldTx.amount } } }));
          } else if (oldTx.type === 'transfer' && oldTx.toAccountId) {
             queries.push(prisma.account.update({ where: { id: oldTx.accountId, userId }, data: { balance: { increment: oldTx.amount } } }));
             queries.push(prisma.account.update({ where: { id: oldTx.toAccountId, userId }, data: { balance: { decrement: oldTx.amount } } }));
          }
          
          queries.push(prisma.transaction.delete({ where: { id, userId } }));
          
          const results = await prisma.$transaction(queries);
          result = results[results.length - 1];
        }
        break;

      case 'account':
        if (action === 'CREATE') result = await prisma.account.create({ data: { ...data, userId } });
        else if (action === 'UPDATE') result = await prisma.account.update({ where: { id, userId }, data });
        else if (action === 'DELETE') result = await prisma.account.delete({ where: { id, userId } });
        break;

      case 'budget':
        if (action === 'CREATE') {
           let categoryId = data.categoryId;
           if (!categoryId && data.category) {
               const cat = await prisma.category.findFirst({ where: { userId, name: data.category } });
               if (cat) categoryId = cat.id;
           }
           if (!categoryId) return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 });
           
           result = await prisma.budget.create({ data: { categoryId, amount: data.amount, userId } });
        }
        else if (action === 'UPDATE') result = await prisma.budget.update({ where: { id, userId }, data });
        else if (action === 'DELETE') result = await prisma.budget.delete({ where: { id, userId } });
        break;

      case 'goal':
        if (action === 'CREATE') result = await prisma.goal.create({ data: { ...data, userId } });
        else if (action === 'UPDATE') result = await prisma.goal.update({ where: { id, userId }, data });
        else if (action === 'DELETE') result = await prisma.goal.delete({ where: { id, userId } });
        break;

      case 'subscription':
        if (action === 'CREATE') {
          result = await prisma.subscription.create({ data: {
            name: data.name,
            amount: data.amount,
            cycle: data.billingCycle || data.cycle,
            category: data.category || 'Uncategorized',
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            nextPayment: data.nextBilling ? new Date(data.nextBilling) : (data.nextPayment ? new Date(data.nextPayment) : new Date()),
            isActive: data.isActive !== undefined ? data.isActive : true,
            accountId: data.accountId || null,
            userId
          }});
        } else if (action === 'UPDATE') {
          const updateData: any = { ...data };
          if (data.billingCycle) updateData.cycle = data.billingCycle;
          if (data.nextBilling) updateData.nextPayment = new Date(data.nextBilling);
          if (data.startDate) updateData.startDate = new Date(data.startDate);
          
          delete updateData.billingCycle;
          delete updateData.nextBilling;
          
          result = await prisma.subscription.update({ where: { id, userId }, data: updateData });
        } else if (action === 'DELETE') {
          result = await prisma.subscription.delete({ where: { id, userId } });
        }
        break;

      case 'debt':
        if (action === 'CREATE') {
          result = await prisma.debt.create({ data: {
            name: data.person || data.name,
            type: data.type === 'debt' ? 'take' : (data.type === 'receivable' ? 'give' : data.type),
            amount: data.amount,
            remaining: data.remaining !== undefined ? data.remaining : data.amount,
            dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
            status: data.status === 'pending' ? 'active' : (data.status || 'active'),
            accountId: data.accountId || null,
            userId
          }});
        } else if (action === 'UPDATE') {
          const updateData: any = { ...data };
          if (data.person) updateData.name = data.person;
          if (data.type) updateData.type = data.type === 'debt' ? 'take' : (data.type === 'receivable' ? 'give' : data.type);
          if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
          if (data.status === 'paid') updateData.status = 'paid';
          if (data.status === 'pending') updateData.status = 'active';
          
          delete updateData.person;
          
          result = await prisma.debt.update({ where: { id, userId }, data: updateData });
        } else if (action === 'DELETE') {
          result = await prisma.debt.delete({ where: { id, userId } });
        }
        break;

      case 'category':
        if (action === 'CREATE') result = await prisma.category.create({ data: { ...data, userId } });
        else if (action === 'UPDATE') result = await prisma.category.update({ where: { id, userId }, data });
        else if (action === 'DELETE') result = await prisma.category.delete({ where: { id, userId } });
        break;

      default:
        return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Mutate Error:", error);
    return NextResponse.json({ error: 'Gagal melakukan mutasi data' }, { status: 500 });
  }
}
