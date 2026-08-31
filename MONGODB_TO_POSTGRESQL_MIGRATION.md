# MongoDB to PostgreSQL Migration Guide

## Overview
Sistem JH Contract Builder telah dimigrasikan dari MongoDB + Mongoose ke PostgreSQL + Sequelize.

## Perubahan Utama

### 1. Database & ORM
- **Sebelum**: MongoDB + Mongoose
- **Sesudah**: PostgreSQL + Sequelize

### 2. Dependencies yang Berubah
```json
// Yang dihapus:
"mongoose": "^7.6.3"

// Yang ditambah:
"sequelize": "^6.35.1",
"pg": "^8.11.3",
"pg-hstore": "^2.3.4"
```

### 3. Konfigurasi Database
**File baru**: `backend/src/config/database.js`

### 4. Environment Variables
Update `.env`:
```env
# MongoDB (HAPUS)
# MONGODB_URI=mongodb://localhost:27017/jh_contract_builder

# PostgreSQL (TAMBAH)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jh_contract_builder
DB_USER=postgres
DB_PASSWORD=your_password
```

## Perubahan Model

### Field Type Mapping

| Mongoose | Sequelize | Notes |
|----------|-----------|-------|
| `String` | `DataTypes.STRING` | Varchar(255) |
| `Number` | `DataTypes.INTEGER` atau `DataTypes.FLOAT` | |
| `Boolean` | `DataTypes.BOOLEAN` | |
| `Date` | `DataTypes.DATE` | Timestamp |
| `ObjectId` | `DataTypes.UUID` | Primary keys sekarang UUID |
| `Array` | `DataTypes.JSONB` | PostgreSQL JSONB |
| `Object` | `DataTypes.JSONB` | PostgreSQL JSONB |
| `Mixed` | `DataTypes.JSONB` | PostgreSQL JSONB |
| `enum` | `DataTypes.ENUM()` | |

### Primary Keys
- **Sebelum**: MongoDB ObjectId (`_id`)
- **Sesudah**: UUID (`id`)

### Relasi/References
```javascript
// Mongoose
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}

// Sequelize  
createdBy: {
  type: DataTypes.UUID,
  references: {
    model: 'Users',
    key: 'id'
  }
}
```

### Timestamps
- `createdAt` dan `updatedAt` otomatis ditambahkan dengan `timestamps: true`
- Sama seperti Mongoose

## Perubahan Query Syntax

### 1. Create
```javascript
// Mongoose
const user = await User.create({ name, email, password });

// Sequelize (SAMA)
const user = await User.create({ name, email, password });
```

### 2. Find One
```javascript
// Mongoose
const user = await User.findOne({ email });
const user = await User.findById(id);

// Sequelize
const user = await User.findOne({ where: { email } });
const user = await User.findByPk(id);
```

### 3. Find All with Filter
```javascript
// Mongoose
const users = await User.find({ role: 'admin', isActive: true });

// Sequelize
const users = await User.findAll({ 
  where: { role: 'admin', isActive: true } 
});
```

### 4. Find with Pagination & Sort
```javascript
// Mongoose
const users = await User.find()
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });

// Sequelize
const users = await User.findAll({
  offset: skip,
  limit: limit,
  order: [['createdAt', 'DESC']]
});
```

### 5. Count
```javascript
// Mongoose
const count = await User.countDocuments({ role: 'admin' });

// Sequelize
const count = await User.count({ where: { role: 'admin' } });
```

### 6. Update
```javascript
// Mongoose
const user = await User.findById(id);
user.name = 'New Name';
await user.save();
// atau
await User.updateOne({ _id: id }, { name: 'New Name' });

// Sequelize
const user = await User.findByPk(id);
user.name = 'New Name';
await user.save();
// atau
await User.update({ name: 'New Name' }, { where: { id } });
```

