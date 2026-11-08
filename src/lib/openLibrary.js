const BASE_URL = 'https://openlibrary.org';

export async function getDaftarBuku() {
    const res = await fetch(
        `${BASE_URL}/search.json?q=J. K. Rowling&limit=10`
    );

    if (!res.ok) {
        throw new Error('Gagal mengambil data buku');
    }

    const data = await res.json();

    return data.docs;
}

export async function getDetailBuku(id) {
    const res = await fetch(
        `${BASE_URL}/works/${id}.json`
    );

    if (!res.ok) {
        return null;
    }

    return res.json();
}

export function getCoverUrl(coverId) {
    if (!coverId) return '/no-cover.png';

    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}