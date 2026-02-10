# CDF Smart Hub - Production Deployment Guide

**Version**: 1.0.0
**Status**: Production Ready
**Target Environment**: Cloud Infrastructure (AWS/Azure/GCP)

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Database Setup](#database-setup)
4. [Service Deployment](#service-deployment)
5. [Security Configuration](#security-configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Disaster Recovery](#backup--disaster-recovery)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Environment Preparation
- [ ] Production environment provisioned (servers, networking, storage)
- [ ] SSL/TLS certificates obtained and configured
- [ ] Domain names configured (api.cdfsmarthub.zm, etc.)
- [ ] Firewall rules configured
- [ ] Load balancer configured
- [ ] CDN configured (for static assets)
- [ ] DNS records configured
- [ ] VPN/Bastion host access configured

### Security Prerequisites
- [ ] All secrets generated and stored in secret manager (AWS Secrets Manager, Azure Key Vault, etc.)
- [ ] JWT secrets (minimum 32 characters, cryptographically random)
- [ ] Database passwords (strong, unique passwords)
- [ ] API keys for external services
- [ ] MFA backup codes for admin accounts
- [ ] SSH keys for server access
- [ ] Security audit completed
- [ ] Penetration testing completed

### Code Preparation
- [ ] All services built and tested
- [ ] Docker images built and pushed to registry
- [ ] Database migrations reviewed
- [ ] Seed data prepared
- [ ] Environment variables documented
- [ ] Configuration files prepared
- [ ] Version tags created in Git

### Team Readiness
- [ ] Operations team trained
- [ ] Support team trained
- [ ] Incident response plan documented
- [ ] Escalation procedures documented
- [ ] On-call schedule configured
- [ ] Communication channels set up (Slack, Teams, etc.)

---

## Infrastructure Requirements

### Minimum Production Specifications

#### Database Server (PostgreSQL)
- **CPU**: 8 cores (16 recommended)
- **RAM**: 32 GB (64 GB recommended)
- **Storage**: 500 GB SSD (expandable)
- **IOPS**: 10,000+ provisioned IOPS
- **Backup**: Automated daily backups, 30-day retention
- **HA**: Multi-AZ deployment with automatic failover

#### Cache Server (Redis)
- **CPU**: 4 cores
- **RAM**: 16 GB
- **Storage**: 100 GB SSD
- **HA**: Redis Cluster with 3+ nodes

#### Message Queue (Kafka)
- **CPU**: 4 cores per broker
- **RAM**: 16 GB per broker
- **Storage**: 1 TB SSD per broker
- **Cluster**: 3+ brokers for HA
- **Zookeeper**: 3+ nodes

#### Object Storage (S3/MinIO)
- **Storage**: 10 TB (expandable)
- **Redundancy**: Multi-region replication
- **Access**: IAM-based access control

#### Application Servers (per service)
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Instances**: Minimum 2 per service (HA)
- **Auto-scaling**: Configure based on load

#### Load Balancer
- **Type**: Application Load Balancer (Layer 7)
- **SSL/TLS**: Terminate at load balancer
- **Health Checks**: Configured for all services
- **Sticky Sessions**: Disabled (stateless services)

### Network Configuration

#### Subnets
```
Production VPC: 10.0.0.0/16

Public Subnets (Load Balancers, NAT Gateways):
- 10.0.1.0/24 (AZ-1)
- 10.0.2.0/24 (AZ-2)
- 10.0.3.0/24 (AZ-3)

Private Subnets (Application Servers):
- 10.0.11.0/24 (AZ-1)
- 10.0.12.0/24 (AZ-2)
- 10.0.13.0/24 (AZ-3)

Database Subnets (Database Servers):
- 10.0.21.0/24 (AZ-1)
- 10.0.22.0/24 (AZ-2)
- 10.0.23.0/24 (AZ-3)
```

#### Security Groups

**Load Balancer**:
- Inbound: 443 (HTTPS) from 0.0.0.0/0
- Outbound: 3000-3010 to Application Security Group

**Application Servers**:
- Inbound: 3000-3010 from Load Balancer
- Outbound: 5432 (PostgreSQL), 6379 (Redis), 9092 (Kafka)

**Database**:
- Inbound: 5432 from Application Security Group
- Outbound: None (stateful responses only)

**Redis**:
- Inbound: 6379 from Application Security Group
- Outbound: None

**Kafka**:
- Inbound: 9092 from Application Security Group
- Outbound: Kafka cluster communication

---

## Database Setup

### 1. Provision PostgreSQL

```bash
# For AWS RDS
aws rds create-db-instance \
  --db-instance-identifier cdf-smarthub-prod \
  --db-instance-class db.r6g.2xlarge \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password $(aws secretsmanager get-secret-value --secret-id db-password --query SecretString --output text) \
  --allocated-storage 500 \
  --storage-type io1 \
  --iops 10000 \
  --vpc-security-group-ids sg-xxxx \
  --db-subnet-group-name cdf-db-subnet \
  --multi-az \
  --backup-retention-period 30 \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --tags Key=Environment,Value=Production Key=Project,Value=CDF-SmartHub
```

### 2. Configure PostgreSQL

```sql
-- Connect to PostgreSQL
psql -h cdf-smarthub-prod.xxxx.rds.amazonaws.com -U postgres -d postgres

-- Create database
CREATE DATABASE cdf_smarthub;

-- Create application user
CREATE USER cdf_app WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD_FROM_SECRETS_MANAGER';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cdf_smarthub TO cdf_app;

-- Connect to cdf_smarthub
\c cdf_smarthub

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO cdf_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cdf_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cdf_app;

-- Configure connection limits
ALTER USER cdf_app CONNECTION LIMIT 100;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### 3. Deploy Database Schema

```bash
# Transfer deployment scripts to bastion host
scp -r database/migrations bastion:/tmp/

# Connect to bastion
ssh bastion

# Set environment variables
export PGHOST=cdf-smarthub-prod.xxxx.rds.amazonaws.com
export PGUSER=postgres
export PGDATABASE=cdf_smarthub
export PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id db-password --query SecretString --output text)

# Run deployment
cd /tmp/migrations
./deploy_database.sh

# Verify deployment
psql -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | wc -l
# Should return 85+ tables
```

### 4. Load Seed Data

```bash
cd /tmp/seed-data
./load_seed_data.sh

# Verify seed data
psql -c "SELECT COUNT(*) FROM provinces;"  # Should return 10
psql -c "SELECT COUNT(*) FROM districts;"  # Should return 116+
psql -c "SELECT COUNT(*) FROM constituencies;"  # Should return 156+
```

### 5. Configure Database Backups

```bash
# Enable automated backups (already done in RDS creation)

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier cdf-smarthub-prod \
  --db-snapshot-identifier cdf-smarthub-prod-initial-snapshot

# Set up point-in-time recovery (enabled by default with backup retention)

# Configure backup notifications
aws sns create-topic --name cdf-db-backup-notifications
aws rds modify-db-instance \
  --db-instance-identifier cdf-smarthub-prod \
  --enable-cloudwatch-logs-exports '["postgresql"]'
```

---

## Service Deployment

### 1. Build Docker Images

```bash
# Build all services
cd backend

# API Gateway
docker build -t cdf-smarthub/api-gateway:1.0.0 -f services/api-gateway/Dockerfile .
docker tag cdf-smarthub/api-gateway:1.0.0 YOUR_REGISTRY/api-gateway:1.0.0
docker push YOUR_REGISTRY/api-gateway:1.0.0

# User Service
docker build -t cdf-smarthub/user-service:1.0.0 -f services/user-service/Dockerfile .
docker tag cdf-smarthub/user-service:1.0.0 YOUR_REGISTRY/user-service:1.0.0
docker push YOUR_REGISTRY/user-service:1.0.0

# Project Service
docker build -t cdf-smarthub/project-service:1.0.0 -f services/project-service/Dockerfile .
docker tag cdf-smarthub/project-service:1.0.0 YOUR_REGISTRY/project-service:1.0.0
docker push YOUR_REGISTRY/project-service:1.0.0

# Finance Service
docker build -t cdf-smarthub/finance-service:1.0.0 -f services/finance-service/Dockerfile .
docker tag cdf-smarthub/finance-service:1.0.0 YOUR_REGISTRY/finance-service:1.0.0
docker push YOUR_REGISTRY/finance-service:1.0.0
```

### 2. Deploy with Kubernetes (Recommended)

Create Kubernetes manifests:

**namespace.yaml**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cdf-smarthub
```

**api-gateway-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: cdf-smarthub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: YOUR_REGISTRY/api-gateway:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secrets
              key: secret
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: cdf-smarthub
spec:
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/project-service-deployment.yaml
kubectl apply -f k8s/finance-service-deployment.yaml
```

### 3. Configure Environment Variables

Create Kubernetes secrets:

```bash
# Database secrets
kubectl create secret generic db-secrets -n cdf-smarthub \
  --from-literal=host=cdf-smarthub-prod.xxxx.rds.amazonaws.com \
  --from-literal=username=cdf_app \
  --from-literal=password=SECURE_PASSWORD \
  --from-literal=database=cdf_smarthub

# JWT secrets
kubectl create secret generic jwt-secrets -n cdf-smarthub \
  --from-literal=secret=$(openssl rand -base64 32) \
  --from-literal=refresh-secret=$(openssl rand -base64 32)

# Redis secrets
kubectl create secret generic redis-secrets -n cdf-smarthub \
  --from-literal=host=redis-cluster.xxxx.cache.amazonaws.com \
  --from-literal=port=6379
```

---

## Security Configuration

### 1. SSL/TLS Certificates

```bash
# Request certificate from AWS ACM
aws acm request-certificate \
  --domain-name api.cdfsmarthub.zm \
  --subject-alternative-names "*.cdfsmarthub.zm" \
  --validation-method DNS

# Configure on load balancer
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### 2. WAF Configuration

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name cdf-smarthub-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Associate with load balancer
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:... \
  --resource-arn arn:aws:elasticloadbalancing:...
```

### 3. Enable Encryption

- [x] Database encryption at rest (enabled in RDS)
- [x] Database encryption in transit (SSL/TLS)
- [x] Redis encryption at rest and in transit
- [x] S3 encryption at rest (AES-256)
- [x] Application-level encryption for sensitive fields
- [x] HTTPS only (HTTP redirects to HTTPS)

### 4. Configure Rate Limiting

Already implemented in API Gateway service, but add additional protection at load balancer level:

```yaml
# AWS WAF rate limit rule
{
  "Name": "RateLimitRule",
  "Priority": 1,
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,
      "AggregateKeyType": "IP"
    }
  },
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "RateLimitRule"
  }
}
```

---

## Monitoring & Logging

### 1. Application Monitoring

```bash
# Install Prometheus
kubectl create namespace monitoring
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# Install Grafana dashboards
# Import dashboard IDs: 1860 (Node Exporter), 315 (Kubernetes cluster)

