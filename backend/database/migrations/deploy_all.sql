-- ============================================================================
-- CDF SMART HUB - MASTER SQL DEPLOYMENT SCRIPT
-- ============================================================================
-- Purpose: Single-file deployment of entire database schema
-- Usage: psql -h localhost -U postgres -d cdf_smarthub -f deploy_all.sql
-- ============================================================================

\echo '============================================================================'
\echo 'CDF SMART HUB - DATABASE DEPLOYMENT'
\echo '============================================================================'
\echo 'Database: ' :DBNAME
\echo 'User: ' :USER
\echo 'Host: ' :HOST
\echo '============================================================================'
\echo ''

-- Stop on first error
\set ON_ERROR_STOP on

-- Set client encoding
SET client_encoding = 'UTF8';

-- Timing
\timing on

-- ============================================================================
-- SCHEMA 00: Extensions and Types
-- ============================================================================
\echo ''
\echo '==== Deploying: 00_extensions_and_types.sql ===='
\i ../schemas/00_extensions_and_types.sql
\echo '✓ Extensions and types deployed'

-- ============================================================================
-- SCHEMA 01: Tenant Hierarchy
-- ============================================================================
\echo ''
\echo '==== Deploying: 01_tenant_hierarchy.sql ===='
\i ../schemas/01_tenant_hierarchy.sql
\echo '✓ Tenant hierarchy deployed'

-- ============================================================================
-- SCHEMA 02: User and RBAC
-- ============================================================================
\echo ''
\echo '==== Deploying: 02_user_and_rbac.sql ===='
\i ../schemas/02_user_and_rbac.sql
\echo '✓ User and RBAC deployed'

-- ============================================================================
-- SCHEMA 03: Projects
-- ============================================================================
\echo ''
\echo '==== Deploying: 03_projects.sql ===='
\i ../schemas/03_projects.sql
\echo '✓ Projects deployed'

-- ============================================================================
-- SCHEMA 04: Financial Management
-- ============================================================================
\echo ''
\echo '==== Deploying: 04_financial_management.sql ===='
\i ../schemas/04_financial_management.sql
\echo '✓ Financial management deployed'

-- ============================================================================
-- SCHEMA 05: Documents and Workflow
-- ============================================================================
\echo ''
\echo '==== Deploying: 05_documents_and_workflow.sql ===='
\i ../schemas/05_documents_and_workflow.sql
\echo '✓ Documents and workflow deployed'

-- ============================================================================
-- SCHEMA 06: Committees and Programs
-- ============================================================================
\echo ''
\echo '==== Deploying: 06_committees_and_programs.sql ===='
\i ../schemas/06_committees_and_programs.sql
\echo '✓ Committees and programs deployed'

-- ============================================================================
-- SCHEMA 07: Audit and Compliance
-- ============================================================================
\echo ''
\echo '==== Deploying: 07_audit_and_compliance.sql ===='
\i ../schemas/07_audit_and_compliance.sql
\echo '✓ Audit and compliance deployed'

-- ============================================================================
-- SCHEMA 08: Notifications and Integrations
-- ============================================================================
\echo ''
\echo '==== Deploying: 08_notifications_and_integrations.sql ===='
\i ../schemas/08_notifications_and_integrations.sql
\echo '✓ Notifications and integrations deployed'

-- ============================================================================
-- SCHEMA 09: AI Services
-- ============================================================================
\echo ''
\echo '==== Deploying: 09_ai_services.sql ===='
\i ../schemas/09_ai_services.sql
\echo '✓ AI services deployed'

-- ============================================================================
-- SCHEMA 10: Public Portal
-- ============================================================================
\echo ''
\echo '==== Deploying: 10_public_portal.sql ===='
\i ../schemas/10_public_portal.sql
\echo '✓ Public portal deployed'

-- ============================================================================
-- DEPLOYMENT VERIFICATION
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo 'DEPLOYMENT VERIFICATION'
\echo '============================================================================'

-- Count tables
\echo ''
\echo 'Tables created:'
SELECT COUNT(*) AS table_count
FROM pg_tables
WHERE schemaname = 'public';

-- Count ENUM types
\echo ''
\echo 'ENUM types created:'
SELECT COUNT(*) AS enum_count
FROM pg_type
WHERE typcategory = 'E';

-- Count RLS-enabled tables
\echo ''
\echo 'Tables with Row-Level Security:'
SELECT COUNT(*) AS rls_table_count
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Count indexes
\echo ''
\echo 'Indexes created:'
SELECT COUNT(*) AS index_count
FROM pg_indexes
WHERE schemaname = 'public';

-- Count functions
\echo ''
\echo 'Functions created:'
SELECT COUNT(*) AS function_count
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Count triggers
\echo ''
\echo 'Triggers created:'
SELECT COUNT(*) AS trigger_count
FROM pg_trigger
WHERE tgrelid IN (
    SELECT oid FROM pg_class
    WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

-- Database size
\echo ''
\echo 'Database size:'
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- ============================================================================
-- LIST ALL TABLES
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo 'ALL TABLES IN DATABASE'
\echo '============================================================================'
SELECT
    schemaname,
    tablename,
    rowsecurity AS has_rls,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo '✓ DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY'
\echo '============================================================================'
\echo ''
\echo 'Next steps:'
\echo '  1. Load seed data (provinces, districts, constituencies, wards)'
\echo '  2. Create initial admin user account'
\echo '  3. Configure application database connection'
\echo '  4. Set up automated backups'
\echo '  5. Configure monitoring'
\echo ''
\echo 'For detailed instructions, see:'
\echo '  backend/database/migrations/00_DEPLOYMENT_GUIDE.md'
\echo ''
\echo '============================================================================'
