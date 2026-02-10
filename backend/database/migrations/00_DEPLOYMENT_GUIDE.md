# CDF Smart Hub - Database Deployment Guide

## Overview

This directory contains SQL migration scripts for deploying the CDF Smart Hub database schema to PostgreSQL 16+.

---

## Prerequisites

### Software Requirements
- **PostgreSQL**: Version 16 or higher
- **Database Extensions**:
  - `uuid-ossp` - UUID generation
  - `pgcrypto` - Cryptographic functions
  - `pg_trgm` - Fuzzy text search
  - `btree_gist` - Advanced indexing
  - `tablefunc` - Pivot tables for reporting
  - `earthdistance` (optional) - Geographic distance calculations
  - `cube` (optional) - For earthdistance

### Database Setup
```sql
-- Create database
CREATE DATABASE cdf_smarthub
    ENCODING 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE template0;

-- Connect to database
\c cdf_smarthub

-- Create application user
CREATE ROLE cdf_app_user WITH LOGIN PASSWORD 'STRONG_PASSWORD_HERE';

-- Create read-only user for reporting
CREATE ROLE cdf_readonly_user WITH LOGIN PASSWORD 'STRONG_PASSWORD_HERE';
```

---

## Deployment Order

The schemas **must** be deployed in the following order due to foreign key dependencies:

1. **00_extensions_and_types.sql** - Foundation: Extensions, ENUMs, security functions
2. **01_tenant_hierarchy.sql** - Administrative hierarchy (provinces → districts → constituencies → wards)
3. **02_user_and_rbac.sql** - Users, roles, permissions, authentication
4. **03_projects.sql** - Project lifecycle management
5. **04_financial_management.sql** - Budgets, payments, reconciliation
6. **05_documents_and_workflow.sql** - Document storage, workflow engine, meetings
7. **06_committees_and_programs.sql** - Committees, bursaries, empowerment programs, contractors
8. **07_audit_and_compliance.sql** - Immutable audit logs, compliance reporting
9. **08_notifications_and_integrations.sql** - Notifications, external system integrations
10. **09_ai_services.sql** - AI models, inference logging, anomaly detection
11. **10_public_portal.sql** - Public transparency portal

---

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

Use the master deployment script:

```bash
# Navigate to migrations directory
cd backend/database/migrations

# Make script executable
chmod +x deploy_database.sh

# Run deployment
./deploy_database.sh

# With custom database connection
./deploy_database.sh \
  --host localhost \
  --port 5432 \
  --database cdf_smarthub \
  --username postgres
```

### Method 2: Manual Deployment

Execute each schema file in order:

```bash
# Connect to database
psql -h localhost -p 5432 -U postgres -d cdf_smarthub

# Execute schemas in order
\i ../schemas/00_extensions_and_types.sql
\i ../schemas/01_tenant_hierarchy.sql
\i ../schemas/02_user_and_rbac.sql
\i ../schemas/03_projects.sql
\i ../schemas/04_financial_management.sql
\i ../schemas/05_documents_and_workflow.sql
\i ../schemas/06_committees_and_programs.sql
\i ../schemas/07_audit_and_compliance.sql
\i ../schemas/08_notifications_and_integrations.sql
\i ../schemas/09_ai_services.sql
\i ../schemas/10_public_portal.sql
```

### Method 3: Using Docker

```bash
# Using provided Docker Compose
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Run migrations
docker exec -i cdf-postgres psql -U postgres -d cdf_smarthub < deploy_all.sql
```

---

## Post-Deployment Steps

### 1. Verify Installation

```sql
-- Check all tables are created
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should return 60+ tables

-- Check all ENUMs are created
SELECT typname
FROM pg_type
WHERE typcategory = 'E'
ORDER BY typname;

-- Should return 25+ ENUM types

-- Verify Row-Level Security is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- Should return 20+ tables with RLS enabled
```

### 2. Create First Admin User

