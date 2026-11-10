'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ChartNoAxesCombined, CircleHelp, CreditCard, LogOut, Moon, Settings2, Sun, Tags, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navigation = [
  { label: 'Transaksi', href: '/transaksi', icon: CreditCard },
  { label: 'Riwayat', href: '/riwayat', icon: ChartNoAxesCombined },
  { label: 'Kategori', href: '/kategori', icon: Tags },
];

export function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';
  return <button className="icon-button theme-button" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={`Aktifkan ${dark ? 'light' : 'dark'} mode`}>
    {dark ? <Sun size={18} /> : <Moon size={18} />}
  </button>;
}

export function Sidebar({ open, onClose, user }) {
  const router = useRouter();
  const pathname = usePathname();
  return <>
    {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Tutup navigasi" />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <Link className="brand" href="/transaksi" onClick={onClose}><span className="brand-mark"><Wallet size={19} strokeWidth={2.5} /></span><span>finora<span className="brand-dot">.</span></span></Link>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Navigasi utama">{navigation.map(({ label, href, icon: Icon }) => <Link key={label} href={href} onClick={onClose} className={`nav-item ${pathname === href || pathname.startsWith(`${href}/`) ? 'nav-active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-bottom">
        <Link className="nav-item" href="/pengaturan" onClick={onClose}><Settings2 size={18} /><span>Pengaturan</span></Link>
        <button className="nav-item help-link"><CircleHelp size={18} /><span>Pusat bantuan</span></button>
        <div className="sidebar-divider" />
        <div className="account-row"><div className="avatar">{(user?.user_metadata?.full_name || user?.email || 'F').slice(0, 1).toUpperCase()}</div><div className="account-copy"><strong>{user?.user_metadata?.full_name || 'Akun Finora'}</strong><span>{user?.email || 'Memuat akun…'}</span></div><button className="account-menu" aria-label="Keluar" onClick={async () => { await createClient().auth.signOut(); router.replace('/login'); }}><LogOut size={16} /></button></div>
      </div>
    </aside>
  </>;
}
