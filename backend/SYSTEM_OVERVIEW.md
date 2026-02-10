# CDF Smart Hub - Complete System Overview

## Executive Summary

The CDF Smart Hub is a comprehensive cloud-based SaaS system designed for the Constituency Development Fund of Zambia. Built with zero-tolerance for corruption, the system implements rigorous dual-approval workflows, complete audit trails, and hierarchical access control across all 156 constituencies.

## System Architecture

### Microservices Architecture
```
┌─────────────────┐
│   API Gateway   │ :3000 - Entry point, JWT auth, rate limiting
└────────┬────────┘
         │
         ├──────────────────────────────────────────────┐
         │                │                 │           │
    ┌────▼─────┐   ┌──────▼──────┐   ┌────▼────┐  ┌───▼──────┐
    │   User   │   │   Project   │   │ Finance │  │ Document │
    │ Service  │   │   Service   │   │ Service │  │ Service  │
    │  :3001   │   │   :3002     │   │  :3003  │  │  :3004   │
    └────┬─────┘   └──────┬──────┘   └────┬────┘  └───┬──────┘
         │                │                │           │
         └────────────────┴────────────────┴───────────┘
                          │
                    ┌─────▼──────┐
                    │ PostgreSQL │
                    │  Database  │
                    └────────────┘
```

## Core Services

### 1. API Gateway (Port 3000)
**Purpose**: Centralized entry point for all client requests

**Features**:
- JWT authentication and authorization
- Request routing to microservices
- Rate limiting and throttling
- CORS configuration
- Request/response logging
- Error handling middleware

**Technologies**: NestJS, Passport JWT, Express Rate Limit

---

### 2. User Service (Port 3001)
**Purpose**: User management, authentication, and authorization

**Features**:
- User CRUD operations
- Password hashing (Argon2)
- Multi-Factor Authentication (TOTP)
- Role-Based Access Control (10 roles)
- Email verification
- Password reset
- Account locking
- Session management

**Key Entities**:
- Users
- Roles
- Sessions
- MFA secrets

**Security**:
- Argon2 password hashing
- TOTP-based MFA with QR codes
- 10 backup codes per user
- Account lockout after 5 failed attempts
- Password strength validation

---

### 3. Project Service (Port 3002)
**Purpose**: Project lifecycle management

**Features**:
- Project CRUD operations
- Dual approval workflow (CDFC + TAC)
- Milestone tracking
- Budget allocation
- Project status management
- Hierarchical access control

**Key Entities**:
- Projects
- Milestones
- Budget allocations

**Workflow**:
```
DRAFT → SUBMITTED → CDFC_APPROVED → TAC_APPROVED → ACTIVE → COMPLETED
```

**Business Rules**:
- CDFC approval required first
- TAC approval required after CDFC
- Both approvals needed for project activation
- Complete audit trail

---

### 4. Finance Service (Port 3003)
**Purpose**: Payment processing with dual-approval workflow

**Features**:
- Payment creation and tracking
- Dual approval system (Panel A + Panel B)
- Budget utilization tracking
- Payment execution
- Complete audit trail

**Key Entities**:
- Payments
- Approvals
- Audit logs

**CRITICAL Dual-Approval Workflow**:
```
DRAFT → PENDING → PANEL_A_APPROVED → PANEL_B_APPROVED → EXECUTING → EXECUTED
                                                                  ↓
                                                            COMPLETED
```

**Security Measures**:
1. Panel A (CDFC) approval required first
2. Panel B (TAC) approval required after Panel A
3. Both approvals required before execution
4. Budget check before payment
5. Cannot bypass approval sequence
6. Complete audit trail with timestamps

---

### 5. Document Service (Port 3004)
**Purpose**: File management with versioning

**Features**:
- Document upload/download
- Version control
- MinIO object storage
- File validation (50MB limit)
- SHA-256 checksums
- Presigned URLs
- Approval workflow
- Access control levels

**Key Entities**:
- Documents
- Document versions

**Storage**:
- MinIO (S3-compatible)
- Bucket: cdf-documents
- Versioning enabled
- Lifecycle policies

**Supported File Types**:
- PDF
- Images (JPEG, PNG)
- Word documents
- Excel spreadsheets
- Videos (MP4, MPEG)

---

### 6. Notification Service (Port 3005)
**Purpose**: Multi-channel notifications

**Features**:
- Email notifications (SMTP)
- SMS notifications (Twilio)
- Push notifications (Firebase)
- In-app notifications
- Template system (Handlebars)
- Queue processing (Bull/Redis)
- Retry mechanism
- Priority levels

**Key Entities**:
- Notifications
- Templates