```sql
-- Insert system admin (you'll need to generate a proper bcrypt hash)
INSERT INTO users (
    email,
    password_hash,
    salt,
    first_name,
    last_name,
    role,
    tenant_scope_level,
    is_active,
    is_verified,
    email_verified_at
) VALUES (
    'admin@cdf.gov.zm',
    '$2a$10$HASHED_PASSWORD_HERE',  -- Generate using bcrypt
    'RANDOM_SALT_HERE',
    'System',
    'Administrator',
    'SYSTEM_ADMIN',
    'NATIONAL',
    true,
    true,
    NOW()
);
```

### 3. Grant Application Permissions

```sql
-- Grant permissions to application user
GRANT CONNECT ON DATABASE cdf_smarthub TO cdf_app_user;
GRANT USAGE ON SCHEMA public TO cdf_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cdf_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cdf_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cdf_app_user;

-- Grant read-only permissions to reporting user
GRANT CONNECT ON DATABASE cdf_smarthub TO cdf_readonly_user;
GRANT USAGE ON SCHEMA public TO cdf_readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cdf_readonly_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO cdf_readonly_user;

-- Make grants apply to future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cdf_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO cdf_readonly_user;
```

### 4. Load Seed Data

```bash
# Load administrative hierarchy data
psql -U postgres -d cdf_smarthub -f ../seed-data/01_provinces.sql
psql -U postgres -d cdf_smarthub -f ../seed-data/02_districts.sql
psql -U postgres -d cdf_smarthub -f ../seed-data/03_constituencies.sql
psql -U postgres -d cdf_smarthub -f ../seed-data/04_wards.sql

# Refresh materialized view
psql -U postgres -d cdf_smarthub -c "SELECT refresh_administrative_hierarchy();"
```

### 5. Configure Application Connection

Update your application's database configuration:

```typescript
// NestJS TypeORM Configuration
{
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'cdf_app_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cdf_smarthub',

  // SSL Configuration (required for production)
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  },

  // Connection Pool
  poolSize: 20,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Enable query logging in development
  logging: process.env.NODE_ENV === 'development',

  // Synchronize: false (use migrations only)
  synchronize: false,

  // Migration settings
  migrationsRun: false,
  migrations: ['dist/database/migrations/*.js'],
}
```

---

## Row-Level Security (RLS) Configuration

### Setting Session Context

Before executing any queries, the application **must** set the current user context:

```sql
-- Set current user context (called after authentication)
SET LOCAL app.current_user_id = 'uuid-of-authenticated-user';
SET LOCAL app.current_user_role = 'CDFC_CHAIR';
SET LOCAL app.current_user_constituencies = 'uuid1,uuid2,uuid3';
```

This can be automated using database middleware:

```typescript
// NestJS Interceptor Example
@Injectable()
export class RlsContextInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JWT

    if (user) {
      await this.connection.query(`
        SET LOCAL app.current_user_id = '${user.id}';
        SET LOCAL app.current_user_role = '${user.role}';
        SET LOCAL app.current_user_constituencies = '${user.constituencies.join(',')}';
      `);
    }

    return next.handle();
  }
}
```

---

## Backup & Recovery

### Daily Backup

```bash
#!/bin/bash
# daily_backup.sh

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cdf_smarthub_${DATE}.sql.gz"

# Full database backup
pg_dump -h localhost -U postgres -d cdf_smarthub \
  --clean --if-exists --create \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Backup audit logs separately (for WORM storage)
pg_dump -h localhost -U postgres -d cdf_smarthub \
  --table=audit_log \
  | gzip > "${BACKUP_DIR}/audit_log_${DATE}.sql.gz"

# Upload to S3 with Object Lock
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" \
  s3://cdf-smarthub-backups/daily/ \
  --storage-class GLACIER

# Retain local backups for 7 days
find "${BACKUP_DIR}" -name "cdf_smarthub_*.sql.gz" -mtime +7 -delete
```

### Point-in-Time Recovery (PITR)

Enable Write-Ahead Log (WAL) archiving:

```sql
-- postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://cdf-smarthub-wal-archive/%f'
max_wal_senders = 5
```

---

## Performance Tuning

### Recommended PostgreSQL Configuration

```ini
# postgresql.conf (for production with 16GB RAM)

# Memory Settings
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# Query Planner
random_page_cost = 1.1  # For SSD storage
effective_io_concurrency = 200

# Write Ahead Log
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# Connection Settings
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'ddl'
log_min_duration_statement = 1000  # Log queries > 1 second
```

