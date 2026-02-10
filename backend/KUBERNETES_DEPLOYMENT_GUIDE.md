## Kubernetes Deployment Guide - CDF Smart Hub

Complete production deployment guide for CDF Smart Hub backend on Kubernetes.

## Prerequisites

### Infrastructure Requirements

**Minimum Cluster Specifications:**
- **Kubernetes Version**: 1.28+
- **Nodes**: 5+ worker nodes
- **Total CPU**: 20+ cores
- **Total Memory**: 40+ GB RAM
- **Storage**: 1+ TB (persistent volumes for PostgreSQL, Redis, backups)

**Per-Service Resources:**

| Service | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|----------|-------------|-----------|----------------|--------------|
| API Gateway | 3-10 | 250m | 500m | 256Mi | 512Mi |
| User Service | 3-8 | 250m | 500m | 256Mi | 512Mi |
| Project Service | 3-8 | 250m | 500m | 256Mi | 512Mi |
| Finance Service | 3-10 | 500m | 1000m | 512Mi | 1Gi |
| PostgreSQL | 1 | 1000m | 2000m | 2Gi | 4Gi |
| Redis | 1 | 250m | 1000m | 512Mi | 2Gi |

### Required Tools

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Cloud Provider Setup

**AWS EKS:**
```bash
eksctl create cluster \
  --name cdf-smarthub \
  --region af-south-1 \
  --nodegroup-name standard-workers \
  --node-type t3.xlarge \
  --nodes 5 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed
```

**Google GKE:**
```bash
gcloud container clusters create cdf-smarthub \
  --zone africa-south1-a \
  --num-nodes 5 \
  --machine-type n1-standard-4 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10
```

**Azure AKS:**
```bash
az aks create \
  --resource-group cdf-smarthub \
  --name cdf-smarthub-cluster \
  --node-count 5 \
  --node-vm-size Standard_D4s_v3 \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 10
```

## Step 1: Build Docker Images

### Build All Services

```bash
# Build API Gateway
docker build -f Dockerfile.api-gateway -t cdf-smarthub/api-gateway:latest .

# Build User Service
docker build -f Dockerfile.user-service -t cdf-smarthub/user-service:latest .

# Build Project Service
docker build -f Dockerfile.project-service -t cdf-smarthub/project-service:latest .

# Build Finance Service
docker build -f Dockerfile.finance-service -t cdf-smarthub/finance-service:latest .
```

### Tag and Push to Registry

**Using GitHub Container Registry:**

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag images
docker tag cdf-smarthub/api-gateway:latest ghcr.io/YOUR_ORG/cdf-smarthub/api-gateway:latest
docker tag cdf-smarthub/user-service:latest ghcr.io/YOUR_ORG/cdf-smarthub/user-service:latest
docker tag cdf-smarthub/project-service:latest ghcr.io/YOUR_ORG/cdf-smarthub/project-service:latest
docker tag cdf-smarthub/finance-service:latest ghcr.io/YOUR_ORG/cdf-smarthub/finance-service:latest

# Push images
docker push ghcr.io/YOUR_ORG/cdf-smarthub/api-gateway:latest
docker push ghcr.io/YOUR_ORG/cdf-smarthub/user-service:latest
docker push ghcr.io/YOUR_ORG/cdf-smarthub/project-service:latest
docker push ghcr.io/YOUR_ORG/cdf-smarthub/finance-service:latest
```

## Step 2: Configure Kubernetes Cluster

### Connect to Cluster

```bash
# AWS EKS
aws eks update-kubeconfig --name cdf-smarthub --region af-south-1

# Google GKE
gcloud container clusters get-credentials cdf-smarthub --zone africa-south1-a

