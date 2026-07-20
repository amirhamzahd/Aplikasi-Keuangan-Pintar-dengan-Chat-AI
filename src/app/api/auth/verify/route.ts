import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json({ error: 'Token atau email tidak valid.' }, { status: 400 });
  }

  try {
    // 1. Cari pengguna hanya berdasarkan email (tanpa token dulu)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan di sistem.' }, { status: 400 });
    }

    // 2. Jika SUDAH terverifikasi (akibat React Strict Mode yang menembak API 2 kali)
    // Jangan munculkan error merah, melainkan anggap Sukses (Hijau).
    if (user.isVerified) {
      return NextResponse.json({ success: true, message: 'Akun Anda sudah terverifikasi sebelumnya.' });
    }

    // 3. Jika BELUM diverifikasi, barulah cocokkan tokennya
    if (user.verificationToken !== token) {
      return NextResponse.json({ error: 'Verifikasi gagal. Tautan tidak valid atau sudah kadaluarsa.' }, { status: 400 });
    }

    // 4. Update status ke verified dan hanguskan token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Verifikasi Berhasil silahkan login' });
  } catch (error) {
    console.error("Verify Error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memverifikasi email.' }, { status: 500 });
  }
}