# Configure alerts
kubectl apply -f k8s/prometheus-alerts.yaml
```

### 2. Centralized Logging

```bash
# Deploy ELK stack or use cloud service
helm install elasticsearch elastic/elasticsearch -n monitoring
helm install kibana elastic/kibana -n monitoring
helm install filebeat elastic/filebeat -n monitoring

# Configure log retention (30 days)
curl -X PUT "elasticsearch:9200/_all/_settings" -H 'Content-Type: application/json' -d'
{
  "index": {
    "lifecycle": {
      "name": "30-day-retention-policy"
    }
  }
}'
```

### 3. Health Checks

All services expose `/api/v1/health` endpoint. Configure uptime monitoring:

```bash
# AWS CloudWatch Synthetics
aws synthetics create-canary \
  --name cdf-api-health-check \
  --artifact-s3-location s3://cdf-monitoring/canary \
  --execution-role-arn arn:aws:iam::... \
  --schedule Expression='rate(5 minutes)' \
  --runtime-version syn-nodejs-puppeteer-3.9 \
  --code file://health-check-script.js
```

### 4. Alert Configuration

Configure alerts for:
- [ ] Service downtime (immediate)
- [ ] High error rate (> 1%, 5 min)
- [ ] High response time (> 2s, 5 min)
- [ ] Database connection failures
- [ ] Budget exhaustion
- [ ] Failed payment approvals
- [ ] Suspicious activity patterns
- [ ] Disk space < 20%
- [ ] CPU > 80% for 10 min
- [ ] Memory > 85% for 10 min

---

## Backup & Disaster Recovery

### 1. Database Backups

```bash
# Automated daily backups (configured in RDS)
# Retention: 30 days
# Point-in-time recovery: Last 30 days