# Azure AKS
az aks get-credentials --resource-group cdf-smarthub --name cdf-smarthub-cluster
```

### Verify Connection

```bash
kubectl cluster-info
kubectl get nodes
```

## Step 3: Create Namespace

```bash
kubectl apply -f kubernetes/namespace.yaml
```

## Step 4: Create Secrets

### Generate Secure Secrets

```bash
# Generate random secrets
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)
export MINIO_SECRET_KEY=$(openssl rand -base64 32)
export ENCRYPTION_KEY=$(openssl rand -base64 32)

# Create Kubernetes secret
kubectl create secret generic cdf-smarthub-secrets \
  --from-literal=DB_USERNAME=postgres \
  --from-literal=DB_PASSWORD="$DB_PASSWORD" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
  --from-literal=MINIO_ACCESS_KEY="minio-admin" \
  --from-literal=MINIO_SECRET_KEY="$MINIO_SECRET_KEY" \
  --from-literal=SMTP_USERNAME="smtp-user@gov.zm" \
  --from-literal=SMTP_PASSWORD="your-smtp-password" \
  --from-literal=SMS_API_KEY="your-sms-api-key" \
  --from-literal=SMS_USERNAME="your-sms-username" \
  --from-literal=ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  --namespace=cdf-smarthub

# Verify secret was created
kubectl get secrets -n cdf-smarthub
```

### **IMPORTANT**: Save secrets securely

```bash
# Save to secure location (e.g., HashiCorp Vault, AWS Secrets Manager)
echo "JWT_SECRET=$JWT_SECRET" >> .env.production
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> .env.production
echo "DB_PASSWORD=$DB_PASSWORD" >> .env.production
echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env.production

# Encrypt and store securely
gpg --encrypt --recipient admin@cdf.gov.zm .env.production

# NEVER commit .env.production to git
```

## Step 5: Deploy Configuration

```bash
kubectl apply -f kubernetes/configmap.yaml
```

## Step 6: Deploy PostgreSQL

```bash
# Deploy PostgreSQL StatefulSet
kubectl apply -f kubernetes/postgres-statefulset.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n cdf-smarthub --timeout=300s

# Verify PostgreSQL is running
kubectl get pods -n cdf-smarthub | grep postgres
kubectl logs -n cdf-smarthub postgres-0
```

## Step 7: Run Database Migrations

### Copy Migration Files to Pod

```bash
# Copy migration files
kubectl cp database/migrations/001_users_and_auth.sql \
  cdf-smarthub/postgres-0:/tmp/001_users_and_auth.sql

kubectl cp database/migrations/002_administrative_structure.sql \
  cdf-smarthub/postgres-0:/tmp/002_administrative_structure.sql

kubectl cp database/migrations/003_projects_and_milestones.sql \
  cdf-smarthub/postgres-0:/tmp/003_projects_and_milestones.sql

kubectl cp database/migrations/004_budget_and_finance.sql \
  cdf-smarthub/postgres-0:/tmp/004_budget_and_finance.sql

kubectl cp database/migrations/005_audit_and_compliance.sql \
  cdf-smarthub/postgres-0:/tmp/005_audit_and_compliance.sql

kubectl cp database/migrations/006_administrative_hierarchy_and_rls.sql \
  cdf-smarthub/postgres-0:/tmp/006_administrative_hierarchy_and_rls.sql
```

### Execute Migrations

```bash
# Run migrations in order
kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -f /tmp/001_users_and_auth.sql

kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -f /tmp/002_administrative_structure.sql

kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -f /tmp/003_projects_and_milestones.sql

kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -f /tmp/004_budget_and_finance.sql

kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -f /tmp/005_audit_and_compliance.sql

kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -f /tmp/006_administrative_hierarchy_and_rls.sql

# Verify migrations
kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -c "\dt"
```

## Step 8: Seed Administrative Data

```bash
# Copy seed file
kubectl cp database/seeds/001_administrative_hierarchy.sql \
  cdf-smarthub/postgres-0:/tmp/001_administrative_hierarchy.sql

# Run seed
kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -f /tmp/001_administrative_hierarchy.sql

