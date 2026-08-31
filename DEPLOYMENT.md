# Deployment Guide - JH Contract Builder

Panduan untuk deploy JH Contract Builder ke production server.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [SSL Configuration](#ssl-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ / CentOS 7+ / Windows Server 2019+
- Minimum 2GB RAM
- 20GB storage
- Node.js 16+
- MongoDB 5+
- Nginx (recommended untuk reverse proxy)

### Domain & SSL
- Domain name (contoh: contract.jimbaranhijau.com)
- SSL certificate (Let's Encrypt / CloudFlare / Commercial)

---

## Server Setup

### 1. Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

### 3. Install MongoDB
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.version()"
```

### 4. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 5. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Database Setup

### 1. Secure MongoDB
```bash
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password_here",
  roles: ["root"]
})

# Create application database and user
use jh_contract_builder
db.createUser({
  user: "jh_app_user",
  pwd: "app_password_here",
  roles: [
    { role: "readWrite", db: "jh_contract_builder" }
  ]
})

exit
```

### 2. Enable Authentication
```bash
sudo nano /etc/mongod.conf

# Add security section
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### 3. Test Connection
```bash
mongosh -u jh_app_user -p app_password_here --authenticationDatabase jh_contract_builder
```

---

## Backend Deployment

### 1. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/your-org/jh-contract-builder.git
cd jh-contract-builder
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install --production
```

### 3. Configure Environment
```bash
sudo nano .env

# Production configuration
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://jh_app_user:app_password_here@localhost:27017/jh_contract_builder?authSource=jh_contract_builder
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@jimbaranhijau.com
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=https://contract.jimbaranhijau.com
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/www/jh-contract-builder/backend/uploads
```

### 4. Create Uploads Directory
```bash
mkdir -p /var/www/jh-contract-builder/backend/uploads
chmod 755 /var/www/jh-contract-builder/backend/uploads
```

### 5. Start Backend with PM2
```bash
pm2 start src/server.js --name jh-backend
pm2 save
pm2 startup
```

### 6. Verify Backend
```bash
pm2 status
pm2 logs jh-backend

# Test API
curl http://localhost:5000/health
```

---

## Frontend Deployment

### 1. Install Frontend Dependencies
```bash
cd /var/www/jh-contract-builder/frontend
npm install
```

### 2. Configure Environment
```bash
nano .env

# Production configuration
REACT_APP_API_URL=https://contract.jimbaranhijau.com/api
REACT_APP_NAME=JH Contract Builder
```

### 3. Build Frontend
```bash
npm run build

# Build akan ada di folder 'build/'
```

### 4. Copy to Nginx Directory
```bash
sudo cp -r build/* /var/www/html/contract/
sudo chown -R www-data:www-data /var/www/html/contract
```

---

## SSL Configuration

### 1. Install Certbot (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d contract.jimbaranhijau.com
```

### 3. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/jh-contract-builder

# Add configuration:
server {
    listen 80;
    server_name contract.jimbaranhijau.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name contract.jimbaranhijau.com;

    ssl_certificate /etc/letsencrypt/live/contract.jimbaranhijau.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contract.jimbaranhijau.com/privkey.pem;

    # Frontend
    root /var/www/html/contract;
    index index.html;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    client_max_body_size 20M;
}
```

### 4. Enable Site and Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/jh-contract-builder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Monitoring & Maintenance

### 1. Setup PM2 Monitoring
```bash
pm2 install pm2-logrotate

# Set log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
```

### 2. Monitor Application
```bash
# View logs
pm2 logs jh-backend

# Monitor resources
pm2 monit

# View process info
pm2 info jh-backend
```

### 3. Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongodb.sh

#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://jh_app_user:app_password_here@localhost:27017/jh_contract_builder?authSource=jh_contract_builder" --out="$BACKUP_DIR/$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

# Make executable
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### 4. SSL Certificate Renewal
```bash
# Auto-renewal is setup by certbot
# Test renewal
sudo certbot renew --dry-run
```

### 5. Update Application
```bash
# Pull latest changes
cd /var/www/jh-contract-builder
sudo git pull

# Update backend
cd backend
npm install --production
pm2 restart jh-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo cp -r build/* /var/www/html/contract/
```

### 6. Setup Firewall
```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## Health Checks

### Backend Health
```bash
curl https://contract.jimbaranhijau.com/api/health
```

### Expected Response:
```json
{
  "status": "OK",
  "message": "JH Contract Builder API is running"
}
```

### Check PM2 Status
```bash
pm2 status
```

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check MongoDB Status
```bash
sudo systemctl status mongod
```

---

## Troubleshooting

### Backend not starting
```bash
pm2 logs jh-backend
# Check for error messages
```

### Database connection error
```bash
# Test MongoDB connection
mongosh -u jh_app_user -p --authenticationDatabase jh_contract_builder

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Nginx 502 Bad Gateway
```bash
# Check backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew
```

---

## Performance Optimization

### 1. Enable Gzip Compression (Nginx)
```nginx
# Add to nginx.conf
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 2. Enable Caching
```nginx
# Add to server block
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. MongoDB Indexing
```javascript
// Create indexes for better performance
db.contracts.createIndex({ contractNumber: 1 })
db.contracts.createIndex({ status: 1, createdAt: -1 })
db.contracts.createIndex({ submittedBy: 1 })
db.users.createIndex({ email: 1 })
```

---

## Security Checklist

- [ ] MongoDB authentication enabled
- [ ] Strong passwords for all accounts
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] JWT secret is strong and unique
- [ ] SMTP credentials secured
- [ ] File upload validation in place
- [ ] Regular backups scheduled
- [ ] Logs rotation configured
- [ ] Application running under non-root user
- [ ] Rate limiting configured (optional)
- [ ] CORS properly configured

---

## Support

Untuk bantuan deployment:
- Email: support@jimbaranhijau.com
- Documentation: https://github.com/your-org/jh-contract-builder

---

**Last Updated**: 2026-02-02
