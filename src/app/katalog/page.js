import Image from 'next/image';
import Link from 'next/link';
import { getDaftarBuku, getCoverUrl } from '@/lib/openLibrary';

export const metadata = {
    title: 'Katalog Buku',
    description: 'Jelajahi berbagai koleksi buku di BookStore.',
};

export default async function HalamanKatalog() {
    // 1. Mengambil data buku dari Open Library API
    const daftarBuku = await getDaftarBuku();

    return (
        <main style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 24px',
        }}>
            {/* 2. Header katalog */}
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '32px',
                    marginBottom: '8px',
                }}>
                    Katalog Buku
                </h1>

                <p style={{ color: '#64748b' }}>
                    Temukan buku menarik untuk menambah pengetahuanmu.
                </p>
            </header>

            {/* 3. Menampilkan daftar buku */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '24px',
            }}>
                {daftarBuku.map((buku) => {
                    const id = buku.key.split('/').pop();
                    const coverUrl = getCoverUrl(buku.cover_i);

                    return (
                        <article
                            key={buku.key}
                            style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '16px',
                                backgroundColor: '#ffffff',
                            }}
                        >
                            {/* 4. Optimasi gambar menggunakan Next Image */}
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '230px',
                                marginBottom: '16px',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}>
                                {coverUrl ? (
                                    <Image
                                        src={coverUrl}
                                        alt={`Sampul buku ${buku.title}`}
                                        fill
                                        sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 200px"
                                        style={{ objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div style={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                        fontSize: '14px',
                                    }}>
                                        Sampul tidak tersedia
                                    </div>
                                )}
                            </div>

                            {/* 5. Informasi buku */}
                            <h2 style={{
                                fontSize: '16px',
                                marginBottom: '8px',
                            }}>
                                {buku.title}
                            </h2>

                            <p style={{
                                fontSize: '13px',
                                color: '#64748b',
                                marginBottom: '8px',
                            }}>
                                {buku.author_name?.[0] || 'Penulis tidak diketahui'}
                            </p>

                            <p style={{
                                fontSize: '12px',
                                color: '#94a3b8',
                                marginBottom: '16px',
                            }}>
                                Tahun terbit: {buku.first_publish_year || '-'}
                            </p>

                            {/* 6. Navigasi ke halaman detail */}
                            <Link
                                href={`/katalog/${id}`}
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    padding: '10px',
                                    backgroundColor: '#164f63',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                }}
                            >
                                Lihat Detail
                            </Link>
                        </article>
                    );
                })}
            </div>
        </main>
    );
}