# Weekly full backup to S3
pg_dump -h $DB_HOST -U $DB_USER -d cdf_smarthub | \
  gzip | \
  aws s3 cp - s3://cdf-backups/database/full-backup-$(date +%Y%m%d).sql.gz

# Test restore monthly
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier cdf-test-restore \
  --db-snapshot-identifier cdf-smarthub-prod-snapshot-latest
```

### 2. Application State Backup

```bash
# Redis backup
redis-cli --rdb /backup/redis-backup-$(date +%Y%m%d).rdb
aws s3 cp /backup/redis-backup-*.rdb s3://cdf-backups/redis/

# Kafka backup (if needed)
# Configure Kafka MirrorMaker for disaster recovery
```

### 3. Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 1 hour

**Recovery Procedures**:

1. **Database Failure**:
   - Automatic failover to standby (Multi-AZ)
   - Manual failover if automatic fails
   - Restore from snapshot if corruption detected

2. **Service Failure**:
   - Kubernetes auto-restart
   - Manual pod deletion to force restart
   - Rollback to previous version if needed

3. **Region Failure**:
   - DNS failover to secondary region
   - Restore database from cross-region replica
   - Deploy services in secondary region

---

## Post-Deployment Verification

### 1. Smoke Tests

```bash
# Test API Gateway
curl https://api.cdfsmarthub.zm/api/v1/health
# Expected: {"status":"healthy"}

