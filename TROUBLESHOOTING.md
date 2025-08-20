# Sherlock Ω Troubleshooting Guide

## 🔧 Common Issues and Solutions

### Docker Network Issues

**Problem**: Docker image pull failures or network timeouts
```
failed to copy: httpReadSeeker: failed open: failed to do request: Get "https://registry-1.docker.io/v2/library/redis/blobs/...": EOF
```

**Solutions**:
1. **Check Docker Desktop**: Ensure Docker Desktop is running
2. **Network Connectivity**: Verify internet connection
3. **Docker Registry**: Try alternative registry or restart Docker
4. **Manual Pull**: Pre-pull images manually

```bash
# Pre-pull required images
docker pull mongo:latest
docker pull redis:alpine

# Then start services
docker-compose up -d
```

### MongoDB Connection Issues

**Problem**: `ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:
1. **Graceful Degradation**: System continues without MongoDB (expected behavior)
2. **Manual Start**: Start MongoDB manually if needed
3. **Health Check**: Use infrastructure commands

```bash
# Check infrastructure status
npm run ci-cd:infrastructure

# Restart infrastructure
npm run ci-cd:restart

# Manual MongoDB start
docker-compose up -d mongodb
```

### Build System Issues

**Problem**: Build failures or timeout errors

**Solutions**:
1. **Quick Build**: Use fast development pipeline
2. **Interactive Mode**: Use guided setup for complex builds
3. **Error Suggestions**: Follow AI-powered recommendations

```bash
# Quick build (no infrastructure required)
npm run demo:ci-cd-quick

# Interactive build with guidance
npm run build:interactive

# Check build statistics
npm run ci-cd:stats
```

## 🚀 Recommended Workflow

### For Development (No Docker Required)
```bash
# Quick quantum simulation
npm run demo:ci-cd-quick

# Interactive build wizard
npm run build:interactive
```

### For Full Infrastructure Testing
```bash
# Start complete system
npm start

# Or step by step
npm run ci-cd:infrastructure
npm run dashboard:interactive
```

### For CI/CD Testing
```bash
# Local pipeline test
npm run demo:ci-cd

# GitHub Actions (push to trigger)
git push origin main
```

## 📊 System Status Commands

```bash
# Infrastructure health
npm run ci-cd:infrastructure

# Build statistics
npm run ci-cd:stats

# Restart services
npm run ci-cd:restart
```

## 🎯 Expected Behavior

- **With Docker**: Full infrastructure with MongoDB/Redis
- **Without Docker**: Graceful degradation, builds still work
- **Network Issues**: System continues with local simulation
- **MongoDB Down**: Builds complete, logging skipped gracefully

The system is designed to work in all scenarios! 🚀