# Verify data
kubectl exec -n cdf-smarthub postgres-0 -- \
  psql -U postgres -d cdf_smarthub -c "SELECT COUNT(*) FROM constituencies;"
# Should return 156
```

## Step 9: Deploy Redis

```bash
kubectl apply -f kubernetes/redis-deployment.yaml

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l app=redis -n cdf-smarthub --timeout=300s

# Verify Redis
kubectl logs -n cdf-smarthub -l app=redis
```

## Step 10: Deploy Services

```bash
# Deploy API Gateway
kubectl apply -f kubernetes/api-gateway-deployment.yaml

# Deploy User Service
kubectl apply -f kubernetes/user-service-deployment.yaml

# Deploy Project Service
kubectl apply -f kubernetes/project-service-deployment.yaml

# Deploy Finance Service
kubectl apply -f kubernetes/finance-service-deployment.yaml

# Wait for all deployments to be ready
kubectl rollout status deployment/api-gateway -n cdf-smarthub
kubectl rollout status deployment/user-service -n cdf-smarthub
kubectl rollout status deployment/project-service -n cdf-smarthub
kubectl rollout status deployment/finance-service -n cdf-smarthub
```

## Step 11: Configure Ingress and TLS

### Install NGINX Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

### Install Cert-Manager for TLS

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager \
  -n cert-manager --timeout=300s
```

### Deploy Ingress

```bash
kubectl apply -f kubernetes/ingress.yaml

# Get LoadBalancer IP
kubectl get ingress -n cdf-smarthub
```

### Configure DNS

Point your domain to the LoadBalancer IP:

```
smarthub.cdf.gov.zm    A    <LoadBalancer-IP>
api.smarthub.cdf.gov.zm  A    <LoadBalancer-IP>
```

## Step 12: Verify Deployment

### Check All Pods

```bash
kubectl get pods -n cdf-smarthub

# Expected output:
# NAME                              READY   STATUS    RESTARTS   AGE
# api-gateway-xxxxxxxxx-xxxxx       1/1     Running   0          5m
# api-gateway-xxxxxxxxx-xxxxx       1/1     Running   0          5m
# api-gateway-xxxxxxxxx-xxxxx       1/1     Running   0          5m
# user-service-xxxxxxxxx-xxxxx      1/1     Running   0          5m
# user-service-xxxxxxxxx-xxxxx      1/1     Running   0          5m
# user-service-xxxxxxxxx-xxxxx      1/1     Running   0          5m
# project-service-xxxxxxxxx-xxxxx   1/1     Running   0          5m
# finance-service-xxxxxxxxx-xxxxx   1/1     Running   0          5m
# postgres-0                        1/1     Running   0          10m
# redis-xxxxxxxxx-xxxxx             1/1     Running   0          10m
```

### Check Services

```bash
kubectl get services -n cdf-smarthub

# Expected services:
# - api-gateway-service (LoadBalancer)
# - user-service (ClusterIP)
# - project-service (ClusterIP)
# - finance-service (ClusterIP)
# - postgres-service (ClusterIP)
# - redis-service (ClusterIP)
```

### Test API Gateway

```bash
# Health check
curl https://api.smarthub.cdf.gov.zm/health

# Expected response:
# {"status":"ok","timestamp":"..."}

# API documentation
curl https://api.smarthub.cdf.gov.zm/api/docs
```

## Step 13: Monitor Deployment

### View Logs

```bash
# API Gateway logs
kubectl logs -f -l app=api-gateway -n cdf-smarthub

# User Service logs
kubectl logs -f -l app=user-service -n cdf-smarthub

# Finance Service logs
kubectl logs -f -l app=finance-service -n cdf-smarthub
```

### Check Resource Usage

```bash
kubectl top pods -n cdf-smarthub
kubectl top nodes
```

### Monitor HPA (Horizontal Pod Autoscaler)