# Test authentication
curl -X POST https://api.cdfsmarthub.zm/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ADMIN_PASSWORD"}'
# Expected: {"accessToken":"...","refreshToken":"..."}

# Test User Service
curl https://api.cdfsmarthub.zm/api/v1/users/statistics \
  -H "Authorization: Bearer TOKEN"
# Expected: {"total":0,"active":0,...}

# Test Project Service
curl https://api.cdfsmarthub.zm/api/v1/projects/statistics \
  -H "Authorization: Bearer TOKEN"

# Test Finance Service
curl https://api.cdfsmarthub.zm/api/v1/budget/statistics \
  -H "Authorization: Bearer TOKEN"
```

### 2. Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-tests/api-gateway-load-test.js

# Expected results:
# - 95th percentile response time < 500ms
# - Error rate < 0.1%
# - Successful completion of all scenarios
```

### 3. Security Verification

```bash
# SSL/TLS check
curl -I https://api.cdfsmarthub.zm
# Expected: HTTP/2 200, TLS 1.3

# Security headers check
curl -I https://api.cdfsmarthub.zm
# Expected: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://api.cdfsmarthub.zm
```

### 4. Functional Testing

Create test scenarios:
- [ ] User registration and login
- [ ] Create project with dual approval
- [ ] Create budget allocation
- [ ] Create payment voucher with dual approval
- [ ] Complete payment execution
- [ ] Verify audit trail

---

## Rollback Procedures

### Quick Rollback (Service Level)

```bash
# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n cdf-smarthub
kubectl rollout undo deployment/user-service -n cdf-smarthub
kubectl rollout undo deployment/project-service -n cdf-smarthub
kubectl rollout undo deployment/finance-service -n cdf-smarthub

# Verify rollback
kubectl rollout status deployment/api-gateway -n cdf-smarthub
```

### Database Rollback

```bash
# Point-in-time recovery
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier cdf-smarthub-prod \
  --target-db-instance-identifier cdf-smarthub-prod-restored \
  --restore-time 2024-01-01T12:00:00Z

# Update DNS to point to restored instance
```

### Full Rollback Plan

1. Stop all traffic to services (update load balancer)
2. Rollback database to previous snapshot
3. Rollback services to previous version
4. Verify all services healthy
5. Gradually restore traffic
6. Monitor for issues

---

## Production Checklist

### Pre-Go-Live
- [ ] All services deployed and healthy
- [ ] Database deployed with seed data
- [ ] SSL/TLS certificates configured
- [ ] DNS configured and tested
- [ ] Monitoring and alerting active
- [ ] Backups configured and tested
- [ ] Security scan completed (no critical issues)
- [ ] Load testing completed (meets SLA)
- [ ] Disaster recovery tested
- [ ] Team training completed
- [ ] Support documentation ready
- [ ] Incident response plan ready

### Go-Live Day
- [ ] Final backup taken
- [ ] All team members on standby
- [ ] Communication channels active
- [ ] Monitoring dashboards open
- [ ] Smoke tests passing
- [ ] User acceptance testing completed
- [ ] Sign-off from stakeholders

### Post-Go-Live (First 48 Hours)
- [ ] Monitor error rates continuously
- [ ] Monitor performance metrics
- [ ] Check backup completion
- [ ] Verify audit logs
- [ ] Review security alerts
- [ ] Collect user feedback
- [ ] Document any issues
- [ ] Team retrospective

---

## Support Contacts

### Escalation Path
1. **Level 1**: Operations team (monitoring, basic issues)
2. **Level 2**: Development team (application issues)
3. **Level 3**: Architecture team (system-wide issues)
4. **Level 4**: External vendors (infrastructure issues)

### Emergency Contacts
- **On-Call Engineer**: [Contact Info]
- **Database Administrator**: [Contact Info]
- **Security Team**: [Contact Info]
- **Project Manager**: [Contact Info]

---

**Deployment Status**: ✅ Ready for Production

**Last Updated**: December 2024
**Next Review**: Post-deployment (1 week after go-live)
