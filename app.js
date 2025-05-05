const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Jimp = require('jimp');
const { createCanvas, registerFont, loadImage } = require('canvas');

// Register semua font dengan path absolut
try {
  // Font OCR untuk NIK
  const ocrFontPath = path.resolve(__dirname, 'font/Ocr.ttf');
  // Font Sign untuk tanda tangan
  const signFontPath = path.resolve(__dirname, 'font/Sign.ttf');
  // Font Arrial untuk teks lainnya
  const arrialFontPath = path.resolve(__dirname, 'font/Arrial.ttf');
  
  console.log('Font paths:');
  console.log('OCR:', ocrFontPath);
  console.log('Sign:', signFontPath);
  console.log('Arrial:', arrialFontPath);
  
  // Daftarkan font
  if (fs.existsSync(ocrFontPath)) {
    registerFont(ocrFontPath, { family: 'OCR' });
    console.log('Font OCR berhasil didaftarkan');
  }
  
  if (fs.existsSync(signFontPath)) {
    registerFont(signFontPath, { family: 'Sign' });
    console.log('Font Sign berhasil didaftarkan');
  }
  
  if (fs.existsSync(arrialFontPath)) {
    registerFont(arrialFontPath, { family: 'Arrial' });
    console.log('Font Arrial berhasil didaftarkan');
  }
} catch (error) {
  console.error('Error saat mendaftarkan font:', error);
}

// Inisialisasi Express
const app = express();
const port = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Konfigurasi penyimpanan upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar'), false);
    }
  } 
});

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/generate', upload.fields([
  { name: 'pas_photo', maxCount: 1 },
  { name: 'tanda_tangan', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files['pas_photo']) {
      return res.status(400).render('error', { 
        message: 'Pas foto wajib diupload' 
      });
    }

    const data = req.body;
    data.pas_photo = req.files['pas_photo'][0].path;
    
    // Jika tanda tangan diberikan sebagai data URL
    if (data.tanda_tangan && data.tanda_tangan.startsWith('data:image/png;base64,')) {
      // Simpan tanda tangan sebagai file
      const signatureData = data.tanda_tangan.replace(/^data:image\/png;base64,/, '');
      const signaturePath = path.join(__dirname, 'public/uploads', `signature_${Date.now()}.png`);
      fs.writeFileSync(signaturePath, Buffer.from(signatureData, 'base64'));
      data.tanda_tangan_path = signaturePath;
    }

    // Buat KTP
    const resultPath = await generateEKTP(data);
    
    res.render('result', { 
      imgPath: '/images/result.png',
      data: data
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { 
      message: 'Terjadi kesalahan saat membuat E-KTP: ' + error.message 
    });
  }
});

