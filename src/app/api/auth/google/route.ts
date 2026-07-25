import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { access_token } = await req.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Access token tidak ditemukan.' }, { status: 400 });
    }

    // 1. Dapatkan info user dari Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!googleRes.ok) {
      return NextResponse.json({ error: 'Gagal memverifikasi token Google.' }, { status: 401 });
    }

    const googleUser = await googleRes.json();
    const { email, name, picture } = googleUser;

    if (!email) {
      return NextResponse.json({ error: 'Email tidak ditemukan dari akun Google.' }, { status: 400 });
    }

    // 2. Cari user di DB kita
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Jika belum ada, buat otomatis
    if (!user) {
      // Buat password acak yang sangat kuat karena user ini menggunakan SSO
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          password: hashedPassword,
          isVerified: true, // Akun Google otomatis verified
        },
      });

      // Create default categories for new Google user
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
          userId: user!.id
        }))
      });
    }

    // 4. Jika user ada tapi belum verified (karena daftar manual sebelumnya), kita set verified otomatis
    if (user && !user.isVerified) {
      user = await prisma.user.update({
        where: { email },
        data: { isVerified: true },
      });
    }

    // 5. Buat JWT Session (sama seperti login biasa)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
    const session = await encrypt({ id: user.id, email: user.email, name: user.name });

    // 6. Set cookie
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
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        planType: user.planType,
        planExpiredAt: user.planExpiredAt
      }
    });

  } catch (error: any) {
    console.error('Google SSO error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat login Google.' }, { status: 500 });
  }
}
