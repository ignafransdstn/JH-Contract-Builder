# ✅ Migrasi MongoDB → PostgreSQL Selesai!

## 📋 Yang Sudah Dikerjakan

### 1. ✅ Dependencies Updated
- **Dihapus**: `mongoose`
- **Ditambah**: `sequelize`, `pg`, `pg-hstore`
- File: [backend/package.json](backend/package.json)

### 2. ✅ Database Configuration
- **File baru**: [backend/src/config/database.js](backend/src/config/database.js)
- Sequelize setup dengan connection pooling
- Auto-test connection saat startup

### 3. ✅ Models Converted (3/3)
Semua models telah dikonversi dari Mongoose ke Sequelize:

#### ✅ User Model
- File: [backend/src/models/User.js](backend/src/models/User.js)
- Primary key: UUID (bukan ObjectId)
- Password hashing via hooks
- Scopes untuk exclude/include password
- Methods: `comparePassword()`, `hasPermission()`

#### ✅ DocumentTemplate Model  
- File: [backend/src/models/DocumentTemplate.js](backend/src/models/DocumentTemplate.js)
- Primary key: UUID
- Fields & approvalMatrix menggunakan **JSONB** (PostgreSQL)
- Full-text search index

#### ✅ Contract Model
- File: [backend/src/models/Contract.js](backend/src/models/Contract.js)
- Primary key: UUID
- Foreign keys: `templateId`, `submittedById`, `reviewerId`, dll
- ContractData & approvalHistory menggunakan **JSONB**
- Auto-generate contract number via hooks

#### ✅ Model Relationships
- File: [backend/src/models/index.js](backend/src/models/index.js)
- Semua relasi sudah didefinisikan (belongsTo, hasMany)
- Aliases untuk easy querying

### 4. ✅ Server Updated
- File: [backend/src/server.js](backend/src/server.js)
- PostgreSQL connection replacing MongoDB
- Auto database sync saat startup
- Async server startup with error handling

### 5. ✅ Environment Variables
- File: [backend/.env.example](backend/.env.example)
- MongoDB config dihapus
- PostgreSQL config ditambah:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`

### 6. ✅ Migration Guide
- File: [MONGODB_TO_POSTGRESQL_MIGRATION.md](MONGODB_TO_POSTGRESQL_MIGRATION.md)
- **Lengkap dengan**:
  - Field type mapping (Mongoose ↔ Sequelize)
  - Query syntax comparison
  - 11 contoh query transformations
  - Sequelize operators reference
  - Controller update examples
  - Installation & setup guide
  - Troubleshooting tips
  - Best practices

## 🚧 Yang Perlu Dilakukan Selanjutnya

### ⚠️ PENTING: Controllers Belum Diupdate!

Semua controllers masih menggunakan Mongoose syntax dan perlu diupdate ke Sequelize:

#### Files yang Perlu Update:
1. **authController.js** - 7 queries
2. **userController.js** - 8 queries  
3. **documentController.js** - Multiple queries
4. **contractController.js** - Complex queries with populate
5. **approvalController.js** - Multiple queries
6. **middleware/auth.js** - 1 query

#### Contoh Perubahan yang Diperlukan:

```javascript
// ❌ Mongoose (OLD)
const user = await User.findOne({ email });
const user = await User.findById(id);
const users = await User.find().sort({ createdAt: -1 }).limit(10);

// ✅ Sequelize (NEW)  
const user = await User.findOne({ where: { email } });
const user = await User.findByPk(id);
const users = await User.findAll({ 
  order: [['createdAt', 'DESC']], 
  limit: 10 
});
```

**Referensi lengkap**: Lihat [MONGODB_TO_POSTGRESQL_MIGRATION.md](MONGODB_TO_POSTGRESQL_MIGRATION.md)

## 📦 Instalasi & Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup PostgreSQL Database
```bash
# Buat database baru
createdb jh_contract_builder

# Atau via psql
psql -U postgres
CREATE DATABASE jh_contract_builder;
\q
```

### Step 3: Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env dan isi:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=jh_contract_builder
# DB_USER=postgres
# DB_PASSWORD=your_password_here
```

### Step 4: Update Controllers (MANUAL)
Gunakan migration guide untuk mengupdate setiap controller file.

**Atau** jalankan script auto-update jika tersedia (coming soon).

### Step 5: Run Server
```bash
npm run dev
```

Server akan:
- ✅ Connect ke PostgreSQL
- ✅ Auto-create tables
- ✅ Ready untuk menerima requests

## 🔍 Verifikasi

### Check Database Tables
```bash
psql -U postgres -d jh_contract_builder

# List tables
\dt

# Should see:
# Users
# DocumentTemplates
# Contracts
```

### Test API
```bash
# Test health check
curl http://localhost:5000/health

# Should return:
# {"status":"OK","message":"JH Contract Builder API is running"}
```

## 📚 Dokumentasi

### 1. Migration Guide
📄 [MONGODB_TO_POSTGRESQL_MIGRATION.md](MONGODB_TO_POSTGRESQL_MIGRATION.md)
- Complete query syntax reference
- Field mapping tables
- 11 examples dengan before/after
- Troubleshooting tips

### 2. Main Documentation
📄 [README.md](README.md)
- Perlu minor updates untuk reflect PostgreSQL

### 3. Project Structure
📄 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- Database schema sudah disesuaikan
- Technology stack updated

## ⚡ Quick Reference

### Sequelize Cheat Sheet

```javascript
// Import
const { Op } = require('sequelize');
const { User, Contract, DocumentTemplate } = require('../models');

// Find One
await User.findOne({ where: { email } });
await User.findByPk(id);

// Find All
await User.findAll({ where: { role: 'admin' } });

// With relations (like populate)
await Contract.findByPk(id, {
  include: [
    { model: User, as: 'submitter' },
    { model: DocumentTemplate, as: 'template' }
  ]
});

// Create
await User.create({ name, email, password });

// Update
await User.update({ name: 'New' }, { where: { id } });

// Delete
await User.destroy({ where: { id } });

// Count
await User.count({ where: { isActive: true } });

// Complex where
await Contract.findAll({
  where: {
    status: { [Op.in]: ['pending', 'reviewed'] },
    createdAt: { [Op.gte]: new Date('2024-01-01') }
  }
});
```

## 🎯 Next Steps

1. **Update controllers** menggunakan migration guide
2. **Test semua endpoints** dengan Postman
3. **Verify database** struktur dan data
4. **Update frontend** jika ada field name changes
5. **Deploy** setelah semua berfungsi

## 🆘 Need Help?

- Baca migration guide: [MONGODB_TO_POSTGRESQL_MIGRATION.md](MONGODB_TO_POSTGRESQL_MIGRATION.md)
- Cek error logs di `backend/logs/`
- PostgreSQL docs: https://www.postgresql.org/docs/
- Sequelize docs: https://sequelize.org/docs/v6/

---

**Status**: ✅ Models & Infrastructure Complete | ⚠️ Controllers Need Update  
**Updated**: 2026-02-02
