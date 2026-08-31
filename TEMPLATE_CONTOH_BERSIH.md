# CONTOH TEMPLATE PERJANJIAN KERJA SAMA - CLEAN VERSION

## Cara Membuat Template Yang Bersih

### ⚠️ PENTING: Aturan Membuat Template

1. **Jangan edit placeholder setelah mengetik** - Ketik sekali jalan tanpa berhenti
2. **Jangan format placeholder** - Biarkan plain text
3. **Clear formatting setelah mengetik** - Gunakan Ctrl+Space
4. **Test setiap placeholder** - Klik di tengah, tekan Ctrl+Space lagi, pastikan tidak berubah

---

## TEMPLATE CONTENT

```
PERJANJIAN KERJA SAMA
PEKERJAAN PEMBANGUNAN


Yang bertanda tangan di bawah ini pada hari ini, {{tanggal}}, telah sepakat untuk mengadakan Perjanjian Kerja Sama dengan ketentuan sebagai berikut:


PIHAK PERTAMA

Nama Perusahaan  : {{perusahaan1}}
Alamat           : {{alamat1}}
Diwakili oleh    : {{nama1}}
Jabatan          : {{posisi1}}

Selanjutnya disebut sebagai {{perusahaan1a}} atau PIHAK PERTAMA.


PIHAK KEDUA

Nama Perusahaan  : {{perusahaan2}}
Alamat           : {{alamat2}}
Diwakili oleh    : {{nama2}}
Jabatan          : {{posisi2}}

Selanjutnya disebut sebagai {{perusahaan2a}} atau PIHAK KEDUA.


PASAL 1
RUANG LINGKUP PEKERJAAN

PIHAK PERTAMA setuju untuk melaksanakan pekerjaan pembangunan sesuai dengan spesifikasi teknis yang telah disepakati bersama dengan PIHAK KEDUA.


PASAL 2
JANGKA WAKTU

Pekerjaan ini akan dimulai setelah penandatanganan perjanjian dan akan diselesaikan sesuai dengan jadwal yang telah disepakati.


PASAL 3
NILAI KONTRAK

Nilai kontrak akan ditentukan berdasarkan volume pekerjaan dan spesifikasi teknis yang telah disetujui oleh kedua belah pihak.


PASAL 4
KETENTUAN PEMBAYARAN

Pembayaran akan dilakukan secara bertahap sesuai dengan progress pekerjaan yang telah diverifikasi dan disetujui oleh PIHAK KEDUA.


PASAL 5
HAK DAN KEWAJIBAN

Kedua belah pihak sepakat untuk melaksanakan hak dan kewajiban masing-masing sesuai dengan ketentuan dalam perjanjian ini.


PASAL 6
PENYELESAIAN PERSELISIHAN

Apabila terjadi perselisihan, kedua belah pihak sepakat untuk menyelesaikannya secara musyawarah. Jika tidak tercapai kesepakatan, akan diselesaikan melalui jalur hukum yang berlaku.


PASAL 7
PENUTUP

Demikian perjanjian ini dibuat dalam rangkap 2 (dua) yang masing-masing memiliki kekuatan hukum yang sama, ditandatangani di atas materai cukup.


Dibuat di Bali
Tanggal: {{tanggal}}



PIHAK PERTAMA                              PIHAK KEDUA



{{penandatangan1}}                         {{penandatangan2}}
{{posisi1}}                                {{posisi2}}
{{perusahaan1}}                            {{perusahaan2}}
```

---

## LANGKAH-LANGKAH MEMBUAT TEMPLATE DI WORD

### 1. Buat Dokumen Baru
- Buka Microsoft Word
- File → New → Blank Document
- Set font default: **Calibri 11pt** atau **Noto Serif 9pt**
- Set margins: Normal (2.54cm all sides)

### 2. Copy Content
- Copy seluruh content dari template di atas
- Paste ke Word sebagai **Plain Text** (Ctrl+Shift+V atau Paste Special → Unformatted Text)

### 3. PENTING: Ketik Ulang Semua Placeholder

⚠️ **JANGAN COPY-PASTE PLACEHOLDER!** Ini akan membawa formatting issues.

Untuk setiap placeholder (contoh: {{tanggal}}):

**CARA YANG BENAR:**
```
1. Delete placeholder yang di-paste
2. Ketik: { { t a n g g a l } } (8 karakter SEKALI JALAN tanpa berhenti)
3. Select {{tanggal}}
4. Tekan Ctrl+Space (clear formatting)
5. Tekan Ctrl+Space LAGI (test - jika berubah, ulangi dari step 1)
6. Klik di tengah "tang" → Lihat toolbar → Font harus sama dengan text sekitar
```

**CARA YANG SALAH:**
- ❌ Ketik `{{`, pause, ketik `tanggal`, pause, ketik `}}`
- ❌ Copy-paste placeholder dari tempat lain
- ❌ Format placeholder (bold, italic, color, etc.)
- ❌ Edit placeholder yang sudah diketik (delete sebagian lalu ketik ulang)

### 4. Ulangi Untuk Semua 13 Placeholder