```bash
kubectl get hpa -n cdf-smarthub

# Expected output shows current/target replicas
```

## Maintenance Operations

### Update Deployment (Rolling Update)

```bash
# Build new image
docker build -f Dockerfile.api-gateway -t cdf-smarthub/api-gateway:v1.1.0 .

# Tag and push
docker tag cdf-smarthub/api-gateway:v1.1.0 ghcr.io/YOUR_ORG/cdf-smarthub/api-gateway:v1.1.0
docker push ghcr.io/YOUR_ORG/cdf-smarthub/api-gateway:v1.1.0

# Update deployment
kubectl set image deployment/api-gateway \
  api-gateway=ghcr.io/YOUR_ORG/cdf-smarthub/api-gateway:v1.1.0 \
  -n cdf-smarthub

# Monitor rollout
kubectl rollout status deployment/api-gateway -n cdf-smarthub
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/api-gateway -n cdf-smarthub

# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n cdf-smarthub

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway --to-revision=2 -n cdf-smarthub
```

### Scale Deployment

```bash
# Manual scaling
kubectl scale deployment/api-gateway --replicas=5 -n cdf-smarthub

# Update HPA
kubectl edit hpa api-gateway-hpa -n cdf-smarthub
# Change minReplicas and maxReplicas
```

### Backup Database

```bash
# Manual backup
kubectl exec -n cdf-smarthub postgres-0 -- \
  pg_dump -U postgres cdf_smarthub | gzip > backup_$(date +%Y%m%d).sql.gz

# Automated backups run daily at 2 AM (see postgres-statefulset.yaml)
```

### Restore Database

```bash
# Copy backup to pod
kubectl cp backup_20241230.sql.gz cdf-smarthub/postgres-0:/tmp/backup.sql.gz

# Restore
kubectl exec -n cdf-smarthub postgres-0 -- bash -c \
  "gunzip -c /tmp/backup.sql.gz | psql -U postgres cdf_smarthub"
```

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n cdf-smarthub

# Check logs
kubectl logs <pod-name> -n cdf-smarthub

# Check previous container logs
kubectl logs <pod-name> -n cdf-smarthub --previous
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl exec -n cdf-smarthub postgres-0 -- pg_isready -U postgres

# Test connection from service pod
kubectl exec -n cdf-smarthub <api-gateway-pod> -- \
  nc -zv postgres-service 5432

# Check secrets
kubectl get secret cdf-smarthub-secrets -n cdf-smarthub -o yaml
```

### High Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n cdf-smarthub

# Scale up if needed
kubectl scale deployment/<service> --replicas=<new-count> -n cdf-smarthub

# Or adjust resource limits
kubectl edit deployment/<service> -n cdf-smarthub
```

## Security Checklist

- [ ] All secrets generated with strong random values
- [ ] TLS certificates configured (Let's Encrypt)
- [ ] HTTPS enforced on all endpoints
- [ ] Database backups automated and tested
- [ ] Network policies applied
- [ ] RBAC configured for cluster access
- [ ] Pod security policies enforced
- [ ] Secrets encrypted at rest
- [ ] Regular security updates scheduled
- [ ] Monitoring and alerting configured

## Production Monitoring

### Prometheus & Grafana (Recommended)

```bash
# Install Prometheus & Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### Key Metrics to Monitor

- **API Gateway**: Request rate, error rate, latency
- **User Service**: Authentication success rate, failed logins
- **Finance Service**: Payment processing time, approval workflow latency
- **Database**: Connection pool usage, query performance, disk usage
- **Redis**: Memory usage, hit rate, eviction rate

## Support

For deployment issues:
- Check logs: `kubectl logs -f <pod-name> -n cdf-smarthub`
- Check events: `kubectl get events -n cdf-smarthub`
- Review configuration: `kubectl get configmap cdf-smarthub-config -o yaml`

**Critical**: Ensure PostgreSQL backups are running and tested regularly.
