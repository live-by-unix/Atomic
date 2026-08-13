# Atomic Chat Deployment Guide

## Table of Contents
- [Deployment Options](#deployment-options)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Backup and Recovery](#backup-and-recovery)
- [Security Considerations](#security-considerations)

## Deployment Options

### 1. Docker Deployment (Recommended)
- Easiest and most consistent
- Portable across environments
- Scales well with orchestration tools

### 2. Manual Deployment
- More control over configuration
- Suitable for simple setups
- Requires manual server management

### 3. Cloud Platform Deployment
- Managed services
- Auto-scaling capabilities
- Built-in monitoring

## Prerequisites

### For All Deployments
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)
- PostgreSQL database
- Server with minimum specs:
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage

### For Docker Deployment
- Docker installed (v20+)
- Docker Compose installed (v2+)
- 80GB available disk space

### For Manual Deployment
- Node.js v18+
- npm v9+
- PostgreSQL v15+
- Nginx (for reverse proxy)

## Environment Configuration

### Production Environment Variables

Create a `.env` file with production values:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/atomic_chat?schema=public

# JWT Configuration
JWT_SECRET=your-very-secure-random-secret-key-min-32-characters

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Best Practices

1. **JWT Secret**
   - Use a cryptographically secure random string
   - Minimum 32 characters
   - Store securely (environment variable or secret manager)
   - Rotate periodically

2. **Database Credentials**
   - Use strong passwords
   - Limit database user permissions
   - Use SSL for database connections
   - Regular password rotation

3. **Environment Variables**
   - Never commit `.env` files
   - Use secret managers (AWS Secrets Manager, HashiCorp Vault)
   - Encrypt sensitive data at rest
   - Audit access to secrets

## Docker Deployment

### 1. Build Docker Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build server
docker-compose build client
```

### 2. Configure Docker Compose

Update `docker-compose.yml` for production:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: atomic-chat-db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: atomic_chat
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: atomic-chat-server
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/atomic_chat?schema=public
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - voicemail_data:/app/voicemail
    restart: unless-stopped

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: atomic-chat-client
    environment:
      - VITE_API_URL=https://your-domain.com/api
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  postgres_data:
  voicemail_data:
```

### 3. Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 4. Configure Nginx (Optional)

For SSL termination and reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Client
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Server API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Manual Deployment

### 1. Server Setup

#### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE atomic_chat;
CREATE USER atomic_chat WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE atomic_chat TO atomic_chat;
\q
```

### 2. Deploy Application

#### Clone and Setup

```bash
# Clone repository
git clone <repository-url> /var/www/atomic-chat
cd /var/www/atomic-chat

# Install dependencies
npm run install:all

# Build shared types
cd shared && npm run build && cd ..

# Build server
cd server && npm run build && cd ..

# Build client
cd client && npm run build && cd ..
```

#### Configure Environment

```bash
# Create production .env
cat > .env << EOF
DATABASE_URL=postgresql://atomic_chat:secure_password@localhost:5432/atomic_chat?schema=public
JWT_SECRET=your-secure-secret-key
PORT=3001
NODE_ENV=production
EOF
```

#### Run Migrations

```bash
cd server
npx prisma migrate deploy
npx prisma generate
cd ..
```

### 3. Configure PM2

Create ecosystem file:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'atomic-chat-server',
      script: './server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

Start with PM2:

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 4. Configure Nginx

```nginx
# /etc/nginx/sites-available/atomic-chat
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Client static files
    location / {
        root /var/www/atomic-chat/client/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Voicemail files
    location /voicemail/ {
        alias /var/www/atomic-chat/server/voicemail/;
        internal;
    }
}
```

Enable site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/atomic-chat /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS

1. **Push Docker Images to ECR**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag atomic-chat-server:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/atomic-chat-server:latest
docker tag atomic-chat-client:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/atomic-chat-client:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/atomic-chat-server:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/atomic-chat-client:latest
```

2. **Create ECS Task Definition**
```json
{
  "family": "atomic-chat",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "server",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/atomic-chat-server:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:atomic-chat/database-url"
        }
      ]
    }
  ]
}
```

#### Using AWS Elastic Beanstalk

1. **Create application**
```bash
eb init atomic-chat
eb create production-env
```

2. **Configure deployment**
```yaml
# .ebextensions/deploy.config
container_commands:
  01_build_shared:
    command: "cd shared && npm install && npm run build"
  02_build_server:
    command: "cd server && npm install && npm run build"
  03_build_client:
    command: "cd client && npm install && npm run build"
```

### DigitalOcean Deployment

#### Using DigitalOcean App Platform

1. **Create appspec.yml**
```yaml
version: "1.0"

name: atomic-chat

services:
  - name: server
    github:
      repo: your-username/atomic-chat
      branch: main
    run_command: cd server && npm install && npm run build && npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_TIME
        type: SECRET
        value: your-secret-key

databases:
  - name: db
    engine: PG
    version: "15"
    production: true
```

### Heroku Deployment

#### Using Heroku

1. **Create Procfile**
```
web: cd server && npm start
```

2. **Deploy**
```bash
# Login to Heroku
heroku login

# Create app
heroku create atomic-chat

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

## Monitoring and Maintenance

### Application Monitoring

#### Health Checks

```bash
# Server health check
curl https://your-domain.com/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00Z"}
```

#### Log Monitoring

```bash
# Docker logs
docker-compose logs -f server
docker-compose logs -f client

# PM2 logs
pm2 logs atomic-chat-server

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Performance Monitoring

Install monitoring tools:

```bash
# PM2 Plus (for PM2)
pm2 plus

# New Relic (optional)
npm install newrelic
```

### Database Maintenance

#### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
mkdir -p $BACKUP_DIR

pg_dump -U atomic_chat atomic_chat > $BACKUP_DIR/atomic_chat_$DATE.sql

# Keep last 7 days
find $BACKUP_DIR -name "atomic_chat_*.sql" -mtime +7 -delete
```

#### Restore from Backup

```bash
# Restore database
psql -U atomic_chat atomic_chat < /backups/postgresql/atomic_chat_20240101_120000.sql
```

### Updates and Upgrades

#### Application Updates

```bash
# Docker deployment
docker-compose pull
docker-compose up -d

# Manual deployment
git pull origin main
npm run install:all
cd shared && npm run build && cd ..
cd server && npm run build && cd ..
cd client && npm run build && cd ..
pm2 restart atomic-chat-server
```

#### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

## Backup and Recovery

### Backup Strategy

#### Database Backups

```bash
# Manual backup
pg_dump -U atomic_chat atomic_chat > backup.sql

# Automated backup (cron)
0 2 * * * pg_dump -U atomic_chat atomic_chat > /backups/daily_$(date +\%Y\%m\%d).sql
```

#### File Backups

```bash
# Backup voicemail files
tar -czf voicemail_backup_$(date +%Y%m%d).tar.gz server/voicemail/

# Backup to cloud storage
aws s3 cp voicemail_backup.tar.gz s3://your-backup-bucket/
```

### Recovery Procedures

#### Database Recovery

```bash
# Restore from backup
psql -U atomic_chat atomic_chat < backup.sql

# Verify recovery
psql -U atomic_chat atomic_chat -c "SELECT COUNT(*) FROM users;"
```

#### Application Recovery

```bash
# Restore from backup
git checkout <commit-hash>
npm run install:all
npm run build
pm2 restart atomic-chat-server
```

## Security Considerations

### Network Security

#### Firewall Configuration

```bash
# Configure UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

#### SSL/TLS Configuration

- Use strong ciphers
- Enable HSTS
- Implement certificate pinning
- Regular certificate renewal

### Application Security

#### Security Headers

```nginx
# Add to Nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

#### Rate Limiting

- Configure appropriate rate limits
- Implement IP whitelisting for admin access
- Monitor for abuse patterns

### Data Security

#### Encryption

- Encrypt sensitive data at rest
- Use TLS for data in transit
- Implement secure key management

#### Access Control

- Implement role-based access control
- Regular access audits
- Principle of least privilege

## Troubleshooting

### Common Deployment Issues

#### Server Won't Start

```bash
# Check logs
pm2 logs atomic-chat-server

# Check port availability
netstat -tulpn | grep :3001

# Check environment variables
pm2 env 0
```

#### Database Connection Issues

```bash
# Test database connection
psql -U atomic_chat -h localhost -d atomic_chat

# Check PostgreSQL status
sudo systemctl status postgresql
```

#### SSL Certificate Issues

```bash
# Test SSL configuration
openssl s_client -connect your-domain.com:443

# Renew certificate
sudo certbot renew
```

### Performance Issues

#### High Memory Usage

```bash
# Check memory usage
pm2 mon

# Restart if needed
pm2 restart atomic-chat-server

# Adjust PM2 configuration
pm2 reload ecosystem.config.js --update-env
```

#### Slow Response Times

```bash
# Check database performance
psql -U atomic_chat -d atomic_chat -c "SELECT * FROM pg_stat_activity;"

# Check Nginx performance
sudo nginx -t
```

## Scaling Considerations

### Horizontal Scaling

#### Load Balancing

```nginx
# Nginx load balancer configuration
upstream atomic_chat_servers {
    server server1:3001;
    server server2:3001;
    server server3:3001;
}

server {
    location /api/ {
        proxy_pass http://atomic_chat_servers;
    }
}
```

#### Session Management

- Implement Redis for session storage
- Use sticky sessions for WebSocket connections
- Implement proper session cleanup

### Database Scaling

#### Read Replicas

```env
# Configure read replicas
DATABASE_URL=postgresql://user:pass@master-host/db
DATABASE_READ_URL=postgresql://user:pass@replica-host/db
```

#### Connection Pooling

```typescript
// Configure Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
});
```

## Cost Optimization

### Infrastructure Costs

#### Right-Sizing

- Monitor resource usage
- Adjust instance sizes accordingly
- Use spot instances for non-critical workloads

#### Cost Monitoring

- Set up billing alerts
- Use cost allocation tags
- Regular cost reviews

### Resource Optimization

#### Caching

- Implement Redis caching
- Cache static assets
- Use CDN for global distribution

#### Cleanup

- Regular log rotation
- Clean up old backups
- Remove unused resources

## Support and Maintenance

### Documentation

- Keep deployment documentation updated
- Document any custom configurations
- Maintain runbooks for common procedures

### Monitoring Alerts

- Set up monitoring alerts
- Configure notification channels
- Define escalation procedures

### Disaster Recovery

- Regular disaster recovery testing
- Maintain off-site backups
- Document recovery procedures

---

This deployment guide provides comprehensive instructions for deploying Atomic Chat in various environments. Choose the deployment method that best fits your infrastructure and requirements.
