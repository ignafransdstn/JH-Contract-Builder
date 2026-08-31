# 🎉 AUTO-CLEAN TEMPLATE - Fitur Baru!

## ✅ Tidak Perlu Repot dengan Formatting Word Lagi!

Sistem sekarang **OTOMATIS membersihkan template** saat Anda upload. Anda **TIDAK PERLU** mengikuti aturan ketat Word formatting lagi!

---

## 🚀 Cara Menggunakan (SANGAT MUDAH!)

### Langkah 1: Buat Template di Word (BEBAS!)

Anda bisa:
- ✅ Ketik placeholder dengan cara apapun
- ✅ Copy-paste dari dokumen lama
- ✅ Edit berkali-kali
- ✅ Format text sesuka hati
- ✅ **TIDAK PERLU** Ctrl+Space
- ✅ **TIDAK PERLU** ketik sekali jalan
- ✅ **TIDAK PERLU** khawatir spell checker

**Contoh - Ketik Bebas:**
```
Perjanjian dibuat pada {{tanggal}}, oleh dan antara:

1. {{perusahaan1}}, berkedudukan di {{alamat1}}, 
   diwakili oleh {{nama1}} sebagai {{posisi1}}
   (selanjutnya disebut "{{perusahaan1a}}")

2. {{perusahaan2}}, berkedudukan di {{alamat2}},
   diwakili oleh {{nama2}} sebagai {{posisi2}}
   (selanjutnya disebut "{{perusahaan2a}}")
```

**Aturan Sederhana:**
- Placeholder harus dimulai dengan `{{` dan diakhiri dengan `}}`
- Nama placeholder: huruf, angka, underscore (tanpa spasi)
- Contoh benar: `{{tanggal}}`, `{{nama_perusahaan}}`, `{{alamat1}}`
- Contoh salah: `{{ tanggal }}` (ada spasi), `{{tanggal` (tidak lengkap)

---

### Langkah 2: Upload Template

1. Buka **Document Templates** di aplikasi
2. Klik **"Upload Template"**
3. Isi form:
   - **Template Name**: Nama template (contoh: "Perjanjian Kerja Sama")
   - **Description**: Deskripsi singkat
   - **Category**: Pilih kategori
4. Pilih file .docx Anda
5. Klik **"Upload"**

**SISTEM OTOMATIS AKAN:**
✅ Mendeteksi placeholder yang rusak  
✅ Membersihkan formatting Word yang kompleks  
✅ Menghapus spell check markers  
✅ Memperbaiki split placeholders  
✅ Menggabungkan text runs yang terpisah  

---

### Langkah 3: Verifikasi Placeholder

Setelah upload, sistem akan tampilkan:
- **Jumlah placeholder** yang ditemukan
- **Daftar nama placeholder** yang terdeteksi

**Periksa:**
- ☑️ Semua placeholder terdeteksi (tidak ada yang hilang)
- ☑️ Nama placeholder benar (tidak ada typo)

**Jika Ada Masalah:**
- Edit template di Word
- Upload ulang (sistem akan replace)

---

### Langkah 4: Setup Approval Matrix & Test

1. Pilih **Reviewer**, **Approver 1**, **Approver 2**
2. Klik **"Complete Setup"** → Template jadi **Published**
3. **Test Generate:**
   - Buat contract baru
   - Pilih template ini
   - Isi semua field
   - Klik "Review Contract"
   - Download dokumen

**Harapan:** Dokumen generate **SUKSES tanpa error!** 🎉

---

## 🔍 Apa yang Sistem Bersihkan Otomatis?

### 1. **Spell Check Markers**
Word menandai kata-kata yang dianggap typo (seperti "tanggal", "perusahaan"). Sistem menghapus semua marker ini.

**Sebelum:**
```xml
<w:proofErr w:type="spellStart"/>
<w:t>tanggal</w:t>
<w:proofErr w:type="spellEnd"/>
```

**Sesudah:**
```xml
<w:t>tanggal</w:t>
```

### 2. **Split Placeholders**
Word memecah placeholder jadi beberapa bagian karena formatting berbeda.

**Sebelum:**
```xml
<w:t>{{</w:t></w:r>
<w:r><w:t>tanggal</w:t></w:r>
<w:r><w:t>}}</w:t>
```

**Sesudah:**
```xml
<w:t>{{tanggal}}</w:t>
```

### 3. **Empty Formatting Runs**
Word menambahkan formatting runs kosong di tengah placeholder.

**Sebelum:**
```xml
<w:t>{{tanggal</w:t></w:r>
<w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>}}</w:t>
```

**Sesudah:**
```xml
<w:t>{{tanggal}}</w:t>
```

### 4. **Revision ID Splits**
Word track changes menambahkan revision IDs yang memecah placeholder.