**Channels**:
1. **EMAIL**: HTML/text with templates
2. **SMS**: Twilio integration
3. **PUSH**: Firebase Cloud Messaging
4. **IN_APP**: Real-time feed

**Notification Categories**:
- Project updates
- Payment approvals
- Document notifications
- Budget alerts
- System alerts

---

## Shared Infrastructure

### Database (PostgreSQL 16)
**Purpose**: Centralized data storage

**Schemas**:
1. Users & Authentication
2. Administrative Hierarchy
3. Projects & Milestones
4. Budget & Finance
5. Audit & Compliance
6. Documents
7. Notifications

**Row-Level Security (RLS)**:
- Province-level access
- District-level access
- Constituency-level access
- Ward-level access

**Key Features**:
- Foreign key constraints
- Check constraints
- Triggers for audit logging
- Indexes for performance
- JSONB for metadata

---

### Redis
**Purpose**: Caching and queue management

**Usage**:
- Bull queue for notifications
- Session storage
- Rate limiting counters
- Cache for frequently accessed data

---

### MinIO
**Purpose**: Object storage for documents

**Configuration**:
- S3-compatible API
- Bucket: cdf-documents
- Versioning enabled
- Lifecycle: Delete old versions after 90 days

---

## Administrative Hierarchy

### Structure
```
9 Provinces
 └── 80+ Districts
      └── 156 Constituencies
           └── 1,560+ Wards
```

### Access Control Rules

| Role | Province | District | Constituency | Ward |
|------|----------|----------|--------------|------|
| **SUPER_ADMIN** | All | All | All | All |
| **PS** | All | All | All | All |
| **CDFC_MEMBER** | Assigned | All in province | All in province | All in province |
| **TAC_MEMBER** | All | All | All | All |
| **MP** | - | - | Assigned only | All in constituency |
| **WDC_MEMBER** | - | - | - | Assigned only |
| **CONTRACTOR** | - | - | Project's | Project's |

### Implementation
- Database migration: `006_administrative_hierarchy_and_rls.sql`
- Seed data: `001_administrative_hierarchy.sql`
- 156 constituencies seeded
- RLS policies enforce access

---

## Security Features

### Authentication
- JWT tokens (1h expiry)
- Refresh tokens (7d expiry)
- MFA with TOTP
- Password reset tokens (15m expiry)

### Authorization
- Role-Based Access Control (RBAC)
- Hierarchical permissions
- Row-Level Security (RLS)
- Document access levels

### Data Protection
- Argon2 password hashing
- Encrypted secrets in Kubernetes
- HTTPS/TLS in production
- Database encryption at rest

### Audit Trail
- All operations logged
- Timestamps and user tracking
- Immutable audit logs
- Compliance reports

---

## Anti-Corruption Measures

### 1. Dual-Approval Workflow
**Critical for Payments**:
- Panel A (CDFC) approves first
- Panel B (TAC) approves second
- Both required before execution
- Cannot bypass sequence
- Complete audit trail

**Tested Extensively**:
- 70+ unit tests for payment workflow
- Tests for bypass attempts
- Regression tests

### 2. Complete Audit Trail
- Every action logged
- Who, what, when, where
- Immutable logs
- Timestamped entries

### 3. Hierarchical Access Control
- Ward members see only their ward
- MPs see only their constituency
- No cross-constituency access
- RLS enforcement at database level

### 4. Budget Controls
- Budget allocation tracked
- Utilization monitored
- Alerts for low budget
- Prevents overspending

### 5. Document Integrity
- SHA-256 checksums
- Version tracking
- Approval workflow
- Access control

---

## Testing

### Comprehensive Test Suite
**200+ Unit Tests**:
- User Service: 85+ tests
- Password Service: 45+ tests
- MFA Service: 40+ tests
- Project Service: 60+ tests
- Milestone Service: 45+ tests
- Budget Service: 55+ tests
- Payment Service: 70+ tests (CRITICAL)

**Key Test Areas**:
1. **Dual-Approval Workflow**:
   - Panel B cannot approve without Panel A
   - Payment cannot execute without both approvals
   - Budget checked before payment
   - Rejection workflow tested

2. **Security**:
   - Password hashing validation
   - MFA token verification
   - JWT authentication
   - Access control enforcement

3. **Business Logic**:
   - Project approval sequence
   - Budget allocation and utilization
   - Milestone completion
   - Document versioning

**Run Tests**:
```bash
pnpm test
pnpm test:cov  # With coverage
```

---

## Deployment

### Docker Images
- Multi-stage builds
- Non-root containers
- Health checks
- Minimal Alpine base

