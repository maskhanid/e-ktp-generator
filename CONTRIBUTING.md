# Kontribusi untuk E-KTP Generator

Terima kasih atas minat Anda untuk berkontribusi pada E-KTP Generator! Proyek ini bertujuan untuk membuat tools generator E-KTP untuk keperluan edukasi.

## Cara Berkontribusi

### Melaporkan Bug

Jika Anda menemukan bug dalam aplikasi, silakan buat issue baru di GitHub dengan:

1. Judul yang jelas dan deskriptif
2. Langkah-langkah untuk mereproduksi bug
3. Perilaku yang diharapkan vs. perilaku yang sebenarnya
4. Screenshot jika memungkinkan
5. Detail lingkungan (OS, browser, versi Node.js)

### Mengusulkan Fitur

Untuk mengusulkan fitur baru:

1. Buat issue baru dengan label "enhancement"
2. Jelaskan fitur dengan detail yang cukup
3. Jelaskan bagaimana fitur ini bermanfaat bagi pengguna
4. Jika memungkinkan, sertakan sketsa atau mockup

### Pull Requests

1. Fork repositori
2. Clone repositori fork ke komputer lokal Anda
3. Buat branch baru: `git checkout -b feature-name`
4. Buat perubahan Anda
5. Commit perubahan: `git commit -m 'Add some feature'`
6. Push ke branch: `git push origin feature-name`
7. Buat Pull Request

### Panduan Kode

- Gunakan format kode yang konsisten
- Ikuti gaya pemrograman yang sudah ada
- Pastikan kode Anda memiliki dokumentasi yang cukup
- Tulis unit test jika memungkinkan

## Setup Pengembangan

```bash
# Clone repositori
git clone https://github.com/YoshCasaster/e-ktp_generator.git
cd e-ktp_generator

# Install dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

## Struktur Proyek

```
e-ktp_generator/
├── font/                # Font untuk E-KTP
├── public/              # Aset statis
│   ├── css/             # File CSS
│   ├── js/              # File JavaScript
│   ├── images/          # Gambar template
│   └── uploads/         # Folder untuk upload
├── src/                 # Source code lama (Python)
├── views/               # Template EJS
├── app.js               # File utama aplikasi
├── data.json            # Data sampel
└── package.json         # Manifest NPM
```

## Panduan Teknologi

- **Backend**: Node.js dengan Express
- **Frontend**: HTML, CSS, JavaScript dengan Bootstrap 5
- **Templating**: EJS
- **Image Processing**: Canvas, Jimp

## Lisensi

Dengan berkontribusi pada E-KTP Generator, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah lisensi yang sama dengan proyek ini (MIT). 