**Sebelum:**
```xml
<w:t>{{tanggal}}</w:t></w:r>
<w:r w:rsidRPr="00853168"><w:rPr>...</w:rPr><w:t>, oleh
```

**Sesudah:**
```xml
<w:t>{{tanggal}}</w:t><w:t>, oleh
```

---

## 📊 Log Pembersihan

Sistem mencatat di backend log:

```
[Template Cleaner] Processing: document-xxxx.docx
[Template Cleaner] Original XML length: 91924
[Template Cleaner] Removed 286 spell check markers
[Template Cleaner] Fixed 1 split opening brackets
[Template Cleaner] Fixed 1 split closing brackets
[Template Cleaner] Removed 1036 bytes of empty formatting runs
[Template Cleaner] Template cleaned successfully
[Template Cleaner] Placeholders: 14 → 14 (all preserved)
```

Admin/Developer bisa cek log ini untuk troubleshooting.

---

## ⚠️ Troubleshooting

### Problem 1: "Placeholder count changed"
**Gejala:** Log menunjukkan jumlah placeholder berubah (contoh: 13 → 12)

**Penyebab:** Ada placeholder yang rusak parah dan tidak bisa diperbaiki otomatis

**Solusi:**
1. Buka template di Word
2. Cari placeholder yang hilang
3. **Delete** placeholder tersebut
4. **Ketik ulang** dari NOL: `{{nama_field}}`
5. Upload ulang

### Problem 2: "Template validation failed"
**Gejala:** Sistem bilang "Some placeholders are broken"

**Penyebab:** Ada placeholder dengan format aneh yang lolos cleaning

**Solusi:**
1. Download template yang sudah di-upload
2. Buka di Word
3. Cari placeholder bermasalah (cek log untuk nama field)
4. Delete & ketik ulang
5. Upload ulang

### Problem 3: "Error generating document"
**Gejala:** Contract generate masih error meski template sudah di-clean

**Penyebab:** 
- Data tidak sesuai dengan field name
- Ada placeholder typo di template

**Solusi:**
1. Cek error message detail
2. Cocokkan nama field di template dengan data contract
3. Pastikan tidak ada typo: `{{tanggal}}` ✅ vs `{{tangal}}` ❌

---

## 💡 Tips Best Practices

### ✅ DO (Lakukan)
1. **Gunakan nama field yang jelas dan konsisten**
   - ✅ `{{tanggal_kontrak}}`
   - ✅ `{{nama_pihak_pertama}}`
   - ❌ `{{tgl}}` (terlalu singkat, sulit dipahami)

2. **Buat template dari file baru**
   - Buka Word → New Blank Document
   - Ketik konten dari NOL
   - Lebih bersih dari pada copy-paste

3. **Gunakan placeholder yang descriptive**
   - ✅ `{{alamat_perusahaan_pihak_1}}`
   - ❌ `{{a1}}` (tidak jelas)

4. **Test di development dulu**
   - Upload template
   - Test generate dengan data sample
   - Baru deploy ke production

5. **Buat backup template**
   - Sistem otomatis buat backup: `xxx_ORIGINAL_BACKUP.docx`
   - Simpan juga versi master di komputer Anda

### ❌ DON'T (Jangan)

1. **Jangan gunakan spasi di dalam placeholder**
   - ❌ `{{ tanggal }}`
   - ✅ `{{tanggal}}`

2. **Jangan gunakan karakter khusus**
   - ❌ `{{tanggal-kontrak}}`
   - ❌ `{{tanggal.kontrak}}`
   - ✅ `{{tanggal_kontrak}}`

3. **Jangan nested placeholders**
   - ❌ `{{{{tanggal}}}}`
   - ✅ `{{tanggal}}`

4. **Jangan placeholder incomplete**
   - ❌ `{{tanggal` (tidak ada closing)
   - ❌ `tanggal}}` (tidak ada opening)
   - ✅ `{{tanggal}}`

---

## 🎯 Kesimpulan

Dengan fitur **Auto-Clean Template**, Anda:
- ✅ **Tidak perlu peduli** formatting Word
- ✅ **Tidak perlu ikuti** aturan ketat
- ✅ **Tidak perlu** Ctrl+Space atau ketik sekali jalan
- ✅ **Bisa copy-paste** dari dokumen lama
- ✅ **Bisa edit bebas** di Word

**Sistem handle semua masalah formatting otomatis!**

---

## 📞 Support

Jika masih ada masalah:
1. Cek log di backend (`npm start` output)
2. Cari error message di browser console
3. Kontak developer dengan:
   - Screenshot error
   - Template file (jika bisa di-share)
   - Contract data yang digunakan

---

**Selamat menggunakan! 🎉**
