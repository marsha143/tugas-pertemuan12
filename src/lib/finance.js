export const DEFAULT_CATEGORIES = [
  ...['Gaji', 'Freelance', 'Bonus', 'Investasi', 'Lainnya'].map((name) => ({ name, type: 'income' })),
  ...['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'].map((name) => ({ name, type: 'expense' })),
];

export async function initializeUserData(supabase, user) {
  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
  };
  const [{ error: profileError }, { error: categoryError }] = await Promise.all([
    supabase.from('profiles').upsert(profile, { onConflict: 'id', ignoreDuplicates: true }),
    supabase.from('categories').upsert(DEFAULT_CATEGORIES.map((category) => ({ ...category, user_id: user.id })), {
      onConflict: 'user_id,name,type',
      ignoreDuplicates: true,
    }),
  ]);
  return profileError || categoryError;
}

export async function fetchAllTransactions(supabase, userId, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('transactions')
      .select('id,type,amount,description,transaction_date,category_id,categories(id,name,color,icon)')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

