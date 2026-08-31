# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Jika Anda menemukan security vulnerability di JH Contract Builder, **JANGAN** membuat public issue.

Sebagai gantinya, silakan report melalui:

**Email**: security@jimbaranhijau.com

Sertakan informasi berikut:
- Deskripsi vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (jika ada)

## Security Best Practices

### For Deployment

1. **Environment Variables**
   - Jangan commit file .env
   - Gunakan strong JWT secret (minimum 32 characters)
   - Gunakan strong database passwords

2. **Database**
   - Enable MongoDB authentication
   - Gunakan SSL/TLS connection
   - Restrict network access
   - Regular backups

3. **Application**
   - Keep dependencies updated
   - Use HTTPS in production
   - Configure CORS properly
   - Implement rate limiting
   - Enable helmet.js security headers
   - Validate all user inputs

4. **File Uploads**
   - Validate file types
   - Scan for malware
   - Limit file sizes
   - Store files securely
   - Use separate storage bucket

5. **Authentication**
   - Use strong password policy
   - Implement password hashing (bcrypt)
   - Set appropriate JWT expiration
   - Implement refresh tokens
   - Consider 2FA for admin accounts

6. **Monitoring**
   - Enable application logging
   - Monitor failed login attempts
   - Set up alerts for suspicious activities
   - Regular security audits

### Known Security Considerations

1. **OpenAI API Key**: Store securely, never expose in frontend
2. **SMTP Credentials**: Use app passwords, not main passwords
3. **File Uploads**: Validate and sanitize uploaded files
4. **User Input**: Always validate and sanitize
5. **SQL Injection**: Using Mongoose helps prevent, but still validate

## Security Updates

Security updates akan di-release as soon as possible setelah vulnerability ditemukan dan dipatch.

Subscribe ke repository untuk mendapatkan notifikasi security updates.

## Audit History

- **2026-02-02**: Initial security review completed
- Next audit: TBD

---

**Last Updated**: 2026-02-02
