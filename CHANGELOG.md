# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-02

### 🔄 Major Changes - Database Migration

#### Changed
- **Database**: Migrated from MongoDB to PostgreSQL 16
- **ORM**: Replaced Mongoose with Sequelize 6.35.1
- **Primary Keys**: Changed from ObjectId to UUID
- **Flexible Fields**: Replaced arrays/objects with JSONB columns

#### Added
- Backend: Sequelize configuration (`src/config/database.js`)
- Backend: Model relationships file (`src/models/index.js`)
- Auto contract numbering (Format: JHC-YYYYMMDD-XXXX)
- Password scopes in User model
- Foreign key constraints for data integrity
- FULLTEXT indexes for search optimization
- Connection pooling configuration
- Documentation: 8 new comprehensive guides

#### Modified
- All 3 models converted to Sequelize (User, DocumentTemplate, Contract)
- Backend dependencies (removed mongoose, added sequelize/pg)
- Server.js for PostgreSQL connection
- Frontend package.json (fixed react-scripts version)
- README.md updated for PostgreSQL
- Environment variables (.env)

#### Fixed
- Frontend react-scripts version (was "^0.0.0", now "5.0.1")
- Frontend dependencies installation with --legacy-peer-deps
- Frontend production build successful

#### Removed
- mongoose@7.6.3 and all MongoDB dependencies

### ⚠️ Breaking Changes
- **NOT backwards compatible with MongoDB**
- Controllers still need manual update (pending)
- Data migration required for existing installations
- Different ID format (UUID vs ObjectId)

### 📚 Documentation Added
1. MONGODB_TO_POSTGRESQL_MIGRATION.md - Complete migration guide
2. POSTGRESQL_MIGRATION_STATUS.md - Status tracking
3. SYSTEM_STATUS.md - System overview
4. SYSTEM_ARCHITECTURE.md - Architecture diagrams
5. PROJECT_STRUCTURE_UPDATE.md - File status
6. FRONTEND_FIX_SUMMARY.md - Frontend fixes
7. START_HERE.md - Quick start guide
8. start-all.ps1 - Automated startup script

### 🎯 Migration Progress
- ✅ Database setup: 100%
- ✅ Models conversion: 100% (3/3)
- ✅ Frontend fixes: 100%
- ⏳ Controllers: 0% (0/6 - pending manual update)
- Overall: 50%

### 🔐 Security Improvements
- Foreign key constraints
- Unique constraints on email
- NOT NULL constraints
- UUID prevents enumeration attacks
- Parameterized queries via Sequelize

---

## [1.0.0] - 2026-02-02

### Added
- Initial release of JH Contract Builder
- Complete RBAC implementation with 6 roles (Admin, User, Staff, Supervisor, Manager, C-Level)
- Document scanning feature with AI support (OpenAI GPT-4)
- Multi-layer approval workflow (2-3 layers)
- Email notification system for approvers
- RESTful API with Express.js
- React.js frontend with Material-UI
- JWT authentication and authorization
- MongoDB database integration (REPLACED in v2.0.0)
- Document upload support (Word, PDF, Excel)
- Automatic form field generation from documents
- Approval matrix configuration
- Contract submission and tracking
- Digital signature support (placeholder)
- Responsive UI design
- Comprehensive API documentation
- Postman collection for API testing

### Security
- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Input validation with express-validator
- File upload security
- Helmet.js for security headers

### Features by Role
- **Admin**: Full system access, user management
- **User**: Submit contracts, view own submissions
- **Staff**: Submit and edit contracts, view own submissions
- **Supervisor**: Create/edit/delete templates, review contracts
- **Manager**: Approve contracts (layer 1), digital signature
- **C-Level**: Approve contracts (layer 1 or 2), digital signature

### Documentation
- Complete README.md
- Quick Start Guide
- API Documentation
- Postman collection
- Environment configuration examples

## [Unreleased]

### Planned Features
- Digital signature integration with third-party providers
- PDF document generation from form data
- Advanced reporting and analytics
- Audit trail and logging system
- File attachments for contracts
- Template versioning
- Bulk operations
- WebSocket for real-time notifications
- Mobile app (React Native)
- Multi-language support

---

For more details, see [README.md](README.md)
