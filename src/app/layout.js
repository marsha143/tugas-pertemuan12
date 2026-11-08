import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// 1. Inisialisasi font
const jakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
});

// 2. Metadata global website
export const metadata = {
    title: {
        default: 'BookStore - Toko Buku Online',
        template: '%s | BookStore',
    },
    description: 'Temukan berbagai buku menarik dan favoritmu hanya di BookStore.',
    openGraph: {
        title: 'BookStore - Toko Buku Online',
        description: 'Temukan berbagai buku menarik dan favoritmu hanya di BookStore.',
        type: 'website',
    },
};

// 3. Root Layout
export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body
                className={jakartaSans.className}
                style={{ margin: 0 }}
            >
                {children}
            </body>
        </html>
    );
}