1. {{tanggal}} - Ketik sekali jalan → Ctrl+Space → Test
2. {{perusahaan1}} - Ketik sekali jalan → Ctrl+Space → Test
3. {{alamat1}} - Ketik sekali jalan → Ctrl+Space → Test
4. {{nama1}} - Ketik sekali jalan → Ctrl+Space → Test
5. {{posisi1}} - Ketik sekali jalan → Ctrl+Space → Test
6. {{perusahaan1a}} - Ketik sekali jalan → Ctrl+Space → Test
7. {{perusahaan2}} - Ketik sekali jalan → Ctrl+Space → Test
8. {{alamat2}} - Ketik sekali jalan → Ctrl+Space → Test
9. {{nama2}} - Ketik sekali jalan → Ctrl+Space → Test
10. {{posisi2}} - Ketik sekali jalan → Ctrl+Space → Test
11. {{perusahaan2a}} - Ketik sekali jalan → Ctrl+Space → Test
12. {{penandatangan1}} - Ketik sekali jalan → Ctrl+Space → Test
13. {{penandatangan2}} - Ketik sekali jalan → Ctrl+Space → Test

### 5. Format Dokumen (BUKAN Placeholder!)

Sekarang format document structure (JANGAN format placeholders):

- **Judul**: Bold, Center, 14pt
- **Sub-judul**: Bold, 12pt
- **Pasal**: Bold
- **Paragraf**: Justified
- **Signature area**: Table 2 kolom

### 6. Save Template

- File → Save As
- Nama: `Template_Perjanjian_Kerja_Sama_CLEAN.docx`
- Simpan di folder yang mudah diakses

### 7. Upload ke Sistem

1. Login ke Contract Builder
2. Navigasi ke **Document Templates**
3. Klik **Upload Template**
4. Pilih file `Template_Perjanjian_Kerja_Sama_CLEAN.docx`
5. Tunggu system extract placeholders
6. Verify: Should detect 13 placeholders
7. Test: Create contract → Generate → Should work! ✅

---

## VERIFICATION CHECKLIST

Sebelum upload, verify template Anda:

### Visual Check
- ☐ All placeholders visible
- ☐ No typos in placeholder names
- ☐ Opening `{{` and closing `}}` matched
- ☐ No spaces inside brackets: `{{ tanggal }}` ❌ should be `{{tanggal}}` ✅

### Technical Check (di Word)
- ☐ Klik di tengah setiap placeholder
- ☐ Tekan Ctrl+Space
- ☐ If appearance DOES NOT change → ✅ Clean
- ☐ If appearance CHANGES → ❌ Rusak, ketik ulang

### Upload Check
- ☐ System detects exactly 13 placeholders
- ☐ All placeholder names correct
- ☐ No error messages during upload

### Generation Check
- ☐ Create test contract
- ☐ Fill all 13 fields
- ☐ Click "Generate"
- ☐ Should succeed with 0 errors
- ☐ Download generated document
- ☐ Verify all placeholders replaced with actual data
- ☐ Search for `{{` → should find 0 results

---

## TROUBLESHOOTING

### Jika Upload Gagal
- Check file size < 10MB
- Check file format is .docx (not .doc or .pdf)
- Check filename tidak ada special characters

### Jika System Tidak Detect Placeholders
- Typo di placeholder names
- Missing `{{` or `}}`
- Extra spaces: `{{ tanggal }}` instead of `{{tanggal}}`

### Jika Generate Gagal Dengan Errors
- Placeholder rusak (formatting issue)
- Ketik ulang placeholder yang error
- Follow strict typing rules (sekali jalan, Ctrl+Space)

---

## CONTOH DATA UNTUK TEST

Setelah upload template, test dengan data ini:

```
tanggal: 1 Februari 2026
perusahaan1: PT. Jimbaran Hijau
alamat1: Jl. Uluwatu No. 123, Jimbaran, Bali
nama1: Budi Santoso
posisi1: Direktur Utama
perusahaan1a: PIHAK PERTAMA
perusahaan2: PT. Konstruksi Bali
alamat2: Jl. Sunset Road No. 456, Kuta, Bali
nama2: Wayan Sutrisna
posisi2: Direktur
perusahaan2a: PIHAK KEDUA
penandatangan1: Budi Santoso
penandatangan2: Wayan Sutrisna
```

Expected result: Document generated successfully with all placeholders replaced! 🎉

---

## TIPS ADVANCED

### Untuk Template Kompleks
- Gunakan tables untuk layout
- Gunakan styles untuk consistency
- Jangan format individual placeholders
- Format paragraph/section instead

### Untuk Multiple Templates
- Create template library
- Standardize placeholder names
- Document your placeholder conventions
- Test each template before production use

### Untuk Maintenance
- Keep backup of clean templates
- Version control your templates
- Document any changes made
- Re-test after any modification

---

## SUMMARY

**The Golden Rule**: 
> Type placeholders in ONE GO, never edit or format them, always Ctrl+Space to clear formatting, and test before upload.

Follow these steps, and your template will work perfectly with the system! 🚀