**Services**:
- `Dockerfile.api-gateway`
- `Dockerfile.user-service`
- `Dockerfile.project-service`
- `Dockerfile.finance-service`
- `Dockerfile.document-service`
- `Dockerfile.notification-service`

### Kubernetes
**Components**:
- Namespace: `cdf-smarthub`
- PostgreSQL StatefulSet with persistence
- Redis Deployment
- MinIO StatefulSet
- 6 Service Deployments
- HPA (2-10 replicas)
- Ingress with TLS

**Deployments**:
- `kubernetes/namespace.yaml`
- `kubernetes/configmap.yaml`
- `kubernetes/secrets.yaml`
- `kubernetes/postgres-statefulset.yaml`
- `kubernetes/redis-deployment.yaml`
- `kubernetes/minio-deployment.yaml`
- `kubernetes/api-gateway-deployment.yaml`
- `kubernetes/user-service-deployment.yaml`
- `kubernetes/project-service-deployment.yaml`
- `kubernetes/finance-service-deployment.yaml`
- `kubernetes/document-service-deployment.yaml`
- `kubernetes/notification-service-deployment.yaml`
- `kubernetes/ingress.yaml`

### CI/CD Pipeline
**GitHub Actions**:
1. Run tests
2. Build Docker images
3. Push to registry
4. Deploy to Kubernetes
5. Run migrations
6. Verify deployment
7. Rollback on failure

**File**: `.github/workflows/deploy.yml`

---

## Database Schema

### Key Tables

#### Users & Auth
- `users` - User accounts
- `roles` - Role definitions
- `user_sessions` - Active sessions
- `mfa_secrets` - MFA configurations

#### Administrative
- `provinces` - 9 provinces
- `districts` - 80+ districts
- `constituencies` - 156 constituencies
- `wards` - 1,560+ wards
- `user_administrative_scope` - User assignments

#### Projects
- `projects` - Project records
- `milestones` - Project milestones
- `budget_allocations` - Budget tracking

#### Finance
- `payments` - Payment records
- `payment_approvals` - Approval tracking
- `audit_logs` - Financial audit trail

#### Documents
- `documents` - Document metadata
- Document versions (parent-child)

#### Notifications
- `notifications` - Notification records

### Migrations
1. `001_users_and_auth.sql`
2. `002_administrative_structure.sql`
3. `003_projects_and_milestones.sql`
4. `004_budget_and_finance.sql`
5. `005_audit_and_compliance.sql`
6. `006_administrative_hierarchy_and_rls.sql`

### Seeds
1. `001_administrative_hierarchy.sql` - 156 constituencies

---

## API Documentation

### Swagger/OpenAPI
Each service exposes Swagger documentation:

- API Gateway: `http://localhost:3000/api/docs`
- User Service: `http://localhost:3001/api/docs`
- Project Service: `http://localhost:3002/api/docs`
- Finance Service: `http://localhost:3003/api/docs`
- Document Service: `http://localhost:3004/api/docs`
- Notification Service: `http://localhost:3005/api/docs`

---

## Monitoring & Health Checks

### Health Endpoints
All services expose:
```http
GET /health

Response:
{
  "status": "ok",
  "service": "service-name",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Kubernetes Probes
- Liveness probe: `/health`
- Readiness probe: `/health`
- 30s interval
- 5s timeout

### Logging
- Structured JSON logs
- Log levels: DEBUG, INFO, WARN, ERROR
- Request/response logging
- Error stack traces

---

## Performance Considerations

### Database
- Connection pooling
- Indexes on foreign keys
- Composite indexes for queries
- Query optimization

### Caching
- Redis for sessions
- Template caching
- Presigned URL caching

### Queue Processing
- Bull queue for notifications
- Priority-based processing
- Retry with exponential backoff

### Auto-Scaling
- HPA based on CPU/Memory
- Min 2 replicas
- Max 10 replicas
- 70% CPU threshold

---

## Environment Variables

### Common Variables
```bash
NODE_ENV=production
DB_HOST=postgres-service
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=***
DB_DATABASE=cdf_smarthub
REDIS_HOST=redis-service
REDIS_PORT=6379
JWT_SECRET=***
JWT_EXPIRES_IN=1h
```

### Service-Specific
See individual service READMEs for complete environment variable lists.

---

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 16
- Redis 7+
- Docker (optional)
- Kubernetes (optional)

### Quick Start
```bash
# Install dependencies
pnpm install

# Build shared modules
pnpm --filter @shared/database build

# Run database migrations
psql -U postgres -d cdf_smarthub -f database/migrations/001_users_and_auth.sql
# ... run all migrations