### 7. Delete
```javascript
// Mongoose
await User.findByIdAndDelete(id);
// atau
await User.deleteOne({ _id: id });

// Sequelize
await User.destroy({ where: { id } });
```

### 8. Populate / Include (Join)
```javascript
// Mongoose
const contract = await Contract.findById(id)
  .populate('template')
  .populate('submittedBy');

// Sequelize
const contract = await Contract.findByPk(id, {
  include: [
    { model: DocumentTemplate, as: 'template' },
    { model: User, as: 'submitter' }
  ]
});
```

### 9. Select Fields
```javascript
// Mongoose
const user = await User.findById(id).select('name email');
const user = await User.findById(id).select('+password'); // include hidden

// Sequelize
const user = await User.findByPk(id, {
  attributes: ['id', 'name', 'email']
});
const user = await User.scope('withPassword').findByPk(id);
```

### 10. Complex Queries (OR, AND, etc)
```javascript
// Mongoose
const contracts = await Contract.find({
  $or: [
    { status: 'pending' },
    { status: 'reviewed' }
  ]
});

// Sequelize
const { Op } = require('sequelize');
const contracts = await Contract.findAll({
  where: {
    [Op.or]: [
      { status: 'pending' },
      { status: 'reviewed' }
    ]
  }
});
```

### 11. Greater Than / Less Than
```javascript
// Mongoose
const contracts = await Contract.find({
  createdAt: { $gte: startDate, $lt: endDate }
});

// Sequelize
const { Op } = require('sequelize');
const contracts = await Contract.findAll({
  where: {
    createdAt: {
      [Op.gte]: startDate,
      [Op.lt]: endDate
    }
  }
});
```

## Sequelize Operators

```javascript
const { Op } = require('sequelize');

// Comparison
[Op.eq]: value          // = value
[Op.ne]: value          // != value
[Op.gt]: value          // > value
[Op.gte]: value         // >= value
[Op.lt]: value          // < value
[Op.lte]: value         // <= value
[Op.between]: [a, b]    // BETWEEN a AND b
[Op.notBetween]: [a, b] // NOT BETWEEN a AND b

// Logical
[Op.and]: [{}, {}]      // AND
[Op.or]: [{}, {}]       // OR
[Op.not]: {}            // NOT

// Pattern matching
[Op.like]: '%value%'    // LIKE '%value%'
[Op.notLike]: '%value%' // NOT LIKE '%value%'
[Op.iLike]: '%value%'   // ILIKE '%value%' (case insensitive)

// Arrays
[Op.in]: [1, 2, 3]      // IN (1, 2, 3)
[Op.notIn]: [1, 2, 3]   // NOT IN (1, 2, 3)
```

## Update Controllers - Contoh

### authController.js

```javascript
// SEBELUM (Mongoose)
const userExists = await User.findOne({ email });
const user = await User.findOne({ email }).select('+password');
const user = await User.findById(req.user.id);

// SESUDAH (Sequelize)
const userExists = await User.findOne({ where: { email } });
const user = await User.scope('withPassword').findOne({ where: { email } });
const user = await User.findByPk(req.user.id);
```

### userController.js

```javascript
// SEBELUM
const users = await User.find(query)
  .select('-password')
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });
const total = await User.countDocuments(query);

// SESUDAH
const users = await User.findAll({
  where: query,
  offset: skip,
  limit: limit,
  order: [['createdAt', 'DESC']]
});
const total = await User.count({ where: query });
```

### contractController.js

```javascript
// SEBELUM
const contract = await Contract.findById(id)
  .populate('template')
  .populate('submittedBy reviewer approver1 approver2');

// SESUDAH
const contract = await Contract.findByPk(id, {
  include: [
    { model: DocumentTemplate, as: 'template' },
    { model: User, as: 'submitter' },
    { model: User, as: 'reviewer' },
    { model: User, as: 'approver1' },
    { model: User, as: 'approver2' }
  ]
});
```

