# Project Structure Update - PostgreSQL Migration

## Database Technology Stack

### Before Migration
- **Database**: MongoDB 
- **ODM**: Mongoose
- **Schema**: Flexible document-based

### After Migration (Current)
- **Database**: PostgreSQL 16
- **ORM**: Sequelize 6.35.1
- **Schema**: Relational with JSONB for flexible fields

---

## Backend File Status

### ✅ Fully Converted to PostgreSQL

#### Configuration
- **backend/src/config/database.js** - NEW FILE
  - Sequelize connection setup
  - Connection pooling configuration
  - Database sync function

#### Models (All converted to Sequelize)
- **backend/src/models/index.js** - NEW FILE
  - Model relationships (associations)
  - Database sync with alter mode
  - Export all models

- **backend/src/models/User.js** - CONVERTED
  - UUID primary key
  - Password hashing hooks (beforeCreate, beforeUpdate)
  - Scopes for password inclusion/exclusion
  - Methods: comparePassword(), hasPermission()
  - Indexes: email (unique), role

- **backend/src/models/DocumentTemplate.js** - CONVERTED
  - UUID primary key
  - JSONB columns: fields, approvalMatrix
  - Fulltext indexes on templateName and description
  - Associations: belongsTo User, hasMany Contract

- **backend/src/models/Contract.js** - CONVERTED
  - UUID primary key
  - Auto contract number generation (JHC-YYYYMMDD-XXXX)
  - JSONB columns: contractData, approvalHistory
  - Static method: generateContractNumber()
  - Indexes: contractNumber (unique), status
  - Associations: belongsTo User & DocumentTemplate

#### Server Entry Point
- **backend/src/server.js** - CONVERTED
  - Replaced mongoose.connect() with sequelize.authenticate()
  - Added database sync on startup
  - async startServer() function

#### Dependencies
- **backend/package.json** - UPDATED
  - Removed: mongoose@7.6.3
  - Added: sequelize@6.35.1, pg@8.11.3, pg-hstore@2.3.4

#### Environment
- **backend/.env** - UPDATED
  - New variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
  - Removed: MONGODB_URI

---

## ⚠️ Needs Manual Conversion to Sequelize

### Controllers (Still using Mongoose syntax)

#### High Priority - Authentication & Users
- **backend/src/controllers/authController.js**
  - Lines using Mongoose:
    - `User.findOne()` for email lookup
    - `User.create()` for registration
    - `User.findById()` for user retrieval
  - Estimated queries: 7

- **backend/src/controllers/userController.js**
  - Lines using Mongoose:
    - `User.find()` with pagination
    - `User.countDocuments()`
    - `User.create()`
    - `User.findById()`
    - `User.findByIdAndUpdate()`
    - `User.findByIdAndDelete()`
  - Estimated queries: 8

#### Medium Priority - Documents & Contracts
- **backend/src/controllers/documentController.js**
  - Mongoose queries for DocumentTemplate CRUD
  - Population of related data
  - File upload handling (should work as-is)

- **backend/src/controllers/contractController.js**
  - Mongoose queries for Contract CRUD
  - Complex aggregations for statistics
  - Status updates and approval workflows

- **backend/src/controllers/approvalController.js**
  - Contract approval queries
  - History tracking
  - Email notifications (should work as-is)

#### Middleware
- **backend/src/middleware/auth.js**
  - `User.findById()` for token verification
  - Estimated queries: 1

---

## 📋 Conversion Checklist

### Completed ✅
- [x] Database configuration
- [x] User model
- [x] DocumentTemplate model  
- [x] Contract model
- [x] Model relationships
- [x] Server.js entry point
- [x] Package.json dependencies
- [x] Environment variables

### Pending ⚠️
- [ ] authController.js (7 queries)
- [ ] userController.js (8 queries)
- [ ] documentController.js
- [ ] contractController.js
- [ ] approvalController.js
- [ ] auth.js middleware (1 query)

