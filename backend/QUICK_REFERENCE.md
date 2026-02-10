# CDF Smart Hub - Quick Reference Card

**One-page reference for developers**

---

## 🚀 Quick Start (5 Minutes)

```bash
cd backend
pnpm install
docker-compose up -d
cd database/migrations && ./deploy_database.sh
cd ../seed-data && ./load_seed_data.sh
cd ../../
cp .env.example .env
# Edit .env: Set JWT_SECRET and DB_PASSWORD
cd services/api-gateway && pnpm run start:dev
```

**Test**: http://localhost:3000/api/docs

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| POST | `/api/v1/auth/refresh` | Refresh token | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/logout` | Logout user | Yes |

### System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/health` | Health check | No |
| GET | `/api/v1/info` | System info | No |

---

## 🔑 Authentication Flow

### 1. Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "tenantScopeLevel": "CONSTITUENCY"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### 3. Use Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔐 User Roles

```typescript
enum UserRole {
  SYSTEM_ADMIN,        // Full system access
  MINISTRY,            // Ministry oversight
  AUDITOR_GENERAL,     // Audit access
  PLGO,                // Local government officer
  CDFC_CHAIR,          // MP (Constituency chair)
  CDFC_MEMBER,         // Committee member
  WDC_CHAIR,           // Ward chair
  WDC_MEMBER,          // Ward member
  TAC_MEMBER,          // Technical assessment
  FINANCE_OFFICER,     // Financial operations
  PROCUREMENT_OFFICER, // Procurement
  M_AND_E_OFFICER,     // Monitoring & evaluation
  CONTRACTOR,          // Service provider
  SUPPLIER,            // Goods provider
  CITIZEN              // Public access
}
```

---

## 🛠️ Development Commands

```bash
# Install
pnpm install

# Build
pnpm build

# Start (dev)
pnpm run start:dev

# Test
pnpm test
pnpm test:cov
pnpm test:e2e

# Lint
pnpm lint
pnpm lint:fix

# Format
pnpm format
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres

# Restart service
docker-compose restart api-gateway

# Remove all (including data)
docker-compose down -v
```

---

## 🗄️ Database Quick Access

### PostgreSQL

```bash
# Connect via psql
psql -h localhost -p 5432 -U postgres -d cdf_smarthub
# Password: postgres_dev_password

# Common queries
SELECT COUNT(*) FROM users;
SELECT * FROM provinces ORDER BY name;
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### pgAdmin
- URL: http://localhost:5050
- Email: `admin@cdf.local`
- Password: `admin`

---

## 🔧 Environment Variables (Key Ones)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cdf_smarthub
DB_PASSWORD=postgres_dev_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# API
API_GATEWAY_PORT=3000
NODE_ENV=development
```

---

## 📦 Service Ports

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| API Docs | 3000 | http://localhost:3000/api/docs |
| PostgreSQL | 5432 | localhost:5432 |
| pgAdmin | 5050 | http://localhost:5050 |
| Redis | 6379 | localhost:6379 |
| Redis Commander | 8081 | http://localhost:8081 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| MailHog | 8025 | http://localhost:8025 |
| Kafka | 9092 | localhost:9092 |

---

## 🎯 Common Tasks

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
cd database/migrations && ./deploy_database.sh
cd ../seed-data && ./load_seed_data.sh
```

### Create New Service
```bash
# Copy api-gateway structure
cp -r services/api-gateway services/new-service
cd services/new-service
# Update package.json name and scripts
pnpm install
```

### Unlock User Account
```sql
UPDATE users
SET is_locked = false, failed_login_attempts = 0
WHERE email = 'user@example.com';
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5432
kill -9 PID

# Or change Docker port
# Edit docker-compose.yml: "5433:5432"
```

### Cannot Connect to Database
```bash
# Check if running
docker-compose ps

# Check logs
docker-compose logs postgres

# Wait a few seconds for startup
```

### Permission Denied on Scripts
```bash
chmod +x database/migrations/deploy_database.sh
chmod +x database/seed-data/load_seed_data.sh
```

### API Gateway Won't Start
```bash
# Check .env file exists
ls -la .env

# Check JWT_SECRET is set
grep JWT_SECRET .env

# Clear node_modules
rm -rf node_modules && pnpm install
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `GETTING_STARTED.md` | Setup guide |
| `README.md` | Project overview |
| `FINAL_STATUS.md` | Current status |
| `DEPLOYMENT_CHECKLIST.md` | Deployment steps |
| `00_DEPLOYMENT_GUIDE.md` | Production deployment |
| `PROJECT_STATUS.md` | Technical specs |
| `SESSION_SUMMARY.md` | Work summary |

---

## 🔒 Security Checklist

### Development ✅
- [ ] Don't commit .env file
- [ ] Use strong passwords locally
- [ ] Keep dependencies updated
- [ ] Review code before commit

### Production ⚠️
- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (32+ chars)
- [ ] Enable SSL/TLS for database
- [ ] Use environment variables for secrets
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Security patches

---

## 🎓 Code Examples

### Using Guards
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SYSTEM_ADMIN, UserRole.FINANCE_OFFICER)
@Get('protected')
async protectedRoute(@Request() req) {
  return { user: req.user };
}
```

### Public Route
```typescript
@Public()
@Get('public')
async publicRoute() {
  return { message: 'No authentication required' };
}
```

### Get Current User
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user; // User from JWT
}
```

---

## ✅ Status Overview

| Component | Status |
|-----------|--------|
| Database | ✅ Complete (85+ tables) |
| Deployment Scripts | ✅ Complete |
| Docker Compose | ✅ Complete |
| API Gateway | ✅ Complete |
| Authentication | ✅ Complete (JWT + RBAC) |
| User Service | ⏳ Pending |
| Core Services | ⏳ Pending |
| Documentation | ✅ Complete |

---

**Quick Links**:
- API Docs: http://localhost:3000/api/docs
- Database GUI: http://localhost:5050
- Health Check: http://localhost:3000/api/v1/health

**Need Help?**: See `GETTING_STARTED.md` for detailed instructions.
