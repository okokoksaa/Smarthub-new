# CDF Smart Hub - Getting Started Guide

This guide will help you set up and run the CDF Smart Hub backend locally.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ LTS ([Download](https://nodejs.org/))
- **pnpm** 8+ ([Install](https://pnpm.io/installation))
- **Docker** & **Docker Compose** ([Install](https://docs.docker.com/get-docker/))
- **PostgreSQL Client (psql)** ([Install](https://www.postgresql.org/download/))
- **Git** ([Install](https://git-scm.com/downloads))

---

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Navigate to backend directory
cd backend

# Install dependencies (this will install for all workspaces)
pnpm install
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, Kafka, MinIO, etc.
docker-compose up -d

# Wait for PostgreSQL to be ready (check logs)
docker-compose logs -f postgres

# Once you see "database system is ready to accept connections", proceed
```

### 3. Deploy Database

```bash
# Navigate to migrations directory
cd database/migrations

# Run deployment script
./deploy_database.sh

# When prompted for password, enter: postgres_dev_password
```

Expected output:
```
============================================================================
  ✓ DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY
============================================================================
```

### 4. Load Seed Data

```bash
# Navigate to seed data directory
cd ../seed-data

# Run seed data loader
./load_seed_data.sh

# When prompted for password, enter: postgres_dev_password
```

Expected output:
```
============================================================================
  ✓ SEED DATA LOADING COMPLETED SUCCESSFULLY
============================================================================
Administrative Hierarchy Summary:
  - Provinces: 10
  - Districts: 100+
  - Constituencies: 50+
  - Wards: 100+
```

### 5. Configure Environment

```bash
# Navigate back to backend root
cd ../..

# Copy environment template
cp .env.example .env

# Edit .env file and set required values
# For local development, most defaults are fine
```

**Important environment variables to set**:
```env
# Database
DB_PASSWORD=postgres_dev_password

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

### 6. Start API Gateway

```bash
# Start API Gateway in development mode
cd services/api-gateway
pnpm run start:dev
```

Expected output:
```
=================================================
🚀 CDF Smart Hub API Gateway
=================================================
Environment: development
Port: 3000
API Base URL: http://localhost:3000/api/v1
Health Check: http://localhost:3000/api/v1/health
API Docs: http://localhost:3000/api/docs
=================================================
```

### 7. Test the API

Open your browser and navigate to:
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

Or use curl:
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Expected response:
# {"status":"healthy","timestamp":"...","service":"api-gateway","version":"1.0.0"}
```

---

## Development Workflow

### Starting Services

```bash
# Start all infrastructure (run once)
docker-compose up -d

# Start API Gateway (in one terminal)
cd services/api-gateway
pnpm run start:dev

# Start other services (in separate terminals, when ready)
cd services/user-service
pnpm run start:dev
```

### Stopping Services

```bash
# Stop API Gateway
# Press Ctrl+C in the terminal

# Stop all Docker services
docker-compose down

# Stop and remove all data (WARNING: deletes database data)
docker-compose down -v
```

### Viewing Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f kafka
```

---

## Accessing Services

### Infrastructure Services

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | User: `postgres`, Pass: `postgres_dev_password` |
| pgAdmin | http://localhost:5050 | Email: `admin@cdf.local`, Pass: `admin` |
| Redis | `localhost:6379` | No password |
| Redis Commander | http://localhost:8081 | No auth |
| MinIO Console | http://localhost:9001 | User: `minioadmin`, Pass: `minioadmin` |
| MinIO API | http://localhost:9000 | Same as console |
| MailHog (Email) | http://localhost:8025 | No auth |
| Kafka | `localhost:9092` | No auth |

### API Services

| Service | URL | Status |
|---------|-----|--------|
| API Gateway | http://localhost:3000 | ✅ Ready |
| API Docs (Swagger) | http://localhost:3000/api/docs | ✅ Ready |
| User Service | http://localhost:3001 | ⏳ Pending |
| Project Service | http://localhost:3002 | ⏳ Pending |
| Finance Service | http://localhost:3003 | ⏳ Pending |

---

## Testing the Authentication API

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+260977123456",
    "tenantScopeLevel": "CONSTITUENCY"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### 3. Access Protected Route

```bash
# Replace YOUR_TOKEN with the accessToken from login
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Database Management

### Connect to PostgreSQL

```bash
# Using psql
psql -h localhost -p 5432 -U postgres -d cdf_smarthub

# Password: postgres_dev_password
```

### Common Queries

```sql
-- Check all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Count users
SELECT COUNT(*) FROM users;

-- List provinces
SELECT * FROM provinces ORDER BY name;

-- Check database size
SELECT pg_size_pretty(pg_database_size('cdf_smarthub'));
```

### Using pgAdmin

1. Navigate to http://localhost:5050
2. Login with: `admin@cdf.local` / `admin`
3. Right-click "Servers" → "Create" → "Server"
4. General tab: Name: `CDF Local`
5. Connection tab:
   - Host: `postgres` (Docker service name)
   - Port: `5432`
   - Database: `cdf_smarthub`
   - Username: `postgres`
   - Password: `postgres_dev_password`

---

## Common Issues & Solutions

### Issue: "Port 5432 already in use"

**Solution**: You have PostgreSQL running locally. Either:
1. Stop local PostgreSQL: `sudo service postgresql stop`
2. Or change Docker port: Edit `docker-compose.yml` line `"5432:5432"` to `"5433:5432"` and update `.env` to use port 5433

### Issue: "Cannot connect to database"

**Solution**:
1. Check if PostgreSQL container is running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Wait a few seconds - PostgreSQL takes time to initialize

### Issue: "pnpm install fails"

**Solution**:
1. Clear cache: `pnpm store prune`
2. Delete node_modules: `rm -rf node_modules`
3. Try again: `pnpm install`

### Issue: "JWT_SECRET not defined"

**Solution**:
1. Make sure you copied `.env.example` to `.env`
2. Set `JWT_SECRET` in `.env` file
3. Restart API Gateway

### Issue: "Failed login attempts"

**Solution**:
The system locks accounts after 5 failed attempts. To unlock:
```sql
UPDATE users SET is_locked = false, failed_login_attempts = 0 WHERE email = 'user@example.com';
```

---

## Development Commands

### Build

```bash
# Build all services
pnpm run build

# Build specific service
cd services/api-gateway
pnpm run build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch

# Run e2e tests
pnpm test:e2e
```

### Linting & Formatting

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Database Operations

```bash
# Deploy database (fresh install)
cd database/migrations
./deploy_database.sh

# Load seed data
cd database/seed-data
./load_seed_data.sh

# Backup database
pg_dump -h localhost -U postgres -d cdf_smarthub > backup.sql

# Restore database
psql -h localhost -U postgres -d cdf_smarthub < backup.sql
```

---

## Project Structure

```
backend/
├── services/              # Microservices
│   ├── api-gateway/       # ✅ API Gateway (JWT auth, rate limiting)
│   ├── user-service/      # ⏳ User management
│   ├── project-service/   # ⏳ Project lifecycle
│   └── ...
├── shared/                # Shared code
│   ├── database/          # ✅ TypeORM entities, config
│   ├── config/            # Configuration
│   └── utils/             # Utilities
├── database/              # Database artifacts
│   ├── schemas/           # ✅ 10 SQL schema files
│   ├── migrations/        # ✅ Deployment scripts
│   └── seed-data/         # ✅ Seed data + loader
├── docker-compose.yml     # ✅ Local dev infrastructure
├── package.json           # ✅ Monorepo configuration
└── .env.example           # ✅ Environment variables template
```

---

## Next Steps

### For Developers

1. **Explore the API Documentation**: http://localhost:3000/api/docs
2. **Review Database Schema**: Check `database/schemas/` directory
3. **Read Architecture Docs**: See `README.md` and `PROJECT_STATUS.md`
4. **Start Building Services**: Copy `api-gateway` structure for new services

### For Administrators

1. **Review Deployment Guide**: `database/migrations/00_DEPLOYMENT_GUIDE.md`
2. **Follow Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
3. **Configure Production Environment**: Update `.env` with production values
4. **Set Up Monitoring**: Configure logging and alerting

---

## Need Help?

- **Documentation**: See `README.md`, `PROJECT_STATUS.md`, `SESSION_SUMMARY.md`
- **Deployment Issues**: Check `database/migrations/00_DEPLOYMENT_GUIDE.md`
- **API Questions**: Review Swagger docs at http://localhost:3000/api/docs
- **Database Issues**: See troubleshooting section in deployment guide

---

## Security Reminders

### Development Environment
- ✅ Default credentials are for local development only
- ✅ Docker Compose uses weak passwords - never use in production
- ✅ .env file is gitignored - keep it secure

### Production Environment
- ⚠️ Change all default passwords
- ⚠️ Generate strong JWT secrets (32+ characters)
- ⚠️ Enable SSL/TLS for database connections
- ⚠️ Use environment variables for secrets (never hardcode)
- ⚠️ Configure proper firewall rules
- ⚠️ Enable audit logging
- ⚠️ Regular security updates

---

**Happy Coding! 🚀**

For questions, check the documentation files or review the code comments.
