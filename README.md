# DIAMOND Finance AI 💎
**Aplikasi Pengelola Keuangan Pribadi Premium Berbasis Chat AI**

DIAMOND Finance AI adalah aplikasi asisten keuangan pribadi (Personal Finance Assistant) premium berbasis kecerdasan buatan (AI) yang dirancang untuk membantu pengguna mengelola, melacak, dan merencanakan keuangan sehari-hari dengan sangat mudah, praktis, dan cerdas. 

Aplikasi ini menggabungkan pencatatan keuangan modern dengan teknologi **Natural Language Processing (NLP)** melalui **Google Gemini AI**, sehingga Anda tidak hanya bisa mencatat secara manual, tetapi juga dapat berkonsultasi langsung dan memasukkan data keuangan hanya dengan mengetik kalimat percakapan biasa sehari-hari.

---

## 🚀 Fitur Utama

1. **Asisten Chat AI (NLP Transaction Input)**
   * Catat transaksi Anda secara instan menggunakan bahasa natural sehari-hari. Contoh: *"Gue beli kopi starbucks 45 ribu pakai kantong GoPay"* secara otomatis akan terdeteksi sebagai pengeluaran kategori **Makanan & Minuman** senilai **Rp45.000** menggunakan rekening **GoPay**.
2. **Dashboard Finansial Premium (Overview)**
   * Grafik visual interaktif yang melacak total pemasukan, pengeluaran, sisa saldo bersih, dan sebaran pengeluaran per kategori secara real-time.
3. **Multi-Rekening (Dompet Virtual)**
   * Mendukung pencatatan banyak rekening sekaligus (Cash/Tunai, Bank, E-Wallet) dengan pencatatan saldo terpisah dan mutasi transfer antar rekening.
4. **Anggaran Pintar & Notifikasi Peringatan (Smart Budgeting)**
   * Tetapkan batas pengeluaran bulanan per kategori. Aplikasi akan mengirimkan notifikasi otomatis secara real-time jika pengeluaran kategori tertentu telah mencapai **90% atau lebih** dari anggaran Anda.
5. **Manajemen Hutang & Piutang (Debts & Receivables) Terintegrasi**
   * Melacak catatan hutang Anda ke orang lain atau piutang orang lain ke Anda.
   * **Sinkronisasi Saldo Otomatis**: Saat mencatat hutang, saldo dompet otomatis bertambah. Saat melakukan cicilan atau pelunasan, saldo rekening yang dipilih otomatis terpotong dengan benar.
   * **Notifikasi Jatuh Tempo**: Pengingat otomatis H-3, peringatan tepat pada tanggal jatuh tempo, dan peringatan menunggak (overdue) secara dinamis.
6. **Tagihan & Layanan Berlangganan (Subscriptions)**
   * Kelola layanan berlangganan (Spotify, Netflix, tagihan listrik, dll) secara mingguan, bulanan, atau tahunan. Aplikasi akan memberikan notifikasi pengingat otomatis **H-3 sebelum jatuh tempo**.
7. **Target Menabung (Financial Goals)**
   * Tetapkan tujuan tabungan impian Anda (misalnya: beli laptop, liburan) lengkap dengan nominal target dan batas tanggal. Anda dapat menyisihkan dana secara berkala dari rekening pilihan Anda ke tabungan target ini.
8. **Rekap Laporan Berdasarkan Tanggal & Cetak PDF**
   * Filter riwayat keuangan berdasarkan tanggal tertentu secara responsif.
   * Ekspor data transaksi ke spreadsheet **CSV (Excel)**.
   * Cetak Laporan Keuangan formal atau simpan sebagai **PDF** secara utuh dan responsif (berjalan lancar di PC maupun HP).
9. **Konsultasi Finansial AI**
   * Chat assistant interaktif untuk berkonsultasi mengenai strategi menabung, analisis pengeluaran bulanan, dan tips finansial lainnya.

---

## 🛠️ Teknologi yang Digunakan

* **Framework**: [Next.js](https://nextjs.org/) (App Router & Server Actions)
* **Database**: PostgreSQL (Hosted on Supabase/Neon)
* **ORM**: [Prisma](https://www.prisma.io/)
* **Styling**: Tailwind CSS & Framer Motion
* **AI Model**: Google Gemini Pro (via `@google/genai` SDK)
* **Icons**: Lucide React

---

## 💻 Panduan Instalasi Lokal

### Prasyarat
* Node.js versi 18 atau lebih baru.
* Database PostgreSQL yang aktif (bisa menggunakan Supabase atau Neon gratis).
* API Key Gemini (dapatkan gratis di [Google AI Studio](https://aistudio.google.com/)).

### Langkah-Langkah

1. **Clone Repository**
   ```bash
   git clone https://github.com/amirhamzahd/Aplikasi-Keuangan-Pintar-dengan-Chat-AI.git
   cd Aplikasi-Keuangan-Pintar-dengan-Chat-AI
   ```

2. **Instalasi Dependensi**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   Buat file bernama `.env` pada direktori root proyek dan isi variabel berikut:
   ```env
   # Koneksi Database PostgreSQL Anda
   DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_db"
   
   # API Key dari Google AI Studio untuk Fitur AI Chat
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   ```

4. **Migrasi Database & Inisialisasi Prisma**
   Jalankan perintah berikut untuk mensinkronisasi schema database dengan PostgreSQL Anda:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Jalankan Aplikasi**
   Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
   Buka browser Anda di alamat [http://localhost:3000](http://localhost:3000) untuk mengakses aplikasi.

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah Lisensi MIT. Bebas digunakan untuk tujuan pembelajaran maupun pengembangan lebih lanjut.
