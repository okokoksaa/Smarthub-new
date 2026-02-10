#!/bin/bash

# ============================================================================
# CDF SMART HUB - SEED DATA LOADER
# ============================================================================
# Purpose: Load administrative hierarchy seed data
# Version: 1.0.0
# ============================================================================

set -e  # Exit on any error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cdf_smarthub}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Banner
print_banner() {
    echo -e "${BLUE}"
    echo "============================================================================"
    echo "  CDF SMART HUB - SEED DATA LOADER"
    echo "============================================================================"
    echo -e "  Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    echo -e "  Timestamp: ${TIMESTAMP}"
    echo "============================================================================"
    echo -e "${NC}"
}

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "${BLUE}==== $1 ====${NC}"
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
    echo "  --help                  Show this help message"
    echo ""
}

# Test database connection
test_connection() {
    log_section "Testing Database Connection"

    export PGPASSWORD="$DB_PASSWORD"

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        log_info "✓ Database connection successful"
    else
        log_error "Failed to connect to database"
        exit 1
    fi

    echo ""
}

# Load a single seed data file
load_seed_file() {
    local seed_file=$1
    local seed_name=$(basename "$seed_file")

    log_info "Loading: $seed_name"

    export PGPASSWORD="$DB_PASSWORD"

    START_TIME=$(date +%s)

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -f "$seed_file"

    EXIT_CODE=$?
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    if [ $EXIT_CODE -eq 0 ]; then
        log_info "✓ $seed_name loaded successfully (${DURATION}s)"
        return 0
    else
        log_error "✗ Failed to load $seed_name"
        return 1
    fi
}

# Load all seed data files
load_all_seed_data() {
    log_section "Loading Seed Data"

    # Seed files in dependency order
    SEED_FILES=(
        "01_provinces.sql"
        "02_districts.sql"
        "03_constituencies.sql"
        "04_wards.sql"
    )

    TOTAL_FILES=${#SEED_FILES[@]}
    SUCCESSFUL=0
    FAILED=0

    for seed_file in "${SEED_FILES[@]}"; do
        seed_path="$seed_file"

        if [ ! -f "$seed_path" ]; then
            log_warn "Seed file not found: $seed_file (skipping)"
            continue
        fi

        if load_seed_file "$seed_path"; then
            ((SUCCESSFUL++))
        else
            ((FAILED++))
            log_error "Seed data loading stopped due to error in $seed_file"
            return 1
        fi
    done

    echo ""
    log_info "Loading Summary: $SUCCESSFUL successful, $FAILED failed out of $TOTAL_FILES"

    if [ $FAILED -gt 0 ]; then
        return 1
    fi

    echo ""
    return 0
}

# Refresh materialized views
refresh_views() {
    log_section "Refreshing Materialized Views"

    export PGPASSWORD="$DB_PASSWORD"

    log_info "Refreshing vw_administrative_hierarchy..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "SELECT refresh_administrative_hierarchy();" &> /dev/null

    if [ $? -eq 0 ]; then
        log_info "✓ Materialized views refreshed"
    else
        log_warn "Failed to refresh materialized views (may not exist yet)"
    fi

    echo ""
}

# Verify seed data
verify_seed_data() {
    log_section "Verifying Seed Data"

    export PGPASSWORD="$DB_PASSWORD"

    # Count provinces
    PROVINCE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM provinces WHERE is_active = true;" | xargs)
    log_info "Provinces: $PROVINCE_COUNT (expected: 10)"

    # Count districts
    DISTRICT_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM districts WHERE is_active = true;" | xargs)
    log_info "Districts: $DISTRICT_COUNT (expected: ~116)"

    # Count constituencies
    CONSTITUENCY_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM constituencies WHERE is_active = true;" | xargs)
    log_info "Constituencies: $CONSTITUENCY_COUNT (expected: 156)"

    # Count wards
    WARD_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM wards WHERE is_active = true;" | xargs)
    log_info "Wards: $WARD_COUNT (expected: ~624)"

    echo ""

    # Warnings
    if [ "$PROVINCE_COUNT" -ne 10 ]; then
        log_warn "Province count mismatch!"
    fi

    if [ "$DISTRICT_COUNT" -lt 100 ]; then
        log_warn "This appears to be a sample dataset. Full deployment requires all 116 districts."
    fi

    if [ "$CONSTITUENCY_COUNT" -lt 150 ]; then
        log_warn "This appears to be a sample dataset. Full deployment requires all 156 constituencies."
    fi

    if [ "$WARD_COUNT" -lt 600 ]; then
        log_warn "This appears to be a sample dataset. Full deployment requires all 624+ wards."
    fi

    echo ""
}

# Display sample data
display_sample_data() {
    log_section "Sample Data Preview"

    export PGPASSWORD="$DB_PASSWORD"

    echo ""
    log_info "Sample Provinces:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT code, name, capital, population FROM provinces ORDER BY name LIMIT 5;"

    echo ""
    log_info "Sample Constituencies:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT c.code, c.name, d.name AS district, p.name AS province
         FROM constituencies c
         JOIN districts d ON c.district_id = d.id
         JOIN provinces p ON d.province_id = p.id
         ORDER BY c.name LIMIT 5;"

    echo ""
}

# Main execution
main() {
    # Parse command line arguments
    parse_args "$@"

    # Print banner
    print_banner

    # Prompt for password if not provided
    if [ -z "$DB_PASSWORD" ]; then
        read -s -p "Enter database password: " DB_PASSWORD
        echo ""
    fi

    # Run loading steps
    test_connection
    load_all_seed_data || exit 1
    refresh_views
    verify_seed_data
    display_sample_data

    # Success message
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "  ✓ SEED DATA LOADING COMPLETED SUCCESSFULLY"
    echo "============================================================================"
    echo -e "${NC}"
    echo ""
    echo "Administrative Hierarchy Summary:"
    echo "  - Provinces: $PROVINCE_COUNT"
    echo "  - Districts: $DISTRICT_COUNT"
    echo "  - Constituencies: $CONSTITUENCY_COUNT"
    echo "  - Wards: $WARD_COUNT"
    echo ""
    echo "Next steps:"
    echo "  1. Create initial admin user"
    echo "  2. Configure application database connection"
    echo "  3. Start API services"
    echo ""
}

# Run main function
main "$@"
