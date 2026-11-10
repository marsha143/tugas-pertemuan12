import { Plus_Jakarta_Sans } from 'next/font/google';
import ThemeProvider from '@/components/theme-provider';
import './globals.css';

// 1. Inisialisasi font
const jakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
});

// 2. Metadata global website
export const metadata = {
    title: {
        default: 'Finora — Keuangan Lebih Jelas',
        template: '%s | Finora',
    },
    description: 'Kelola pemasukan, pengeluaran, dan kategori keuangan pribadi dengan Finora.',
    openGraph: {
        title: 'Finora — Keuangan Lebih Jelas',
        description: 'Kelola keuangan pribadimu dalam satu ruang yang jelas.',
        type: 'website',
    },
};

// 3. Root Layout
export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body className={jakartaSans.className} style={{ margin: 0 }}>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
