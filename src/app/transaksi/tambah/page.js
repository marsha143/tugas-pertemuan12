import FinancePage from '@/components/finance-pages';

export const metadata = { title: 'Tambah transaksi' };
export default function AddTransactionPage() { return <FinancePage page="transactions" startNew />; }