# Start services
pnpm --filter api-gateway dev
pnpm --filter user-service dev
pnpm --filter project-service dev
pnpm --filter finance-service dev
pnpm --filter document-service dev
pnpm --filter notification-service dev
```

---

## Production Deployment

### Prerequisites
- Kubernetes cluster
- PostgreSQL 16 (managed or StatefulSet)
- Redis 7+ (managed or Deployment)
- MinIO or S3-compatible storage
- Container registry
- Domain with TLS certificate

### Deployment Steps

1. **Create Secrets**:
```bash
kubectl create secret generic cdf-smarthub-secrets \
  --from-literal=DB_PASSWORD=*** \
  --from-literal=JWT_SECRET=*** \
  --from-literal=SMTP_PASS=*** \
  --from-literal=TWILIO_AUTH_TOKEN=*** \
  --from-literal=MINIO_ACCESS_KEY=*** \
  --from-literal=MINIO_SECRET_KEY=*** \
  -n cdf-smarthub
```

2. **Deploy Infrastructure**:
```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/postgres-statefulset.yaml
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/minio-deployment.yaml
```

3. **Wait for Infrastructure**:
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n cdf-smarthub --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n cdf-smarthub --timeout=300s
kubectl wait --for=condition=ready pod -l app=minio -n cdf-smarthub --timeout=300s
```

4. **Run Migrations**:
```bash
kubectl exec -n cdf-smarthub postgres-0 -- psql -U postgres -d cdf_smarthub -f /migrations/001_users_and_auth.sql
# ... run all migrations
```

5. **Deploy Services**:
```bash
kubectl apply -f kubernetes/api-gateway-deployment.yaml
kubectl apply -f kubernetes/user-service-deployment.yaml
kubectl apply -f kubernetes/project-service-deployment.yaml
kubectl apply -f kubernetes/finance-service-deployment.yaml
kubectl apply -f kubernetes/document-service-deployment.yaml
kubectl apply -f kubernetes/notification-service-deployment.yaml
```

6. **Deploy Ingress**:
```bash
kubectl apply -f kubernetes/ingress.yaml
```

---

## File Structure

```
backend/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── database/
│   ├── migrations/             # SQL migrations (7 files)
│   └── seeds/                  # Seed data (1 file)
├── shared/
│   └── database/               # Shared TypeORM entities
│       ├── src/entities/       # 14 entity files
│       └── package.json
├── services/
│   ├── api-gateway/           # Port 3000
│   ├── user-service/          # Port 3001
│   ├── project-service/       # Port 3002
│   ├── finance-service/       # Port 3003
│   ├── document-service/      # Port 3004
│   └── notification-service/  # Port 3005
├── kubernetes/                 # K8s manifests (13 files)
├── Dockerfile.*               # 6 Dockerfiles
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Documentation Files

- `SYSTEM_OVERVIEW.md` - This file
- `TESTING_GUIDE.md` - Testing documentation
- `HIERARCHICAL_ACCESS_CONTROL.md` - Access control guide
- `KUBERNETES_DEPLOYMENT_GUIDE.md` - Deployment guide
- `services/*/README.md` - Service-specific docs

---

## Next Steps

### Immediate
1. Set up production infrastructure
2. Configure secrets
3. Deploy to staging environment
4. Run end-to-end tests
5. Security audit

### Short-term
1. Frontend development
2. Mobile app development
3. User training
4. Data migration from legacy system

### Long-term
1. Analytics dashboard
2. Reporting module
3. Mobile apps (iOS/Android)
4. Integration with payment gateways
5. Biometric authentication

---

## Support & Maintenance

### Monitoring
- Application logs
- Error tracking (Sentry recommended)
- Performance monitoring (New Relic/DataDog recommended)
- Uptime monitoring

### Backups
- Daily PostgreSQL backups
- Document storage backups
- Configuration backups
- Disaster recovery plan

### Updates
- Security patches monthly
- Feature releases quarterly
- Database migrations as needed

---

## Compliance & Standards

### Security
- OWASP Top 10 compliance
- PCI DSS (for payments)
- GDPR (data protection)

### Code Quality
- ESLint
- Prettier
- TypeScript strict mode
- Unit test coverage > 80%

### Documentation
- API documentation (Swagger)
- Code documentation (JSDoc)
- Architecture diagrams
- User manuals

---

## Contact & Credits

**System**: CDF Smart Hub
**Version**: 1.0.0
**Built for**: Constituency Development Fund - Republic of Zambia
**Architecture**: Microservices with NestJS
**Database**: PostgreSQL 16
**Deployment**: Kubernetes

---

## License

Proprietary - Constituency Development Fund, Republic of Zambia

---

**Built with zero-tolerance for corruption.**
