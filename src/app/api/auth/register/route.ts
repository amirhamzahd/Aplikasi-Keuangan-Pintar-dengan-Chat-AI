import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi!' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email ini sudah terdaftar!' }, { status: 400 });
    }

    // Simple hash for password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');

    // Save to database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        verificationToken: token,
        isVerified: false,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, token, user.name);
    } catch (emailError) {
      console.error("Gagal mengirim email:", emailError);
      return NextResponse.json({ error: 'Akun berhasil dibuat, namun gagal mengirim email verifikasi.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registrasi berhasil! Silakan periksa email Anda untuk verifikasi.' 
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
