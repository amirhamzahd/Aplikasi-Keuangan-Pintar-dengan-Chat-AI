import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi!' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Email tidak terdaftar.' }, { status: 400 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    
    // Fallback for old SHA-256 passwords (just in case they existed before the wipe, not needed now but good practice)
    const crypto = require('crypto');
    const oldHashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const isOldPassword = user.password === oldHashedPassword;

    if (!passwordMatch && !isOldPassword) {
      return NextResponse.json({ error: 'Password salah.' }, { status: 400 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ 
        error: 'Akun Anda belum diverifikasi. Silakan periksa kotak masuk email Anda.',
        needsVerification: true 
      }, { status: 403 });
    }

    // Update password to bcrypt if it was using the old hash
    if (isOldPassword) {
      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(password, salt);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword }
      });
    }

    // Create session (JWT)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ id: user.id, email: user.email, name: user.name });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('aura_session', session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        isPremium: user.isPremium,
        planType: user.planType,
        planExpiredAt: user.planExpiredAt
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
