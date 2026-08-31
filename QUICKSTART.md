# JH Contract Builder - Quick Start Guide

## Instalasi Cepat

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (di terminal baru)
cd frontend
npm install
```

### 2. Setup Database

Pastikan MongoDB sudah terinstall dan running:

```bash
# Windows
net start MongoDB

# atau jika manual install
mongod --dbpath="C:\data\db"
```

### 3. Konfigurasi Environment

**Backend (.env)**
```bash
cd backend
copy .env.example .env
```

Edit file `.env` minimal untuk:
- `JWT_SECRET`: Ganti dengan secret key Anda
- `MONGODB_URI`: Sesuaikan jika perlu
- `SMTP_*`: Konfigurasi email (optional untuk testing)

**Frontend (.env)**
```bash
cd frontend
copy .env.example .env
```

Biasanya tidak perlu diubah untuk development.

### 4. Jalankan Aplikasi

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend akan berjalan di http://localhost:5001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Frontend akan berjalan di http://localhost:3002

### 5. Create Admin User

Gunakan API endpoint atau MongoDB untuk create user pertama:

```javascript
// Menggunakan MongoDB Compass atau shell
use jh_contract_builder

db.users.insertOne({
  name: "Admin",
  email: "admin@jimbaranhijau.com",
  password: "$2a$10$XxX...", // hash dari bcrypt untuk "admin123"
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Atau gunakan endpoint register (pastikan endpoint terbuka atau gunakan Postman):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@jimbaranhijau.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 6. Login

Buka browser ke http://localhost:3000/login

```
Email: admin@jimbaranhijau.com
Password: admin123
```

## Testing Workflow

### 1. Create Users (sebagai Admin)

Buat users dengan role berbeda:
- 1 Supervisor
- 1 Manager  
- 1 C-Level
- 1 Staff
- 1 User

### 2. Create Document Template (sebagai Supervisor)

1. Login as Supervisor
2. Upload dokumen Word/PDF
3. System akan scan dan generate fields
4. Set approval matrix:
   - Reviewer: Supervisor
   - Approval 1: Manager
   - Approval 2: C-Level (optional)

### 3. Submit Contract (sebagai User/Staff)

1. Login as User atau Staff
2. Pilih template
3. Isi form
4. Submit

### 4. Test Approval Flow

1. Login as Supervisor → Review contract
2. Login as Manager → Approve layer 1
3. (Optional) Login as C-Level → Approve layer 2

### 5. Check Email Notifications

Jika SMTP dikonfigurasi, cek email untuk notifikasi approval.

## Troubleshooting

### MongoDB tidak bisa connect
```bash
# Check MongoDB service
net start MongoDB

# atau cek di Services (services.msc)
```

### Port sudah digunakan
```bash
# Ganti PORT di backend/.env
PORT=5001

# atau kill process yang menggunakan port
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### OpenAI tidak terinstall (optional)
Sistem akan tetap jalan dengan pattern matching untuk document scanning.

Untuk install OpenAI:
```bash
cd backend
npm install openai
```

## Default Test Credentials

Setelah setup, Anda bisa menggunakan:

```
Admin:
- Email: admin@jimbaranhijau.com
- Password: admin123
```

## Next Steps

1. Customize template sesuai kebutuhan bisnis
2. Configure email SMTP untuk production
3. Setup OpenAI API untuk AI scanning (optional)
4. Deploy ke server production
5. Tambahkan SSL certificate

## Production Deployment

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-key-minimum-32-chars
FRONTEND_URL=https://yourdomain.com
```

### Security Checklist

- [ ] Change JWT_SECRET
- [ ] Use strong MongoDB credentials
- [ ] Enable MongoDB authentication
- [ ] Setup SSL/TLS
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup backup strategy
- [ ] Configure proper logging

## Support

Untuk bantuan lebih lanjut, hubungi:
- Email: dev@jimbaranhijau.com
- Documentation: Lihat README.md lengkap
