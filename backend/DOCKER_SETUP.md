# CDF Smart Hub - Docker Infrastructure Setup

This document describes the enhanced Docker infrastructure for the CDF Smart Hub backend services.

## 🔧 Quick Start

### Development Environment

1. **Copy environment file:**
   ```bash
   cp .env.docker.example .env.docker
   ```

2. **Edit environment variables:**
   ```bash
   # Update passwords and configuration in .env.docker
   nano .env.docker
   ```

3. **Start all services:**
   ```bash
   docker-compose --env-file .env.docker up -d
   ```

4. **Start with development tools:**
   ```bash
   docker-compose --env-file .env.docker --profile dev up -d
   ```

### Production Environment

1. **Security-enhanced setup:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.security.yml --env-file .env.docker up -d
   ```

## 📦 Services Overview

### Core Infrastructure
- **PostgreSQL 16**: Primary database with health checks
- **Redis 7**: Caching and session storage  
- **Kafka + Zookeeper**: Event streaming
- **MinIO**: S3-compatible object storage

### Development Tools (Profile: `dev`)
- **PgAdmin**: Database administration
- **Redis Commander**: Redis GUI
- **MailHog**: Email testing

## 🔒 Security Features

### Environment Variables
- All sensitive values moved to `.env.docker` file
- Template provided in `.env.docker.example`
- No hardcoded passwords in compose files

### Resource Management  
- Memory and CPU limits for all services
- Prevents resource exhaustion
- Optimized for development and production

### Network Security
- Isolated internal network
- External ports only for necessary services
- Production override removes external access

### Container Security
- Read-only containers where possible
- Security options: `no-new-privileges`
- Temporary filesystems for sensitive directories
- Non-root user execution

## 🚀 Performance Optimizations

### Resource Allocation
| Service | Memory Limit | CPU Limit | Purpose |
|---------|-------------|-----------|---------|
| PostgreSQL | 1G | 0.5 CPU | Database operations |
| Redis | 512M | 0.25 CPU | Caching |
| Kafka | 1G | 0.75 CPU | Event streaming |
| Zookeeper | 512M | 0.5 CPU | Kafka coordination |
| MinIO | 1G | 0.5 CPU | File storage |

### Health Checks
- All services have health check endpoints
- Proper dependency management with health conditions
- Configurable retry and timeout settings

## 🔧 Configuration Files

### Environment Files
- `.env.docker.example` - Template with safe defaults
- `.env.docker` - Your actual configuration (not in git)
- `.env` - Application-level environment variables

### Compose Files
- `docker-compose.yml` - Main configuration
- `docker-compose.security.yml` - Security overrides
- `docker-compose.prod.yml` - Production services (existing)

## 🏗️ Usage Examples

### Development with all tools:
```bash
# Start everything including dev tools
docker-compose --env-file .env.docker --profile dev up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose --profile dev down
```

### Production-like setup:
```bash
# Start with security enhancements
docker-compose \
  -f docker-compose.yml \
  -f docker-compose.security.yml \
  --env-file .env.docker \
  up -d

# Check service health
docker-compose ps
```

### Individual service management:
```bash
# Start only database services
docker-compose --env-file .env.docker up -d postgres redis

# Restart a specific service
docker-compose restart kafka

# View service logs
docker-compose logs -f postgres
```

## 🌐 Service Access

### Development URLs
- **Backend API**: http://localhost:3000
- **PgAdmin**: http://localhost:5050 (admin@cdf.local)
- **Redis Commander**: http://localhost:8081
- **MinIO Console**: http://localhost:9001
- **MailHog**: http://localhost:8025

### Health Check Endpoints
- **PostgreSQL**: `docker exec cdf-postgres pg_isready -U postgres`
- **Redis**: `docker exec cdf-redis redis-cli ping`
- **MinIO**: http://localhost:9000/minio/health/live

## 🛡️ Security Best Practices

### 1. Password Management
- Use strong, unique passwords for each service
- Store passwords in `.env.docker`, never in code
- Rotate passwords regularly

### 2. Network Security
- Remove external port exposure in production
- Use internal service names for communication
- Implement firewall rules for additional protection

### 3. Container Security
- Regular image updates and vulnerability scanning
- Use specific image tags, not `latest`
- Run containers with minimal privileges

### 4. Data Protection
- Regular database backups
- Encrypted storage volumes in production
- Secure backup and recovery procedures

## 🚨 Production Considerations

### Remove External Access
Edit `docker-compose.security.yml` and uncomment port removal:
```yaml
postgres:
  ports: []  # Remove external database access
```

### Use Docker Secrets
For production, consider Docker secrets instead of environment variables:
```yaml
secrets:
  db_password:
    external: true
services:
  postgres:
    secrets:
      - db_password
```

### Monitoring
Add logging and monitoring for production:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 📊 Troubleshooting

### Common Issues

1. **Permission Errors**:
   ```bash
   # Fix volume permissions
   sudo chown -R 999:999 ./postgres_data
   ```

2. **Memory Issues**:
   ```bash
   # Check resource usage
   docker stats
   
   # Adjust limits in docker-compose.yml if needed
   ```

3. **Network Connectivity**:
   ```bash
   # Test service connectivity
   docker exec cdf-api-gateway ping postgres
   ```

### Useful Commands
```bash
# Check all container status
docker-compose ps

# View resource usage
docker stats --no-stream

# Clean up unused resources
docker system prune -f

# Backup database
docker exec cdf-postgres pg_dump -U postgres cdf_smarthub > backup.sql
```

## 🔄 Updates and Maintenance

### Regular Tasks
1. Update Docker images monthly
2. Monitor resource usage and adjust limits
3. Rotate passwords quarterly  
4. Review and update security configurations
5. Test backup and recovery procedures

### Image Updates
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose --env-file .env.docker up -d --force-recreate
```