# Contributing to JH Contract Builder

Terima kasih atas minat Anda untuk berkontribusi ke JH Contract Builder!

## Development Setup

1. Fork repository ini
2. Clone fork Anda: `git clone https://github.com/your-username/jh-contract-builder.git`
3. Install dependencies: `npm install` di folder backend dan frontend
4. Buat branch baru: `git checkout -b feature/nama-fitur`
5. Lakukan perubahan Anda
6. Test perubahan Anda
7. Commit: `git commit -m "Add: deskripsi perubahan"`
8. Push: `git push origin feature/nama-fitur`
9. Buat Pull Request

## Coding Standards

### Backend (Node.js)
- Gunakan ES6+ syntax
- Ikuti struktur MVC
- Tambahkan JSDoc comments untuk functions
- Gunakan async/await untuk asynchronous operations
- Handle errors dengan try-catch
- Validate input dengan express-validator
- Log aktivitas penting dengan winston

### Frontend (React)
- Gunakan functional components dengan hooks
- Follow React best practices
- Gunakan Material-UI components
- Implement responsive design
- Add PropTypes untuk type checking
- Use meaningful variable/function names

### Git Commit Messages
Format: `Type: Description`

Types:
- `Add`: Menambahkan fitur baru
- `Fix`: Memperbaiki bug
- `Update`: Mengupdate fitur yang ada
- `Refactor`: Refactoring code
- `Docs`: Update dokumentasi
- `Style`: Format, styling
- `Test`: Menambah tests
- `Chore`: Maintenance tasks

Contoh:
- `Add: user profile picture upload feature`
- `Fix: contract status not updating correctly`
- `Update: email notification template`
- `Docs: add API endpoint documentation`

## Testing

Sebelum submit PR, pastikan:
- [ ] Code berjalan tanpa error
- [ ] Fitur baru sudah ditest manually
- [ ] Tidak ada console.log yang tertinggal
- [ ] Code sudah diformat dengan baik
- [ ] Dokumentasi sudah diupdate jika perlu

## Pull Request Process

1. Update README.md jika ada perubahan pada API atau setup
2. Update CHANGELOG.md dengan deskripsi perubahan
3. PR akan di-review oleh maintainer
4. Address feedback jika ada
5. Setelah approved, PR akan di-merge

## Code Review

Code review akan memperhatikan:
- Code quality dan readability
- Security considerations
- Performance impact
- Compatibility dengan existing code
- Test coverage

## Questions?

Jika ada pertanyaan, silakan:
- Buka issue di GitHub
- Email ke: ignasius.frans@jhilltown.com

Terima kasih atas kontribusi Anda! 🙏
