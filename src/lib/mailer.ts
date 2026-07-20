import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  const baseUrl = "https://project-4vdfh.vercel.app";
      
  const verifyUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: `"DIAMOND Finance" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Verifikasi Akun DIAMOND Finance Anda',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a; text-align: center;">Halo, ${name}! 👋</h2>
        <p style="color: #334155; font-size: 16px; text-align: center;">
          Terima kasih telah bergabung dengan <strong>DIAMOND Finance</strong>.
        </p>
        <p style="color: #334155; font-size: 16px; text-align: center;">
          Untuk mulai mengelola keuangan Anda, silakan verifikasi alamat email ini dengan mengeklik tombol di bawah:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Verifikasi Email Saya
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 40px;">
          Jika Anda tidak merasa mendaftar di DIAMOND Finance, abaikan email ini.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