### Not Required ✓
- routes/* (no database calls, only routing)
- utils/emailService.js (no database calls)
- utils/logger.js (no database calls)
- utils/documentScanner.js (no database calls)
- middleware/errorHandler.js (no database calls)
- middleware/upload.js (no database calls)

---

## 🔄 Common Mongoose → Sequelize Conversions

Refer to **MONGODB_TO_POSTGRESQL_MIGRATION.md** for detailed examples.

### Quick Reference

| Mongoose | Sequelize |
|----------|-----------|
| `Model.findOne({ email })` | `Model.findOne({ where: { email } })` |
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.find()` | `Model.findAll()` |
| `Model.create(data)` | `Model.create(data)` (same) |
| `Model.findByIdAndUpdate()` | `instance.update()` or `Model.update()` |
| `Model.findByIdAndDelete()` | `instance.destroy()` or `Model.destroy()` |
| `.populate('field')` | `{ include: [Model] }` |
| `.select('-password')` | `{ attributes: { exclude: ['password'] } }` |
| `.limit().skip()` | `{ limit, offset }` |
| `.sort({ field: -1 })` | `{ order: [['field', 'DESC']] }` |

---

## 📊 Database Schema Comparison

### User Table
```sql
-- MongoDB (document)
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String,
  createdAt: Date
}

-- PostgreSQL (table)
CREATE TABLE "Users" (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
CREATE INDEX idx_users_role ON "Users"(role);
```

### DocumentTemplate Table
```sql
-- MongoDB (document)
{
  _id: ObjectId,
  templateName: String,
  fields: Array,           # Flexible array
  approvalMatrix: Object,  # Flexible object
  createdBy: ObjectId
}

-- PostgreSQL (table)
CREATE TABLE "DocumentTemplates" (
  id UUID PRIMARY KEY,
  "templateName" VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL,           # JSONB for flexibility
  "approvalMatrix" JSONB NOT NULL, # JSONB for flexibility
  "createdBy" UUID REFERENCES "Users"(id),
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
CREATE INDEX idx_templates_name ON "DocumentTemplates"("templateName");
```

### Contract Table
```sql
-- MongoDB (document)
{
  _id: ObjectId,
  contractNumber: String,
  contractData: Object,       # Flexible
  approvalHistory: Array,     # Flexible
  status: String,
  templateId: ObjectId,
  createdBy: ObjectId
}

-- PostgreSQL (table)
CREATE TABLE "Contracts" (
  id UUID PRIMARY KEY,
  "contractNumber" VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  "contractData" JSONB NOT NULL,      # JSONB for flexibility
  "approvalHistory" JSONB NOT NULL,   # JSONB for flexibility
  status VARCHAR(20) NOT NULL,
  "templateId" UUID REFERENCES "DocumentTemplates"(id),
  "createdBy" UUID REFERENCES "Users"(id),
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
CREATE INDEX idx_contracts_number ON "Contracts"("contractNumber");
CREATE INDEX idx_contracts_status ON "Contracts"(status);
```

---

## 🚀 Migration Benefits

### Advantages of PostgreSQL
1. **Data Integrity**: Foreign keys enforce relationships
2. **ACID Compliance**: True transactions
3. **Performance**: Better query optimization
4. **JSONB**: Flexible fields where needed + indexing
5. **UUIDs**: Globally unique identifiers
6. **Full-text Search**: Built-in FULLTEXT indexes
7. **Type Safety**: Strong typing prevents errors

### Maintained Flexibility
- JSONB columns for dynamic fields (fields, approvalMatrix, contractData)
- Still allows schema evolution without major migrations
- Best of both worlds: Relational structure + Document flexibility

---

## 📚 Related Documentation

1. **MONGODB_TO_POSTGRESQL_MIGRATION.md**
   - Complete migration guide
   - 11 query conversion examples
   - Troubleshooting

2. **POSTGRESQL_MIGRATION_STATUS.md**
   - Status tracking
   - Quick reference cheat sheet

3. **SYSTEM_STATUS.md**
   - Overall system status
   - Next steps
   - Troubleshooting guide

4. **README.md**
   - Updated installation instructions
   - PostgreSQL setup
   - Environment variables

---

## ⚡ Quick Start After Migration

### Start Backend
```bash
cd backend
npm run dev
```
Backend will:
- Connect to PostgreSQL
- Auto-sync tables (with alter mode)
- Start on port 5000

### Check Database
```bash
psql -U postgres -d jh_contract_builder

\dt                    # List tables
\d "Users"            # Describe Users table
SELECT * FROM "Users"; # Query users
```

---

**Migration Status**: 50% Complete
- ✅ Models & Database: 100%
- ⏳ Controllers: 0% (pending manual conversion)
