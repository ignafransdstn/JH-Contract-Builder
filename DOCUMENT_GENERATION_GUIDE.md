# Document Generation Guide

## Cara Menggunakan Fitur Document Generation

Fitur ini memungkinkan data dari form contract **otomatis masuk** ke dokumen Word template.

## Format Placeholder

Gunakan format `{{nama_field}}` di dokumen Word Anda. Sistem akan otomatis mengganti placeholder dengan nilai dari form.

### Aturan Penamaan Placeholder:

1. **Gunakan huruf kecil (lowercase)**
2. **Gunakan underscore (_) untuk spasi**
3. **Hilangkan karakter khusus**

### Contoh Konversi:

| Label Field di Form | Placeholder di Word Document |
|---------------------|------------------------------|
| Nomor Dokumen       | `{{nomor_dokumen}}`         |
| Nama Pihak Pertama  | `{{nama_pihak_pertama}}`    |
| Alamat              | `{{alamat}}`                |
| Tanggal Kontrak     | `{{tanggal_kontrak}}`       |
| Nilai Kontrak       | `{{nilai_kontrak}}`         |

## Placeholder Otomatis Tersedia

Selain field yang Anda buat, sistem juga menyediakan placeholder untuk metadata contract:

| Placeholder | Deskripsi | Contoh Nilai |
|-------------|-----------|--------------|
| `{{contract_number}}` | Nomor kontrak unik | KTR-20260204-001 |
| `{{contract_title}}` | Judul kontrak | Draft Perjanjian Kerja Sama |
| `{{contract_description}}` | Deskripsi kontrak | Perjanjian kerja sama pembangunan |
| `{{contract_date}}` | Tanggal generate dokumen | 4 Februari 2026 |

## Cara Membuat Template:

### 1. Buka Dokumen Word Template Anda

Misalnya: `Draft Perjanjian Kerja Sama Pekerjaan Pembangunan.docx`

### 2. Tambahkan Placeholder

Ganti teks yang ingin diisi otomatis dengan placeholder:

**SEBELUM:**
```
PERJANJIAN KERJA SAMA
PEKERJAAN PEMBANGUNAN PABRIK TEPUNG
No. __________

Perjanjian Kerja Sama ("Perjanjian") ini dibuat dan ditandatangani pada tanggal _________, oleh dan antara:
```

**SESUDAH:**
```
PERJANJIAN KERJA SAMA
PEKERJAAN PEMBANGUNAN PABRIK TEPUNG
No. {{nomor_dokumen}}

Perjanjian Kerja Sama ("Perjanjian") ini dibuat dan ditandatangani pada tanggal {{contract_date}}, oleh dan antara:
```

### 3. Simpan Template

Pastikan file template disimpan dalam format `.docx` (bukan .doc atau PDF).

### 4. Upload Template Baru

Upload template yang sudah ditambahkan placeholder ke sistem melalui halaman Document Templates.

## Langkah-Langkah Generate Document:

### 1. Isi Form Contract

User mengisi form contract dengan data:
- Nomor Dokumen: 12326
- Nama Pihak: PT ABC
- dll.

### 2. Submit Contract

Contract disimpan dan masuk ke approval workflow.

### 3. Generate Document

Setelah contract di-approve atau kapanpun diperlukan, klik tombol **"Generate Document"**.

Sistem akan:
1. Membaca template Word
2. Mengganti semua `{{placeholder}}` dengan nilai dari form
3. Menyimpan dokumen baru
4. Menyediakan link download

### 4. Download Dokumen

Dokumen hasil generate bisa didownload dalam format `.docx` yang siap digunakan.

## Format Khusus untuk Tipe Data

Sistem otomatis memformat nilai sesuai tipe data:

| Tipe Field | Format Output | Contoh |
|------------|---------------|--------|
| Date       | DD MMMM YYYY (Indonesia) | 4 Februari 2026 |
| Currency   | Rp X,XXX,XXX | Rp 1.500.000 |
| Checkbox   | Comma separated | Option A, Option B |
| Text/Number| As is | 12326 |

## Contoh Lengkap

### Template Document:

```
PERJANJIAN KERJA SAMA
PEKERJAAN PEMBANGUNAN PABRIK TEPUNG
No. {{nomor_dokumen}}

Perjanjian Kerja Sama ini dibuat pada tanggal {{contract_date}}, oleh:

1. {{nama_pihak_pertama}}, beralamat di {{alamat_pihak_pertama}}
2. {{nama_pihak_kedua}}, beralamat di {{alamat_pihak_kedua}}

Dengan nilai kontrak sebesar {{nilai_kontrak}}.
```

### Form Data:

- Nomor Dokumen: 12326
- Nama Pihak Pertama: PT INDONESIA SEJAHTERA
- Alamat Pihak Pertama: Jl. Sudirman No. 123, Jakarta
- Nama Pihak Kedua: PT MAJU BERSAMA
- Alamat Pihak Kedua: Jl. Thamrin No. 456, Jakarta
- Nilai Kontrak: 1500000

### Hasil Generate:

```
PERJANJIAN KERJA SAMA
PEKERJAAN PEMBANGUNAN PABRIK TEPUNG
No. 12326

Perjanjian Kerja Sama ini dibuat pada tanggal 4 Februari 2026, oleh:

1. PT INDONESIA SEJAHTERA, beralamat di Jl. Sudirman No. 123, Jakarta
2. PT MAJU BERSAMA, beralamat di Jl. Thamrin No. 456, Jakarta

Dengan nilai kontrak sebesar Rp 1.500.000.
```

## Troubleshooting

### Placeholder Tidak Terganti

**Problem:** Placeholder muncul sebagai `{{nomor_dokumen}}` di hasil akhir.

**Solusi:**
1. Periksa ejaan placeholder di template Word
2. Pastikan menggunakan format yang benar: `{{nama_field}}`
3. Periksa nama field di form (huruf kecil, underscore untuk spasi)

### Error Saat Generate

**Problem:** "Error saat merge data ke dokumen"

**Solusi:**
1. Pastikan template dalam format `.docx`
2. Buka template di Word dan pastikan tidak ada error
3. Pastikan placeholder tidak berada di dalam tabel kompleks atau text box

### File Template Tidak Ditemukan

**Problem:** "File template tidak ditemukan"

**Solusi:**
1. Upload ulang template document
2. Pastikan file tidak dihapus dari server

## Tips Best Practices

1. **Buat Field Name yang Jelas**: Gunakan nama field yang deskriptif di form creation
2. **Test Preview**: Gunakan fitur "Preview Generation" sebelum generate dokumen final
3. **Backup Template**: Simpan copy template Word sebelum diupload
4. **Consistent Naming**: Gunakan naming convention yang konsisten untuk semua field
5. **Simple Placeholders**: Hindari placeholder dalam struktur Word yang kompleks (nested tables, text boxes)

## API Endpoints

Untuk developer yang ingin integrate programmatically:

### Generate Document
```
POST /api/contracts/:id/generate
```

### Download Document
```
GET /api/contracts/:id/download
```

### Preview Data
```
GET /api/contracts/:id/preview
```

## Next Steps

Setelah membaca guide ini:

1. ✅ Edit template Word Anda dan tambahkan placeholder
2. ✅ Upload template baru ke Document Templates
3. ✅ Buat contract baru menggunakan template
4. ✅ Click "Generate Document" button
5. ✅ Download dan review hasil dokumen