// Fungsi untuk membuat E-KTP
async function generateEKTP(data) {
  try {
    // Baca template dengan Jimp terlebih dahulu
    const template = await Jimp.read(path.join(__dirname, 'public/images/Template.png'));
    
    // Baca foto pas
    const photoPath = path.join(__dirname, data.pas_photo);
    let pasPhoto = await Jimp.read(photoPath);
    
    // Resize dan crop foto jika perlu
    if (pasPhoto.getWidth() !== 432) {
      pasPhoto = pasPhoto.crop(0, 0, Math.min(pasPhoto.getWidth(), 432), Math.min(pasPhoto.getHeight(), 450));
    }
    
    pasPhoto = pasPhoto.resize(Math.round(pasPhoto.getWidth() * 0.4), Math.round(pasPhoto.getHeight() * 0.4));
    
    // Tempel foto ke template
    template.composite(pasPhoto, 520, 140);

    // Simpan template dengan foto untuk diproses lebih lanjut dengan canvas
    const templateWithPhotoPath = path.join(__dirname, 'public/images/temp_template.png');
    await template.writeAsync(templateWithPhotoPath);

    // Load template dengan foto ke canvas
    const templateImg = await loadImage(templateWithPhotoPath);
    const canvasWidth = templateImg.width;
    const canvasHeight = templateImg.height;
    
    // Buat canvas dengan ukuran yang sama dengan template
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Gambar template ke canvas
    ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);
    
    // Konfigurasi font
    ctx.fillStyle = 'black';
    
    // Font provinsi dan kota (Arrial) - posisi tengah
    try {
      // Provinsi (di tengah)
      ctx.font = '25px Arrial';
      ctx.textAlign = 'center';
      // Posisi tengah horizontal di 380, vertikal di 65 (ditambah 10px dari sebelumnya)
      ctx.fillText(`PROVINSI ${data.provinsi.toUpperCase()}`, 380, 65);
      // Kota (di tengah)
      ctx.fillText(`KOTA ${data.kota.toUpperCase()}`, 380, 90);
      
      // Reset text align kembali ke default untuk teks lainnya
      ctx.textAlign = 'left';
    } catch (e) {
      console.error('Error menggunakan font Arrial:', e);
      // Fallback ke font standard
      ctx.font = '25px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PROVINSI ${data.provinsi.toUpperCase()}`, 380, 65);
      ctx.fillText(`KOTA ${data.kota.toUpperCase()}`, 380, 90);
      ctx.textAlign = 'left';
    }
    
    // Font NIK menggunakan OCR - posisinya diturunkan 20px dari posisi awal (sekarang 125)
    try {
      ctx.font = '32px OCR';
      ctx.fillText(data.nik, 170, 125); // posisi y diturunkan dari 105 menjadi 125 (+20px)
      console.log('Menggunakan font OCR untuk NIK');
    } catch (e) {
      console.error('Error menggunakan font OCR:', e);
      // Fallback ke font monospace
      ctx.font = '32px monospace';
      ctx.fillText(data.nik, 170, 125);
    }
    
    // Font data menggunakan Arrial - posisi y tetap seperti sebelumnya
    try {
      ctx.font = '16px Arrial';
      ctx.fillText(data.nama.toUpperCase(), 190, 155);
      ctx.fillText(data.ttl.toUpperCase(), 190, 178);
      ctx.fillText(data.jenis_kelamin.toUpperCase(), 190, 201);
      ctx.fillText(data.golongan_darah.toUpperCase(), 463, 200);
      ctx.fillText(data.alamat.toUpperCase(), 190, 222);
      ctx.fillText(data.rt_rw.toUpperCase(), 190, 244);
      ctx.fillText(data.kel_desa.toUpperCase(), 190, 267);
      ctx.fillText(data.kecamatan.toUpperCase(), 190, 289);
      ctx.fillText(data.agama.toUpperCase(), 190, 310);
      ctx.fillText(data.status.toUpperCase(), 190, 333);
      ctx.fillText(data.pekerjaan.toUpperCase(), 190, 356);
      ctx.fillText(data.kewarganegaraan.toUpperCase(), 190, 379);
      ctx.fillText(data.masa_berlaku.toUpperCase(), 190, 400);
      ctx.fillText(`KOTA ${data.kota.toUpperCase()}`, 553, 350);
      ctx.fillText(data.terbuat || new Date().toLocaleDateString('id-ID'), 570, 370);
    } catch (e) {
      console.error('Error menggunakan font Arrial untuk data:', e);
      // Fallback ke font standard
      ctx.font = '16px sans-serif';
      // Ulangi penulisan teks dengan font fallback dan posisi yang sama
      ctx.fillText(data.nama.toUpperCase(), 190, 155);
      ctx.fillText(data.ttl.toUpperCase(), 190, 178);
      // ... dan seterusnya dengan posisi yang sama seperti di atas
    }
    
    // Tanda tangan (nama pertama atau tanda tangan yang di-upload)
    try {
      if (data.tanda_tangan_path) {
        // Jika ada tanda tangan yang di-upload
        const signatureImg = await loadImage(data.tanda_tangan_path);
        // Resize tanda tangan ke ukuran yang sesuai
        const signWidth = 120;
        const signHeight = 50;
        ctx.drawImage(signatureImg, 540, 385, signWidth, signHeight);
      } else {
        // Jika tidak, gunakan nama pertama dengan font Sign
        const nameParts = data.nama.split(' ');
        ctx.font = '40px Sign';
        ctx.fillText(nameParts[0], 540, 405);
        console.log('Menggunakan font Sign untuk tanda tangan');
      }
    } catch (e) {
      console.error('Error menggunakan font Sign untuk tanda tangan:', e);
      // Fallback ke font standard
      const nameParts = data.nama.split(' ');
      ctx.font = '40px serif';
      ctx.fillText(nameParts[0], 540, 405);
    }
    
    // Simpan hasil
    const outputPath = path.join(__dirname, 'public/images/result.png');
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    
    await new Promise((resolve, reject) => {
      stream.pipe(out);
      out.on('finish', resolve);
      out.on('error', reject);
    });
    
    // Hapus file temporary
    fs.unlinkSync(templateWithPhotoPath);
    
    // Hapus file tanda tangan jika ada
    if (data.tanda_tangan_path && fs.existsSync(data.tanda_tangan_path)) {
      fs.unlinkSync(data.tanda_tangan_path);
    }
    
    return outputPath;
  } catch (error) {
    console.error('Error generating E-KTP:', error);
    throw error;
  }
}

// Start server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
}); 