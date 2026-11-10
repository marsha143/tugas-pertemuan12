'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const supabase = createClient();

    if (isRegister) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/transaksi` },
      });
      if (signUpError) setError(signUpError.message);
      else if (data.session) router.replace('/transaksi');
      else setMessage('Pendaftaran berhasil. Periksa email untuk mengonfirmasi akun sebelum masuk.');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) setError(signInError.message);
      else router.replace(searchParams.get('next') || '/transaksi');
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <main className="auth-page">
      <Link className="auth-back" href="/"><ArrowLeft size={16} /> Kembali ke Finora</Link>
      <section className="auth-card">
        <Link className="brand auth-brand" href="/"><span className="brand-mark"><Wallet size={19} /></span><span>finora<span className="brand-dot">.</span></span></Link>
        <div className="auth-heading"><span className="eyebrow">RUANG KEUANGAN PRIBADI</span><h1>{isRegister ? 'Mulai kelola keuanganmu' : 'Senang melihatmu lagi'}</h1><p>{isRegister ? 'Buat akun untuk menyimpan dan memahami transaksi keuanganmu.' : 'Masuk ke akun Finora untuk melihat ringkasan keuanganmu.'}</p></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && <label>Nama lengkap<input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} placeholder="Nama kamu" /></label>}
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nama@email.com" /></label>
          <label>Kata sandi<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="Minimal 6 karakter" /></label>
          {error && <p className="form-message form-error" role="alert">{error}</p>}
          {message && <p className="form-message form-success" role="status">{message}</p>}
          <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Memproses…' : isRegister ? 'Buat akun' : 'Masuk'}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} <Link href={isRegister ? '/login' : '/register'}>{isRegister ? 'Masuk' : 'Daftar gratis'}</Link></p>
        <p className="auth-privacy">Data akun dan transaksi hanya dapat diakses oleh pemiliknya.</p>
      </section>
    </main>
  );
}
