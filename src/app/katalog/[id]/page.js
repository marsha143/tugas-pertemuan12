import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDetailBuku, getCoverUrl } from '@/lib/openLibrary';

// 1. FUNGSI SEO METADATA DINAMIS
export async function generateMetadata({ params }) {
    const { id } = await params;

    const buku = await getDetailBuku(id);

    if (!buku) {
        return {
            title: 'Buku Tidak Ditemukan',
        };
    }

    const deskripsi = typeof buku.description === 'string'
        ? buku.description
        : buku.description?.value || `Detail buku ${buku.title}.`;

    const coverUrl = buku.covers?.[0]
        ? getCoverUrl(buku.covers[0])
        : null;

    return {
        title: buku.title,
        description: deskripsi.slice(0, 150),
        openGraph: {
            title: buku.title,
            description: deskripsi.slice(0, 100),
            images: coverUrl ? [coverUrl] : [],
            type: 'book',
        },
    };
}

// 2. KOMPONEN HALAMAN DETAIL BUKU
export default async function DetailBuku({ params }) {
    const { id } = await params;

    // Mengambil detail buku berdasarkan ID
    const buku = await getDetailBuku(id);

    // Jika buku tidak ditemukan, tampilkan halaman 404
    if (!buku) {
        notFound();
    }

    // Mengambil informasi penulis
    const daftarPenulis = await Promise.all(
        (buku.authors || []).map(async (item) => {
            const authorKey = item.author?.key;

            if (!authorKey) return null;

            const res = await fetch(
                `https://openlibrary.org${authorKey}.json`
            );

            if (!res.ok) return null;

            const dataPenulis = await res.json();

            return dataPenulis.name;
        })
    );

    const namaPenulis = daftarPenulis.filter(Boolean);

    // Mengambil gambar sampul buku
    const coverUrl = buku.covers?.[0]
        ? getCoverUrl(buku.covers[0])
        : null;

    // Mengolah deskripsi buku
    const deskripsi = typeof buku.description === 'string'
        ? buku.description
        : buku.description?.value || 'Deskripsi buku belum tersedia.';

    return (
        <main style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '40px 24px',
        }}>

            {/* 3. Tombol kembali ke katalog */}
            <Link
                href="/katalog"
                style={{
                    display: 'inline-block',
                    marginBottom: '32px',
                    color: '#164f63',
                    textDecoration: 'none',
                    fontWeight: '600',
                }}
            >
                ← Kembali ke Katalog
            </Link>

            {/* 4. Informasi detail buku */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 300px) 1fr',
                gap: '40px',
                alignItems: 'start',
            }}>

                {/* Gambar sampul buku */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '400px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}>
                    {coverUrl ? (
                        <Image
                            src={coverUrl}
                            alt={`Sampul buku ${buku.title}`}
                            fill
                            sizes="(max-width: 700px) 100vw, 300px"
                            priority
                            style={{ objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                        }}>
                            Sampul tidak tersedia
                        </div>
                    )}
                </div>

                {/* Informasi buku */}
                <section>
                    <span style={{
                        display: 'inline-block',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                    }}>
                        DETAIL BUKU
                    </span>

                    <h1 style={{
                        fontSize: '30px',
                        margin: '16px 0',
                    }}>
                        {buku.title}
                    </h1>

                    <p style={{
                        color: '#64748b',
                        marginBottom: '24px',
                    }}>
                        Penulis: {namaPenulis.join(', ') || 'Tidak diketahui'}
                    </p>

                    <div style={{
                        borderTop: '1px solid #e2e8f0',
                        borderBottom: '1px solid #e2e8f0',
                        padding: '20px 0',
                        marginBottom: '24px',
                    }}>
                        <h3 style={{ fontSize: '18px' }}>
                            Informasi Buku
                        </h3>

                        <p>
                            <strong>Tahun terbit:</strong>{' '}
                            {buku.first_publish_date || '-'}
                        </p>

                        <p>
                            <strong>Jumlah halaman:</strong>{' '}
                            {buku.number_of_pages || '-'}
                        </p>

                        <p>
                            <strong>ID Buku:</strong> {id}
                        </p>
                    </div>

                    <h3>Deskripsi Buku</h3>

                    <p style={{
                        color: '#475569',
                        lineHeight: 1.8,
                        textAlign: 'justify',
                    }}>
                        {deskripsi}
                    </p>

                    {/* Kategori buku */}
                    {buku.subjects?.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <h3>Kategori dan Topik</h3>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                            }}>
                                {buku.subjects.slice(0, 8).map((subject, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            backgroundColor: '#f1f5f9',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                        }}
                                    >
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}