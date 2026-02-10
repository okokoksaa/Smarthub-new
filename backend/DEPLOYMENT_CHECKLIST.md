# CDF Smart Hub - Backend Deployment Checklist

## Overview

This checklist guides you through the complete deployment of the CDF Smart Hub backend infrastructure.

---

## Phase 1: Database Setup ✓

### 1.1 PostgreSQL Installation

- [ ] Install PostgreSQL 16+ on target server
- [ ] Configure PostgreSQL for production (see `database/migrations/00_DEPLOYMENT_GUIDE.md`)
- [ ] Enable required extensions
- [ ] Configure SSL/TLS connections
- [ ] Set up connection pooling

### 1.2 Database Deployment

- [ ] Review database schemas in `database/schemas/`
- [ ] Run deployment script:
  ```bash
  cd database/migrations
  ./deploy_database.sh --host <host> --database cdf_smarthub --username postgres
  ```
- [ ] Verify all tables created (60+ tables expected)
- [ ] Verify Row-Level Security enabled on sensitive tables
- [ ] Check audit log hash chain integrity

### 1.3 Seed Data Loading

- [ ] Review seed data files in `database/seed-data/`
- [ ] Load administrative hierarchy:
  ```bash
  cd database/seed-data
  ./load_seed_data.sh --host <host> --database cdf_smarthub
  ```
- [ ] Verify counts:
  - 10 provinces ✓
  - 116 districts ✓
  - 156 constituencies ✓
  - 624+ wards ✓

### 1.4 Initial Admin User

- [ ] Generate secure bcrypt password hash
- [ ] Create first SYSTEM_ADMIN user:
  ```sql
  INSERT INTO users (email, password_hash, salt, first_name, last_name, role, tenant_scope_level, is_active, is_verified)
  VALUES ('admin@cdf.gov.zm', '$2a$10$...', 'salt', 'System', 'Admin', 'SYSTEM_ADMIN', 'NATIONAL', true, true);
  ```
- [ ] Test login with admin credentials

---

## Phase 2: Backend Services (In Progress)

### 2.1 Environment Setup

- [ ] Install Node.js 20+ LTS
- [ ] Install pnpm or yarn
- [ ] Install Docker and Docker Compose
- [ ] Clone repository
- [ ] Install dependencies:
  ```bash
  cd backend
  pnpm install
  ```

### 2.2 Environment Configuration

