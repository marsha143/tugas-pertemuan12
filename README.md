# Finora

Aplikasi pencatatan keuangan pribadi berbasis Next.js 16 dan Supabase. Pengguna dapat mencatat pemasukan dan pengeluaran, mengelola kategori, dan melihat ringkasan keuangan.

## Menjalankan aplikasi

Pastikan `.env.local` berisi URL Supabase dan publishable key yang sudah digunakan proyek ini. Jangan pernah menaruh service role key di browser.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Pengguna baru dapat membuat akun melalui halaman Daftar. Jika konfirmasi email Supabase aktif, buka tautan konfirmasi yang dikirim melalui email.

## Database

Aplikasi menggunakan tabel `profiles`, `categories`, dan `transactions` beserta kolom dan Row Level Security yang sudah tersedia pada proyek Supabase. Tabel lain yang sudah ada, termasuk `budgets`, tidak diubah. Aplikasi tidak menjalankan migrasi database. Pada login pertama, profil dan kategori bawaan diinisialisasi secara idempoten menggunakan batas unik `categories(user_id, name, type)`.

RLS tetap menjadi batas keamanan utama. Query aplikasi juga menyertakan `user_id` pada pengambilan dan perubahan data. Jangan menonaktifkan policy yang membatasi data ke `auth.uid()`.

## Modul

- Transaksi dengan ringkasan total pemasukan, total pengeluaran, sisa saldo, tambah, edit, hapus, pencarian, dan filter.
- Riwayat dengan diagram donat pengeluaran per kategori, persentase, dan rincian transaksi.
- Kategori pemasukan dan pengeluaran.
- Daftar seluruh transaksi dan pengaturan profil serta tema.
- Tema terang dan gelap, navigasi desktop dan mobile.
