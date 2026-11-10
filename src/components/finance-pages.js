'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Check, CreditCard, Menu, Plus, Search, Settings2, Tags, Trash2, Wallet, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchAllTransactions, formatCurrency, initializeUserData } from '@/lib/finance';
import { Sidebar, ThemeButton } from '@/components/finora-shell';

const titles = { transactions: 'Transaksi', history: 'Riwayat', categories: 'Kategori', settings: 'Pengaturan' };
const mobileItems = [
  { label: 'Transaksi', href: '/transaksi', icon: CreditCard },
  { label: 'Riwayat', href: '/riwayat', icon: ChartNoAxesCombined },
  { label: 'Kategori', href: '/kategori', icon: Tags },
  { label: 'Pengaturan', href: '/pengaturan', icon: Settings2 },
];
const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const categoryPalette = ['#7663df', '#e39a54', '#39a981', '#5488d5', '#d76c83', '#44aab3', '#b07acb', '#879548'];

function HistoryReport({ transactions }) {
  const [period, setPeriod] = useState('all');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const periodTransactions = transactions.filter((transaction) => transaction.type === 'expense' && (period === 'all' || transaction.transaction_date?.startsWith(currentMonth)));
  const grouped = new Map();
  periodTransactions.forEach((transaction) => {
    const key = transaction.category_id || 'uncategorized';
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        name: transaction.categories?.name || 'Tanpa kategori',
        color: transaction.categories?.color,
        transactions: [],
        total: 0,
      });
    }
    const category = grouped.get(key);
    category.transactions.push(transaction);
    category.total += Number(transaction.amount);
  });
  const categories = [...grouped.values()].sort((a, b) => b.total - a.total);
  const total = categories.reduce((sum, category) => sum + category.total, 0);
  const colorCounts = new Map();
  categories.forEach((category) => {
    const color = category.color?.trim().toLowerCase();
    if (color) colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
  });
  const usedColors = new Set(categories
    .map((category) => category.color?.trim().toLowerCase())
    .filter((color) => color && color !== '#64748b' && colorCounts.get(color) === 1));
  categories.forEach((category, index) => {
    const savedColor = category.color?.trim().toLowerCase();
    if (savedColor && savedColor !== '#64748b' && colorCounts.get(savedColor) === 1) {
      category.color = savedColor;
      return;
    }
    let paletteIndex = index % categoryPalette.length;
    let attempts = 0;
    while (usedColors.has(categoryPalette[paletteIndex]) && attempts < categoryPalette.length) {
      paletteIndex = (paletteIndex + 1) % categoryPalette.length;
      attempts += 1;
    }
    if (attempts === categoryPalette.length) {
      let hue = (index * 137.508) % 360;
      let generatedColor = `hsl(${hue.toFixed(1)} 62% 51%)`;
      while (usedColors.has(generatedColor)) {
        hue = (hue + 137.508) % 360;
        generatedColor = `hsl(${hue.toFixed(1)} 62% 51%)`;
      }
      category.color = generatedColor;
    } else {
      category.color = categoryPalette[paletteIndex];
    }
    usedColors.add(category.color);
  });
  let cursor = 0;
  const gradient = categories.length ? categories.map((category, index) => {
    const start = cursor;
    const percentage = category.total / total * 100;
    cursor += percentage;
    return `${category.color} ${start}% ${cursor}%`;
  }).join(', ') : 'var(--line) 0% 100%';

  return <>
    <section className="panel history-overview">
      <div className="panel-heading"><div><h2>Pengeluaran berdasarkan kategori</h2><p>Proporsi pengeluaran dari transaksi yang tercatat</p></div><select className="select-button history-period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Semua waktu</option><option value="month">Bulan ini</option></select></div>
      {categories.length ? <div className="donut-layout"><div className="donut-chart" role="img" aria-label={`Diagram donat pengeluaran kategori, total ${formatCurrency(total)}`} style={{ background: `conic-gradient(${gradient})` }}><div className="donut-hole"><span>Total pengeluaran</span><strong>{formatCurrency(total)}</strong><small>{periodTransactions.length} transaksi</small></div></div><div className="donut-legend">{categories.map((category) => <div className="donut-legend-item" key={category.id}><i style={{ background: category.color }} /><span>{category.name}</span><strong>{((category.total / total) * 100).toFixed(1)}%</strong></div>)}</div></div> : <div className="module-empty"><ChartNoAxesCombined size={23} /><strong>Belum ada pengeluaran</strong><span>Diagram kategori akan muncul setelah ada transaksi pengeluaran.</span></div>}
    </section>

    <section className="panel category-breakdown-panel">
      <div className="panel-heading"><div><h2>Rincian pengeluaran</h2><p>Persentase dan transaksi di setiap kategori</p></div><span className="history-total-label">{categories.length} kategori · {formatCurrency(total)}</span></div>
      {categories.length ? <div className="category-breakdown-list">{categories.map((category) => {
        const percentage = total ? category.total / total * 100 : 0;
        return <details className="category-breakdown-item" key={category.id}>
          <summary><i className="breakdown-color" style={{ background: category.color }} /><span className="breakdown-name"><strong>{category.name}</strong><small>{category.transactions.length} transaksi</small></span><span className="breakdown-share">{percentage.toFixed(1)}%</span><strong className="breakdown-amount">{formatCurrency(category.total)}</strong><span className="breakdown-chevron">⌄</span></summary>
          <div className="breakdown-progress"><i style={{ width: `${percentage}%`, background: category.color }} /></div>
          <div className="breakdown-detail-list">{category.transactions.map((transaction) => <div className="breakdown-transaction" key={transaction.id}><span className="breakdown-transaction-title"><strong>{transaction.description || category.name}</strong><small>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${transaction.transaction_date}T00:00:00Z`))} · Pengeluaran</small></span><strong>−{formatCurrency(transaction.amount)}</strong></div>)}</div>
        </details>;
      })}</div> : <div className="breakdown-empty">Rincian pengeluaran belum tersedia.</div>}
    </section>
  </>;
}

export default function FinancePage({ page, startNew = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(startNew);
  const [form, setForm] = useState({ type: 'expense', amount: '', category_id: '', transaction_date: today(), description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense', color: '#64748b' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { user: activeUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!activeUser) {
        router.replace('/login');
        return;
      }
      setUser(activeUser);
      const initError = await initializeUserData(supabase, activeUser);
      const [categoryResult, transactionResult, profileResult] = await Promise.all([
        supabase.from('categories').select('id,name,type,color,icon').eq('user_id', activeUser.id).order('name'),
        fetchAllTransactions(supabase, activeUser.id),
        supabase.from('profiles').select('full_name,email').eq('id', activeUser.id).maybeSingle(),
      ]);
      const anyError = initError || categoryResult.error || transactionResult.error || profileResult.error;
      if (anyError) throw anyError;
      setCategories(categoryResult.data || []);
      setTransactions(transactionResult.data || []);
      setProfile({ full_name: profileResult.data?.full_name || activeUser.user_metadata?.full_name || '', email: profileResult.data?.email || activeUser.email || '' });
    } catch (loadError) {
      setError(loadError?.message || 'Data gagal dimuat. Periksa koneksi dan pengaturan Supabase, lalu coba lagi.');
      setCategories([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const expenseCategories = categories.filter((category) => category.type === 'expense');
  const incomeCategories = categories.filter((category) => category.type === 'income');

  function openTransaction(transaction = null) {
    setEditing(transaction);
    setForm(transaction ? {
      type: transaction.type,
      amount: String(transaction.amount),
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      description: transaction.description || '',
    } : { type: 'expense', amount: '', category_id: '', transaction_date: today(), description: '' });
    setError('');
    setModalOpen(true);
  }

  async function saveTransaction(event) {
    event.preventDefault();
    if (!user) return;
    setBusy(true); setError(''); setSuccess('');
    const supabase = createClient();
    const payload = { ...form, amount: Number(form.amount), user_id: user.id, description: form.description.trim() || null };
    const result = editing
      ? await supabase.from('transactions').update(payload).eq('id', editing.id).eq('user_id', user.id)
      : await supabase.from('transactions').insert(payload);
    if (result.error) setError(result.error.message);
    else { setModalOpen(false); setSuccess(editing ? 'Transaksi diperbarui.' : 'Transaksi berhasil ditambahkan.'); await load(); }
    setBusy(false);
  }

  async function deleteTransaction(transaction) {
    if (!window.confirm('Hapus transaksi ini?')) return;
    const { error: deleteError } = await createClient().from('transactions').delete().eq('id', transaction.id).eq('user_id', user.id);
    if (deleteError) setError(deleteError.message);
    else { setSuccess('Transaksi dihapus.'); await load(); }
  }

  async function saveCategory(event) {
    event.preventDefault();
    if (!user) return;
    setBusy(true); setError(''); setSuccess('');
    const { error: saveError } = await createClient().from('categories').insert({ ...categoryForm, name: categoryForm.name.trim(), user_id: user.id });
    if (saveError) setError(saveError.code === '23505' ? 'Kategori dengan nama dan jenis tersebut sudah ada.' : saveError.message);
    else { setCategoryForm({ ...categoryForm, name: '' }); setSuccess('Kategori ditambahkan.'); await load(); }
    setBusy(false);
  }

  async function renameCategory(category) {
    const name = window.prompt('Nama kategori', category.name)?.trim();
    if (!name || name === category.name) return;
    const { error: updateError } = await createClient().from('categories').update({ name }).eq('id', category.id).eq('user_id', user.id);
    if (updateError) setError(updateError.code === '23505' ? 'Kategori dengan nama dan jenis tersebut sudah ada.' : updateError.message);
    else { setSuccess('Kategori diperbarui.'); await load(); }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Hapus kategori “${category.name}”? Kategori yang masih dipakai transaksi tidak dapat dihapus.`)) return;
    const { error: deleteError } = await createClient().from('categories').delete().eq('id', category.id).eq('user_id', user.id);
    if (deleteError) setError(deleteError.message);
    else { setSuccess('Kategori dihapus.'); await load(); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true); setError(''); setSuccess('');
    const supabase = createClient();
    const [{ error: saveError }, { error: authUpdateError }] = await Promise.all([
      supabase.from('profiles').upsert({ id: user.id, email: profile.email, full_name: profile.full_name.trim() || null }, { onConflict: 'id' }),
      supabase.auth.updateUser({ data: { full_name: profile.full_name.trim() } }),
    ]);
    if (saveError || authUpdateError) setError((saveError || authUpdateError).message);
    else setSuccess('Profil diperbarui.');
    setBusy(false);
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = `${transaction.description || ''} ${transaction.categories?.name || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (typeFilter === 'all' || transaction.type === typeFilter) && (categoryFilter === 'all' || transaction.category_id === categoryFilter) && (!dateFilter || transaction.transaction_date === dateFilter);
  });
  const totalIncome = transactions.filter((transaction) => transaction.type === 'income').reduce((total, transaction) => total + Number(transaction.amount), 0);
  const totalExpense = transactions.filter((transaction) => transaction.type === 'expense').reduce((total, transaction) => total + Number(transaction.amount), 0);
  const remainingBalance = totalIncome - totalExpense;

  const heading = titles[page] || titles.transactions;

  return (
    <div className="app-frame">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Buka navigasi"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{heading}</strong></div>
          <div className="topbar-actions"><ThemeButton /><Link className="user-trigger" href="/pengaturan" aria-label="Buka pengaturan akun"><span className="avatar avatar-small">{(user?.email || 'F').slice(0, 1).toUpperCase()}</span></Link></div>
        </header>
        <div className="page-content module-content">
          <section className="welcome-row"><div><div className="eyebrow"><span className="live-dot" />RUANG KEUANGAN PRIBADI</div><h1>{heading}</h1><p className="page-subtitle">{page === 'settings' ? 'Kelola informasi akun dan preferensi aplikasi.' : `Kelola ${heading.toLowerCase()} keuanganmu dengan mudah.`}</p></div>
            {page === 'transactions' && <button className="primary-button" onClick={() => openTransaction()}><Plus size={17} />Tambah transaksi</button>}
          </section>
          {error && <div className="inline-alert alert-error" role="alert"><span>{error}</span><button className="retry-button" onClick={load}>Coba lagi</button><button onClick={() => setError('')} aria-label="Tutup pesan"><X size={16} /></button></div>}
          {success && <div className="inline-alert alert-success" role="status"><Check size={16} />{success}<button onClick={() => setSuccess('')} aria-label="Tutup pesan"><X size={16} /></button></div>}
          {loading ? <section className="panel module-loading">Memuat data akunmu…</section> : <>
            {page === 'transactions' ? <>
              <section className="stats-grid transaction-summary" aria-label="Ringkasan saldo">
                <article className="stat-card"><div className="stat-top"><span>Total pemasukan</span><span className="stat-icon tone-green"><ArrowDownLeft size={17} /></span></div><div className="stat-value">{loading ? '…' : error ? '—' : formatCurrency(totalIncome)}</div><div className="stat-foot">Akumulasi semua transaksi</div></article>
                <article className="stat-card"><div className="stat-top"><span>Total pengeluaran</span><span className="stat-icon tone-orange"><ArrowUpRight size={17} /></span></div><div className="stat-value">{loading ? '…' : error ? '—' : formatCurrency(totalExpense)}</div><div className="stat-foot">Langsung mengurangi saldo</div></article>
                <article className="stat-card"><div className="stat-top"><span>Sisa saldo</span><span className="stat-icon tone-violet"><Wallet size={17} /></span></div><div className="stat-value">{loading ? '…' : error ? '—' : formatCurrency(remainingBalance)}</div><div className="stat-foot">Pemasukan dikurangi pengeluaran</div></article>
              </section>
              <section className="panel filters-panel"><label className="filter-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul atau kategori" /></label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Semua kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><label className="date-filter"><CalendarDays size={15} /><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter tanggal" /></label><button className="subtle-button" onClick={() => { setSearch(''); setTypeFilter('all'); setCategoryFilter('all'); setDateFilter(''); }}>Reset</button></section>
              <section className="panel module-table"><div className="transaction-table-head"><span>TRANSAKSI</span><span>KATEGORI</span><span>TANGGAL</span><span>JUMLAH</span><span /></div>{filteredTransactions.length ? filteredTransactions.map((transaction) => <div className="transaction-row module-transaction-row" key={transaction.id}><span className={`transaction-type-icon ${transaction.type === 'income' ? 'income-mark' : 'expense-mark'}`}>{transaction.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span className="transaction-description"><strong>{transaction.description || transaction.categories?.name || 'Tanpa judul'}</strong><small>{transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</small></span><span className="category-pill">{transaction.categories?.name || 'Tanpa kategori'}</span><span className="transaction-date">{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${transaction.transaction_date}T00:00:00Z`))}</span><strong className={`transaction-amount ${transaction.type === 'income' ? 'amount-income' : ''}`}>{transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}</strong><span className="row-actions"><button onClick={() => openTransaction(transaction)}>Edit</button><button onClick={() => deleteTransaction(transaction)} aria-label="Hapus transaksi"><Trash2 size={15} /></button></span></div>) : <div className="module-empty"><Wallet size={23} /><strong>{transactions.length ? 'Tidak ada hasil yang cocok' : 'Belum ada transaksi'}</strong><span>{transactions.length ? 'Ubah filter atau kata pencarian.' : 'Mulai dengan menambahkan transaksi pertamamu.'}</span></div>}</section>
            </> : null}

            {page === 'history' && <HistoryReport transactions={transactions} />}

            {page === 'categories' && <div className="module-two-col"><section className="panel form-panel"><h2>Tambah kategori</h2><p>Buat kategori pemasukan atau pengeluaran milikmu.</p><form className="stack-form" onSubmit={saveCategory}><label>Nama kategori<input required maxLength={40} value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Contoh: Hadiah" /></label><label>Jenis<select value={categoryForm.type} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value })}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label><label>Warna kategori<input type="color" value={categoryForm.color} onChange={(event) => setCategoryForm({ ...categoryForm, color: event.target.value })} /></label><button className="primary-button" disabled={busy}><Plus size={16} />Simpan kategori</button></form></section><section className="panel category-manager"><h2>Kategorimu <span>{categories.length}</span></h2>{['income', 'expense'].map((type) => <div className="category-group" key={type}><h3>{type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</h3>{categories.filter((category) => category.type === type).map((category) => <div className="managed-category" key={category.id}><i style={{ background: category.color }} /><span>{category.name}</span><button onClick={() => renameCategory(category)}>Ubah</button><button onClick={() => deleteCategory(category)} aria-label={`Hapus ${category.name}`}><Trash2 size={15} /></button></div>)}</div>)}</section></div>}


            {page === 'settings' && <div className="settings-grid"><section className="panel form-panel"><h2>Profil akun</h2><p>Informasi dasar yang tersimpan di akun Finora.</p><form className="stack-form" onSubmit={saveProfile}><label>Nama lengkap<input value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} placeholder="Nama kamu" /></label><label>Email<input value={profile.email} readOnly type="email" /></label><button className="primary-button" disabled={busy}>Simpan perubahan</button></form></section><section className="panel settings-card"><h2>Tampilan</h2><p>Pilih tema yang nyaman digunakan.</p><div className="setting-row"><span><Settings2 size={17} />Tema aplikasi</span><ThemeButton /></div></section><section className="panel settings-card"><h2>Akun</h2><p>Keluar dari sesi Finora pada perangkat ini.</p><button className="danger-button" onClick={async () => { await createClient().auth.signOut(); router.replace('/login'); }}>Keluar dari akun</button></section></div>}
          </>}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">
        {mobileItems.slice(0, 2).map(({ label, href, icon: Icon }) => <Link className={`mobile-nav-item ${pathname === href ? 'mobile-nav-active' : ''}`} href={href} key={href}><Icon size={19} strokeWidth={1.9} /><span>{label}</span></Link>)}
        <button className="mobile-nav-add" onClick={() => openTransaction()} aria-label="Tambah transaksi"><span><Plus size={24} strokeWidth={2.5} /></span><small>Tambah</small></button>
        {mobileItems.slice(2).map(({ label, href, icon: Icon }) => <Link className={`mobile-nav-item ${pathname === href ? 'mobile-nav-active' : ''}`} href={href} key={href}><Icon size={19} strokeWidth={1.9} /><span>{label}</span></Link>)}
      </nav>

      {modalOpen && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title"><div className="modal-heading"><div><h2 id="transaction-form-title">{editing ? 'Edit transaksi' : 'Tambah transaksi'}</h2><p>Catat pemasukan atau pengeluaranmu.</p></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Tutup"><X size={18} /></button></div><form className="stack-form" onSubmit={saveTransaction}><label>Jenis transaksi<select value={form.type} onChange={(event) => { const nextType = event.target.value; setForm({ ...form, type: nextType, category_id: '' }); }}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label><label>Judul transaksi<input autoFocus type="text" maxLength={160} required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Contoh: Makan siang" /></label><label>Nominal (Rp)<input type="number" min="1" step="0.01" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0" /></label><label>Kategori<select required value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}><option value="">Pilih kategori</option>{(form.type === 'income' ? incomeCategories : expenseCategories).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Tanggal<input type="date" required value={form.transaction_date} onChange={(event) => setForm({ ...form, transaction_date: event.target.value })} /></label>{error && <p className="form-message form-error">{error}</p>}<div className="modal-actions"><button type="button" className="subtle-button" onClick={() => setModalOpen(false)}>Batal</button><button className="primary-button" disabled={busy}>{busy ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Simpan transaksi'}</button></div></form></section></div>}
    </div>
  );
}