- [ ] Copy `.env.example` to `.env`
- [ ] Configure database connection:
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=cdf_smarthub
  DB_USERNAME=cdf_app_user
  DB_PASSWORD=<secure_password>
  DB_SSL_ENABLED=true
  ```
- [ ] Configure JWT secrets:
  ```env
  JWT_SECRET=<generate_256_bit_secret>
  JWT_REFRESH_SECRET=<generate_256_bit_secret>
  JWT_EXPIRATION=1h
  JWT_REFRESH_EXPIRATION=7d
  ```
- [ ] Configure AWS/Azure credentials
- [ ] Configure S3/MinIO for document storage
- [ ] Configure Redis connection
- [ ] Configure Kafka brokers
- [ ] Configure SMS/Email providers

### 2.3 Microservices Development

#### API Gateway Service
- [ ] Create NestJS API Gateway
- [ ] Implement JWT authentication middleware
- [ ] Set up rate limiting
- [ ] Configure CORS
- [ ] Add request/response logging
- [ ] Implement circuit breakers

#### User Service
- [ ] User authentication (login/logout)
- [ ] User registration with email verification
- [ ] Password reset flow
- [ ] MFA (Multi-Factor Authentication)
- [ ] RBAC permission checks
- [ ] Session management
- [ ] User profile management

#### Project Service
- [ ] Project CRUD operations
- [ ] Project lifecycle state management
- [ ] Budget validation
- [ ] Milestone tracking
- [ ] Team assignment
- [ ] Inspection scheduling
- [ ] Beneficiary registration

#### Finance Service
- [ ] Budget allocation management
- [ ] Payment voucher creation
- [ ] Dual-approval workflow (Panel A + Panel B)
- [ ] Payment execution
- [ ] Bank reconciliation
- [ ] Financial reporting
- [ ] Expenditure returns

#### Workflow Service
- [ ] Workflow definition engine
- [ ] State machine execution
- [ ] Task generation
- [ ] SLA tracking
- [ ] Workflow history
- [ ] Prerequisite validation

#### Document Service
- [ ] Document upload to S3/MinIO
- [ ] SHA-256 hash generation
- [ ] Version control
- [ ] Access logging
- [ ] QR code generation
- [ ] GPS coordinate validation
- [ ] Document search

#### Audit Service
- [ ] Audit log writing (immutable)
- [ ] Hash chain calculation
- [ ] WORM storage integration
- [ ] Integrity verification jobs
- [ ] Audit trail queries
- [ ] AI action logging

#### Notification Service
- [ ] SMS sending (via Africa's Talking)
- [ ] Email sending (via AWS SES/SendGrid)
- [ ] Push notifications (FCM/APNS)
- [ ] WhatsApp notifications
- [ ] In-app notifications
- [ ] Notification templates
- [ ] Delivery tracking

#### Integration Service
- [ ] Bank API integration
- [ ] IFMIS integration
- [ ] ZPPA contractor verification
- [ ] Mobile Money APIs
- [ ] National ID verification
- [ ] API call logging

#### AI Service
- [ ] Document intelligence (OCR)
- [ ] Anomaly detection
- [ ] Risk scoring
- [ ] Predictive analytics
- [ ] Compliance verification
- [ ] Conflict of interest detection
- [ ] Model performance tracking

---

## Phase 3: Infrastructure as Code

### 3.1 Docker Setup

- [ ] Create Dockerfile for each service
- [ ] Create docker-compose.yml for local development
- [ ] Create docker-compose.prod.yml for production
- [ ] Build all Docker images
- [ ] Test local deployment with Docker Compose

### 3.2 Kubernetes Setup

- [ ] Create Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets)
- [ ] Set up Ingress controller
- [ ] Configure cert-manager for SSL
- [ ] Set up Horizontal Pod Autoscaler
- [ ] Configure persistent volumes for PostgreSQL
- [ ] Set up Redis cluster
- [ ] Configure Kafka cluster

### 3.3 AWS/Azure Infrastructure (Terraform)

- [ ] VPC/Virtual Network setup
- [ ] Subnets (public/private)
- [ ] Security groups/NSGs
- [ ] RDS PostgreSQL instance (or Azure Database)
- [ ] ElastiCache Redis (or Azure Cache)
- [ ] EKS/AKS Kubernetes cluster
- [ ] Application Load Balancer
- [ ] S3/Blob Storage buckets
- [ ] CloudWatch/Azure Monitor
- [ ] WAF (Web Application Firewall)
- [ ] Secrets Manager

---

## Phase 4: Security Hardening

### 4.1 Application Security

- [ ] Enable HTTPS everywhere
- [ ] Implement CSRF protection
- [ ] Add security headers (Helmet.js)
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection
- [ ] Rate limiting per endpoint
- [ ] API key management
- [ ] Secret rotation policy

### 4.2 Database Security

- [ ] Enable SSL/TLS for all connections
- [ ] Restrict PostgreSQL to application subnet only
- [ ] Use least-privilege database users
- [ ] Enable query logging
- [ ] Set up pg_hba.conf correctly
- [ ] Regular security patches
- [ ] Audit failed login attempts

### 4.3 Infrastructure Security

- [ ] Configure VPC/network isolation
- [ ] Enable AWS GuardDuty / Azure Security Center
- [ ] Set up CloudTrail / Azure Activity Logs
- [ ] Configure firewall rules
- [ ] Enable DDoS protection
- [ ] Set up intrusion detection
- [ ] Regular vulnerability scanning

---

## Phase 5: Monitoring & Observability

### 5.1 Logging

- [ ] Centralized logging (ELK stack or CloudWatch)
- [ ] Structured logging (JSON format)
- [ ] Log retention policies
- [ ] Log encryption at rest
- [ ] Audit log WORM storage verification

### 5.2 Metrics

- [ ] Prometheus metrics collection
- [ ] Grafana dashboards
- [ ] API response time tracking
- [ ] Database query performance
- [ ] Error rate monitoring
- [ ] Resource utilization (CPU, memory, disk)

### 5.3 Alerting

- [ ] Set up PagerDuty / Opsgenie
- [ ] Critical error alerts
- [ ] High API error rate alerts
- [ ] Database connection pool exhaustion
- [ ] Disk space warnings
- [ ] Backup failure alerts
- [ ] Security incident alerts

### 5.4 Uptime Monitoring

- [ ] External uptime monitoring (Pingdom / UptimeRobot)
- [ ] Health check endpoints
- [ ] Synthetic transaction monitoring
- [ ] SLA tracking

---

## Phase 6: Backup & Disaster Recovery

### 6.1 Database Backups

- [ ] Automated daily full backups
- [ ] Continuous WAL archiving
- [ ] Point-in-time recovery testing
- [ ] Cross-region backup replication
- [ ] Backup encryption
- [ ] Audit log WORM storage (S3 Object Lock)
- [ ] 10-year retention for audit logs

### 6.2 Application Backups

- [ ] Code repository backups (GitHub/GitLab)
- [ ] Configuration backups
- [ ] Infrastructure as Code backups
- [ ] Document storage backups (S3 versioning)

### 6.3 Disaster Recovery

- [ ] Document RTO (Recovery Time Objective): 4 hours
- [ ] Document RPO (Recovery Point Objective): 1 hour
- [ ] Disaster recovery runbook
- [ ] Quarterly DR drills
- [ ] Multi-region failover plan

---

## Phase 7: Testing

### 7.1 Unit Testing

- [ ] Write unit tests for all services (target: 80% coverage)
- [ ] Test all business logic functions
- [ ] Mock external dependencies
- [ ] Run tests in CI/CD pipeline

### 7.2 Integration Testing

- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test external integrations
- [ ] Test authentication flows
- [ ] Test authorization (RBAC)

### 7.3 End-to-End Testing

- [ ] Test complete user journeys
- [ ] Test project lifecycle (creation to closure)
- [ ] Test payment workflows
- [ ] Test document upload and retrieval
- [ ] Test notification delivery

### 7.4 Performance Testing

- [ ] Load testing (JMeter / Artillery)
- [ ] Stress testing
- [ ] Database query optimization
- [ ] API response time < 200ms (target)
- [ ] Concurrent user testing (1000+ users)

### 7.5 Security Testing

- [ ] OWASP ZAP security scanning
- [ ] Penetration testing
- [ ] Dependency vulnerability scanning
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing

---

## Phase 8: Documentation

### 8.1 API Documentation

- [ ] Generate OpenAPI/Swagger docs
- [ ] Document all endpoints
- [ ] Provide example requests/responses
- [ ] Document authentication
- [ ] Document error codes

### 8.2 Developer Documentation

- [ ] Architecture overview
- [ ] Database schema documentation
- [ ] Deployment guides
- [ ] Contributing guidelines
- [ ] Code style guide

### 8.3 Operations Documentation

- [ ] Runbooks for common issues
- [ ] Incident response procedures
- [ ] Backup/restore procedures
- [ ] Scaling procedures
- [ ] Security incident response

### 8.4 User Documentation

- [ ] User manuals for each role
- [ ] Training materials
- [ ] Video tutorials
- [ ] FAQ

---

## Phase 9: Compliance & Audit Readiness

### 9.1 Compliance Requirements

- [ ] CDF Act compliance verification
- [ ] CDF Guidelines compliance
- [ ] Public Finance Management Act compliance
- [ ] Access to Information Act compliance
- [ ] Data Protection Act compliance
- [ ] Anti-Corruption compliance

### 9.2 Audit Trail

- [ ] Verify audit log immutability
- [ ] Test hash chain integrity
- [ ] Verify WORM storage
- [ ] Test audit log query capabilities
- [ ] Generate sample audit reports

### 9.3 Reporting

- [ ] Quarterly expenditure returns
- [ ] Monthly financial reports
- [ ] Annual compliance reports
- [ ] Constituency performance reports
- [ ] Transparency metrics

---

## Phase 10: Go-Live Preparation

### 10.1 Pre-Launch Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Backup systems verified
- [ ] Monitoring dashboards set up
- [ ] Alerting configured
- [ ] Documentation complete
- [ ] User training completed
- [ ] Support team trained

### 10.2 Launch Plan

- [ ] Schedule maintenance window
- [ ] Communication plan (stakeholders)
- [ ] Phased rollout plan (pilot constituencies first)
- [ ] Rollback plan
- [ ] Post-launch support schedule

### 10.3 Post-Launch

- [ ] Monitor system health 24/7 for first week
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Performance optimization
- [ ] User support escalation

---

## Current Status

### Completed ✓
- [x] Database schema design (10 comprehensive schemas)
- [x] Database migration scripts
- [x] Seed data for administrative hierarchy
- [x] Database deployment automation
- [x] Comprehensive documentation

### In Progress 🔄
- [ ] NestJS microservices scaffolding
- [ ] API Gateway development
- [ ] Core service implementation

### Pending ⏳
- [ ] Infrastructure as Code
- [ ] Docker containerization
- [ ] Kubernetes orchestration
- [ ] CI/CD pipeline
- [ ] Security hardening
- [ ] Testing suite
- [ ] Production deployment

---

## Support & Contact

**Development Team**: CDF Smart Hub Backend Team
**Email**: dev@cdf-smarthub.gov.zm
**Emergency**: +260-XXX-XXXXXX

---

**Last Updated**: 2024-XX-XX
**Version**: 1.0.0
