# JH Contract Builder - Start Modes

## Development Mode (Recommended untuk Development)

Gunakan mode ini saat development/coding. Frontend akan auto-reload ketika ada perubahan code.

### Cara Start:

#### Otomatis (Recommended):
```powershell
.\start-services.ps1
```

#### Manual:
```powershell
# Terminal 1 - Backend
cd backend
npm start
# atau untuk auto-reload: npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

### Karakteristik:
- ✅ Auto-reload saat code berubah
- ✅ Hot Module Replacement (HMR)
- ✅ Source maps untuk debugging
- ✅ Detailed error messages
- ⚠️ Ukuran bundle lebih besar
- ⚠️ Loading lebih lambat

---

## Production Mode (Untuk Deploy/Production)

Gunakan mode ini untuk production atau testing production build.

### Cara Start:

#### 1. Build Frontend terlebih dahulu:
```powershell
cd frontend
npm run build
```

#### 2. Jalankan Services:

**Menggunakan start-all.ps1:**
```powershell
.\start-all.ps1
```

**Atau manual:**
```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (serve production build)
cd frontend
node server.js
# atau: serve -s build -l 3000
```

### Karakteristik:
- ✅ Optimized bundle (minified, compressed)
- ✅ Loading lebih cepat
- ✅ Ukuran file lebih kecil
- ⚠️ Tidak auto-reload
- ⚠️ Harus rebuild setiap kali ada perubahan code

---

## Scripts Ringkasan

| Script | Mode | Fungsi |
|--------|------|--------|
| `.\start-services.ps1` | **Development** | Start backend + frontend (development mode) |
| `.\start-all.ps1` | Production | Start backend + frontend (production mode, perlu build dulu) |
| `.\status-services.ps1` | - | Cek status services |
| `.\stop-services.ps1` | - | Stop semua services |
| `.\restart-services.ps1` | - | Restart services |

---

## Troubleshooting

### Error: "ENOENT: no such file or directory, stat 'frontend/build/index.html'"

**Penyebab:** Script production mode dijalankan tapi folder build belum ada.

**Solusi:**
1. Untuk development, gunakan `.\start-services.ps1` (sudah diperbaiki)
2. Untuk production, build dulu: `cd frontend; npm run build`

### Port Already in Use

**Solusi:**
```powershell
.\stop-services.ps1
.\start-services.ps1
```

---

## Rekomendasi

- **Saat Development:** Selalu gunakan `.\start-services.ps1` atau `npm start`
- **Sebelum Deploy:** Build dan test dengan production mode
- **Production Server:** Gunakan production build dengan node server.js atau serve

