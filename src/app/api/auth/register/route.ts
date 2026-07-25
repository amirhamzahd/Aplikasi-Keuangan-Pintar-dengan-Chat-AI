import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mailer';
import bcrypt from 'bcryptjs';
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

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
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

    // Create default categories for new user
    const defaultCategories = [
      { name: 'Makanan & Minuman', type: 'expense', icon: 'pizza', color: '#ff6b6b' },
      { name: 'Transportasi', type: 'expense', icon: 'car', color: '#4dabf7' },
      { name: 'Belanja', type: 'expense', icon: 'shopping-cart', color: '#fcc419' },
      { name: 'Tagihan & Utilitas', type: 'expense', icon: 'zap', color: '#fa5252' },
      { name: 'Hiburan', type: 'expense', icon: 'film', color: '#be4bdb' },
      { name: 'Pekerjaan', type: 'expense', icon: 'briefcase', color: '#4c6ef5' },
      { name: 'Kesehatan', type: 'expense', icon: 'heart', color: '#e64980' },
      { name: 'Pendidikan', type: 'expense', icon: 'book', color: '#fd7e14' },
      { name: 'Gaji', type: 'income', icon: 'wallet', color: '#51cf66' },
      { name: 'Investasi', type: 'income', icon: 'trending-up', color: '#20c997' },
      { name: 'Lainnya', type: 'expense', icon: 'more-horizontal', color: '#868e96' }
    ];

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: user.id
      }))
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
