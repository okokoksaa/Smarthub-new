#!/bin/bash

# ============================================================================
# CDF SMART HUB - DATABASE DEPLOYMENT SCRIPT
# ============================================================================
# Purpose: Automated deployment of PostgreSQL database schema
# Version: 1.0.0
# Author: CDF Smart Hub Development Team
# ============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cdf_smarthub}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"
SCHEMA_DIR="../schemas"
LOG_DIR="./logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/deployment_${TIMESTAMP}.log"

# Banner
print_banner() {
    echo -e "${BLUE}"
    echo "============================================================================"
    echo "  CDF SMART HUB - DATABASE DEPLOYMENT"
    echo "============================================================================"
    echo -e "  Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    echo -e "  User: ${DB_USER}"
    echo -e "  Timestamp: ${TIMESTAMP}"
    echo "============================================================================"
    echo -e "${NC}"
}

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "${LOG_FILE}"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_FILE}"
}

log_section() {
    echo -e "${BLUE}==== $1 ====${NC}" | tee -a "${LOG_FILE}"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --host)
                DB_HOST="$2"
                shift 2
                ;;
            --port)
                DB_PORT="$2"
                shift 2
                ;;
            --database)
                DB_NAME="$2"
                shift 2
                ;;
            --username)
                DB_USER="$2"
                shift 2
                ;;
            --password)
                DB_PASSWORD="$2"
                shift 2
                ;;
            --schema-dir)
                SCHEMA_DIR="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --host <hostname>       Database host (default: localhost)"
    echo "  --port <port>           Database port (default: 5432)"
    echo "  --database <dbname>     Database name (default: cdf_smarthub)"
    echo "  --username <user>       Database user (default: postgres)"
    echo "  --password <password>   Database password (default: prompt)"
    echo "  --schema-dir <path>     Path to schema directory (default: ../schemas)"
    echo "  --help                  Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --host localhost --database cdf_smarthub --username postgres"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"

    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        log_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    log_info "✓ PostgreSQL client (psql) found: $(psql --version)"

    # Check if schema directory exists
    if [ ! -d "$SCHEMA_DIR" ]; then
        log_error "Schema directory not found: $SCHEMA_DIR"
        exit 1
    fi
    log_info "✓ Schema directory found: $SCHEMA_DIR"

    # Count schema files
    SCHEMA_COUNT=$(ls -1 "$SCHEMA_DIR"/*.sql 2>/dev/null | wc -l)
    if [ "$SCHEMA_COUNT" -eq 0 ]; then
        log_error "No SQL schema files found in $SCHEMA_DIR"
        exit 1
    fi
    log_info "✓ Found $SCHEMA_COUNT schema files"

    # Create log directory if it doesn't exist
    mkdir -p "$LOG_DIR"
    log_info "✓ Log directory ready: $LOG_DIR"

    echo ""
}

# Test database connection
test_connection() {
    log_section "Testing Database Connection"

    export PGPASSWORD="$DB_PASSWORD"

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" &> /dev/null; then
        log_info "✓ Database connection successful"
    else
        log_error "Failed to connect to database"
        log_error "Connection string: postgresql://$DB_USER@$DB_HOST:$DB_PORT/postgres"
        exit 1
    fi

    # Check PostgreSQL version
    PG_VERSION=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SHOW server_version;" | xargs)
    log_info "PostgreSQL version: $PG_VERSION"

    # Verify version is 16+
    PG_MAJOR_VERSION=$(echo "$PG_VERSION" | cut -d'.' -f1)
    if [ "$PG_MAJOR_VERSION" -lt 16 ]; then
        log_warn "PostgreSQL version is below 16. Some features may not work correctly."
    fi

    echo ""
}

# Check if database exists, create if not
ensure_database() {
    log_section "Ensuring Database Exists"

    export PGPASSWORD="$DB_PASSWORD"

    DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c \
        "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" | xargs)

    if [ "$DB_EXISTS" = "1" ]; then
        log_warn "Database '$DB_NAME' already exists"
        read -p "Do you want to continue? This will modify the existing database. (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    else
        log_info "Creating database '$DB_NAME'..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
            "CREATE DATABASE $DB_NAME ENCODING 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';" \
            >> "$LOG_FILE" 2>&1

        if [ $? -eq 0 ]; then
            log_info "✓ Database created successfully"
        else
            log_error "Failed to create database"
            exit 1
        fi
    fi

    echo ""
}

# Deploy a single schema file
deploy_schema() {
    local schema_file=$1
    local schema_name=$(basename "$schema_file")

    log_info "Deploying: $schema_name"

    export PGPASSWORD="$DB_PASSWORD"

    START_TIME=$(date +%s)

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -f "$schema_file" \
        >> "$LOG_FILE" 2>&1

    EXIT_CODE=$?
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    if [ $EXIT_CODE -eq 0 ]; then
        log_info "✓ $schema_name deployed successfully (${DURATION}s)"
        return 0
    else
        log_error "✗ Failed to deploy $schema_name"
        log_error "Check log file for details: $LOG_FILE"
        return 1
    fi
}

# Deploy all schema files in order
deploy_schemas() {
    log_section "Deploying Database Schemas"

    # Schema files in dependency order
    SCHEMAS=(
        "00_extensions_and_types.sql"
        "01_tenant_hierarchy.sql"
        "02_user_and_rbac.sql"
        "03_projects.sql"
        "04_financial_management.sql"
        "05_documents_and_workflow.sql"
        "06_committees_and_programs.sql"
        "07_audit_and_compliance.sql"
        "08_notifications_and_integrations.sql"
        "09_ai_services.sql"
        "10_public_portal.sql"
        "11_public_holidays.sql"
    )

    TOTAL_SCHEMAS=${#SCHEMAS[@]}
    SUCCESSFUL=0
    FAILED=0

    for schema in "${SCHEMAS[@]}"; do
        schema_path="$SCHEMA_DIR/$schema"

        if [ ! -f "$schema_path" ]; then
            log_warn "Schema file not found: $schema (skipping)"
            continue
        fi

        if deploy_schema "$schema_path"; then
            ((SUCCESSFUL++))
        else
            ((FAILED++))
            log_error "Deployment stopped due to error in $schema"
            return 1
        fi
    done

    echo ""
    log_info "Deployment Summary: $SUCCESSFUL successful, $FAILED failed out of $TOTAL_SCHEMAS"

    if [ $FAILED -gt 0 ]; then
        return 1
    fi

    echo ""
    return 0
}

# Verify deployment
verify_deployment() {
    log_section "Verifying Deployment"

    export PGPASSWORD="$DB_PASSWORD"

    # Count tables
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" | xargs)
    log_info "Tables created: $TABLE_COUNT"

    if [ "$TABLE_COUNT" -lt 60 ]; then
        log_warn "Expected at least 60 tables, found $TABLE_COUNT"
    else
        log_info "✓ Table count looks good"
    fi

    # Count ENUM types
    ENUM_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_type WHERE typcategory = 'E';" | xargs)
    log_info "ENUM types created: $ENUM_COUNT"

    if [ "$ENUM_COUNT" -lt 25 ]; then
        log_warn "Expected at least 25 ENUM types, found $ENUM_COUNT"
    else
        log_info "✓ ENUM type count looks good"
    fi

    # Count RLS enabled tables
    RLS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;" | xargs)
    log_info "Tables with Row-Level Security: $RLS_COUNT"

    if [ "$RLS_COUNT" -lt 15 ]; then
        log_warn "Expected at least 15 RLS-enabled tables, found $RLS_COUNT"
    else
        log_info "✓ RLS count looks good"
    fi

    # Count indexes
    INDEX_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)
    log_info "Indexes created: $INDEX_COUNT"

    # Count functions
    FUNCTION_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');" | xargs)
    log_info "Functions created: $FUNCTION_COUNT"

    # Count triggers
    TRIGGER_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'));" | xargs)
    log_info "Triggers created: $TRIGGER_COUNT"

    # Check database size
    DB_SIZE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
    log_info "Database size: $DB_SIZE"

    echo ""
}

# Generate deployment report
generate_report() {
    log_section "Deployment Report"

    REPORT_FILE="${LOG_DIR}/deployment_report_${TIMESTAMP}.txt"

    cat > "$REPORT_FILE" << EOF
============================================================================
CDF SMART HUB - DATABASE DEPLOYMENT REPORT
============================================================================

Deployment Timestamp: ${TIMESTAMP}
Database: ${DB_NAME}
Host: ${DB_HOST}:${DB_PORT}
User: ${DB_USER}

============================================================================
DEPLOYMENT SUMMARY
============================================================================

Status: SUCCESS
Total Schemas Deployed: 11
Duration: See individual schema timings in log file

============================================================================
DATABASE STATISTICS
============================================================================

Tables: $TABLE_COUNT
ENUM Types: $ENUM_COUNT
RLS-Enabled Tables: $RLS_COUNT
Indexes: $INDEX_COUNT
Functions: $FUNCTION_COUNT
Triggers: $TRIGGER_COUNT
Database Size: $DB_SIZE

============================================================================
NEXT STEPS
============================================================================

1. Load seed data for administrative hierarchy (provinces, districts, constituencies, wards)
2. Create initial admin user account
3. Configure application database connection
4. Set up automated backups
5. Configure monitoring and alerting
6. Review Row-Level Security policies
7. Test authentication and authorization

For detailed instructions, see:
  backend/database/migrations/00_DEPLOYMENT_GUIDE.md

============================================================================
LOG FILES
============================================================================

Full deployment log: ${LOG_FILE}
Deployment report: ${REPORT_FILE}

============================================================================
EOF

    log_info "Deployment report generated: $REPORT_FILE"
    echo ""

    # Display the report
    cat "$REPORT_FILE"
}

# Cleanup on error
cleanup_on_error() {
    log_error "Deployment failed. Check log file: $LOG_FILE"
    exit 1
}

# Main execution
main() {
    # Setup error handler
    trap cleanup_on_error ERR

    # Parse command line arguments
    parse_args "$@"

    # Print banner
    print_banner

    # Prompt for password if not provided
    if [ -z "$DB_PASSWORD" ]; then
        read -s -p "Enter database password: " DB_PASSWORD
        echo ""
    fi

    # Run deployment steps
    check_prerequisites
    test_connection
    ensure_database
    deploy_schemas || exit 1
    verify_deployment
    generate_report

    # Success message
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "  ✓ DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY"
    echo "============================================================================"
    echo -e "${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review the deployment report: ${REPORT_FILE}"
    echo "  2. Load seed data: cd ../seed-data && ./load_seed_data.sh"
    echo "  3. Create admin user"
    echo "  4. Configure application connection"
    echo ""
}

# Run main function
main "$@"