## Perubahan Field Names

Karena foreign key di Sequelize menggunakan nama yang lebih deskriptif:

| Model | Mongoose Field | Sequelize Field |
|-------|----------------|-----------------|
| Contract | `template` | `templateId` |
| Contract | `submittedBy` | `submittedById` |
| Contract | `reviewer` | `reviewerId` |
| Contract | `approver1` | `approver1Id` |
| Contract | `approver2` | `approver2Id` |
| Contract | `rejectedBy` | `rejectedById` |
| DocumentTemplate | `createdBy` | `createdBy` (sama) |
| DocumentTemplate | `updatedBy` | `updatedBy` (sama) |

**Penting**: Saat mengakses relasi, gunakan alias yang sudah didefinisikan di `models/index.js`:
```javascript
// Untuk mendapatkan data template
contract.template // otomatis included

// Untuk set foreign key saat create
Contract.create({
  templateId: templateId,  // gunakan templateId
  submittedById: userId    // gunakan submittedById
})
```

## Instalasi & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup PostgreSQL
```bash
# Buat database
createdb jh_contract_builder

# Atau via psql
psql -U postgres
CREATE DATABASE jh_contract_builder;
\q
```

### 3. Konfigurasi .env
Copy dan edit:
```bash
cp .env.example .env
# Edit DB_PASSWORD dan konfigurasi lainnya
```

### 4. Run Server
```bash
npm run dev
```

Server akan otomatis:
- Connect ke PostgreSQL
- Sync semua tables (create/alter)
- Siap menerima request

## Testing

### 1. Create Admin User (via Postman/curl)
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Admin",
  "email": "admin@jh.com",
  "password": "admin123",
  "role": "admin"
}
```

### 2. Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@jh.com",
  "password": "admin123"
}
```

### 3. Test Database
```bash
psql -U postgres -d jh_contract_builder

# List tables
\dt

# Check Users table
SELECT * FROM "Users";
```

## Troubleshooting

### Error: "relation does not exist"
- Database belum ter-sync
- Restart server untuk auto-sync
- Atau manual: `await syncDatabase({ force: true })` (WARNING: akan drop semua data!)

### Error: "column does not exist"
- Model definition tidak match dengan database
- Gunakan `alter: true` saat development: `syncDatabase({ alter: true })`

### Error: "password authentication failed"
- Check DB_PASSWORD di .env
- Check PostgreSQL user permissions

### Performance Issues
- Pastikan indexes ter-create (lihat model definitions)
- Gunakan `EXPLAIN ANALYZE` untuk query optimization
- Consider connection pooling (sudah configured di database.js)

## Data Migration

Jika Anda punya data di MongoDB yang perlu dimigrasikan:

1. Export data dari MongoDB
2. Transform ObjectId menjadi UUID
3. Adjust field names (\_id → id, submittedBy → submittedById, etc)
4. Import ke PostgreSQL menggunakan Sequelize

Script migration akan dibuat terpisah jika diperlukan.

## Best Practices

1. **Selalu gunakan transactions untuk operations yang kompleks**
```javascript
const t = await sequelize.transaction();
try {
  await User.create({ ... }, { transaction: t });
  await Contract.create({ ... }, { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

2. **Gunakan eager loading dengan bijak**
```javascript
// Good
const contracts = await Contract.findAll({
  include: [{ model: User, as: 'submitter', attributes: ['id', 'name', 'email'] }]
});

// Avoid N+1 queries
```

3. **Index optimization**
- Sudah ter-define di models
- Monitor dengan `EXPLAIN ANALYZE`

4. **Use raw queries untuk complex operations**
```javascript
const [results] = await sequelize.query(
  "SELECT * FROM \"Contracts\" WHERE status = :status",
  { replacements: { status: 'pending' } }
);
```

---

**Catatan**: Migration guide ini akan terus di-update seiring pengembangan sistem.