### Maintenance Tasks

```bash
# Weekly VACUUM and ANALYZE
psql -U postgres -d cdf_smarthub -c "VACUUM ANALYZE;"

# Refresh materialized views (daily)
psql -U postgres -d cdf_smarthub -c "SELECT refresh_administrative_hierarchy();"
psql -U postgres -d cdf_smarthub -c "SELECT refresh_public_portal_views();"

# Update table statistics (weekly)
psql -U postgres -d cdf_smarthub -c "ANALYZE;"

# Reindex (monthly)
psql -U postgres -d cdf_smarthub -c "REINDEX DATABASE cdf_smarthub;"
```

---

## Monitoring Queries

### Check Database Size

```sql
SELECT
    pg_size_pretty(pg_database_size('cdf_smarthub')) AS database_size,
    pg_size_pretty(pg_total_relation_size('audit_log')) AS audit_log_size,
    pg_size_pretty(pg_total_relation_size('projects')) AS projects_size;
```

### Check Active Connections

```sql
SELECT
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query,
    state_change
FROM pg_stat_activity
WHERE datname = 'cdf_smarthub'
ORDER BY state_change DESC;
```

### Check Slow Queries

```sql
SELECT
    calls,
    total_exec_time,
    mean_exec_time,
    query
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'cdf_smarthub')
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Check RLS Policy Usage

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Troubleshooting

### Issue: RLS Policies Blocking Queries

**Symptom**: Queries return empty results even though data exists.

**Solution**: Verify session context is set correctly:

```sql
-- Check current context
SELECT current_user_id(), current_user_role(), current_user_constituencies();

-- Temporarily disable RLS for debugging (NEVER in production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Issue: Slow Query Performance

**Symptom**: Queries taking > 1 second.

**Solution**:
1. Run `EXPLAIN ANALYZE` on the slow query
2. Check for missing indexes
3. Verify statistics are up to date: `ANALYZE table_name;`
4. Consider creating a covering index

### Issue: Audit Log Hash Chain Broken

**Symptom**: Integrity check fails.

**Solution**:
```sql
-- Find the broken link
SELECT
    a1.audit_entry_number,
    a1.current_entry_hash,
    a2.previous_entry_hash,
    a1.current_entry_hash = a2.previous_entry_hash AS is_valid
FROM audit_log a1
JOIN audit_log a2 ON a2.audit_entry_number = a1.audit_entry_number + 1
WHERE a1.current_entry_hash <> a2.previous_entry_hash
ORDER BY a1.audit_entry_number;

-- This indicates tampering - escalate to security team immediately
```

---

## Security Hardening

### SSL/TLS Configuration

```sql
-- Require SSL connections
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
ALTER SYSTEM SET ssl_ca_file = '/path/to/ca.crt';

-- Force SSL for application user
ALTER ROLE cdf_app_user SET ssl = 'on';
```

### Password Policies

```sql
-- Enforce strong passwords
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Lockout after failed attempts (via pg_hba.conf)
-- auth-timeout=5
-- auth-failed-lockout=3
```

### Audit All Connections

```sql
-- postgresql.conf
log_connections = on
log_disconnections = on
log_hostname = on
```

---

## Contact & Support

**Database Administrator**: CDF Smart Hub DevOps Team
**Email**: devops@cdf-smarthub.gov.zm
**Emergency Hotline**: +260-XXX-XXXXXX

**Escalation Path**:
1. Application Support Team
2. Database Administrator
3. Infrastructure Team Lead
4. CTO / System Architect

---

## Version History

| Version | Date       | Changes                          | Author          |
|---------|------------|----------------------------------|-----------------|
| 1.0.0   | 2024-XX-XX | Initial database schema release  | System Architect|

---

**IMPORTANT SECURITY NOTES**:
- Never deploy to production without changing default passwords
- Always use SSL/TLS for database connections
- Regularly backup audit logs to immutable storage (S3 Object Lock)
- Monitor failed login attempts and unusual query patterns
- Keep PostgreSQL updated with latest security patches
