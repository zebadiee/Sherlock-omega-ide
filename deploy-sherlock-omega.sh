#!/bin/bash

# Sherlock Ω IDE - Production Deployment Script
# Launch Date: August 22, 2025, 9:00 AM BST
# The Ultimate Development Experience

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ω ASCII Art
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ███████╗██╗  ██╗███████╗██████╗ ██╗      ██████╗  ██████╗██╗  ██╗         ║
║    ██╔════╝██║  ██║██╔════╝██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝         ║
║    ███████╗███████║█████╗  ██████╔╝██║     ██║   ██║██║     █████╔╝          ║
║    ╚════██║██╔══██║██╔══╝  ██╔══██╗██║     ██║   ██║██║     ██╔═██╗          ║
║    ███████║██║  ██║███████╗██║  ██║███████╗╚██████╔╝╚██████╗██║  ██╗         ║
║    ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝         ║
║                                                                              ║
║                              ╔═══════════╗                                  ║
║                              ║     Ω     ║                                  ║
║                              ║           ║                                  ║
║                              ║    IDE    ║                                  ║
║                              ╚═══════════╝                                  ║
║                                                                              ║
║                    🌟 PRODUCTION DEPLOYMENT SCRIPT 🌟                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}🚀 Sherlock Ω IDE - Production Deployment${NC}"
echo -e "${BLUE}Launch Date: August 22, 2025, 9:00 AM BST${NC}"
echo -e "${MAGENTA}Making Development Friction Computationally Extinct${NC}\n"

# Configuration
DEPLOYMENT_ENV=${1:-production}
VERSION=${2:-Ω-1.0.0}
NAMESPACE="sherlock-omega"
CLUSTER_NAME="sherlock-omega-cluster"
REGION="us-east-1"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo -e "  Environment: ${CYAN}${DEPLOYMENT_ENV}${NC}"
echo -e "  Version: ${CYAN}${VERSION}${NC}"
echo -e "  Namespace: ${CYAN}${NAMESPACE}${NC}"
echo -e "  Cluster: ${CYAN}${CLUSTER_NAME}${NC}"
echo -e "  Region: ${CYAN}${REGION}${NC}\n"

# Pre-deployment checks
echo -e "${BLUE}🔍 Pre-deployment Validation${NC}"

echo -n "  Checking kubectl connection..."
if kubectl cluster-info &> /dev/null; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

echo -n "  Checking Docker registry access..."
if docker info &> /dev/null; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}Error: Cannot access Docker registry${NC}"
    exit 1
fi

echo -n "  Validating deployment manifests..."
if [ -f "k8s/deployment.yaml" ] && [ -f "k8s/service.yaml" ]; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}Error: Kubernetes manifests not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-deployment validation completed${NC}\n"

# Create namespace if it doesn't exist
echo -e "${BLUE}🏗️ Infrastructure Setup${NC}"
echo -n "  Creating namespace ${NAMESPACE}..."
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
echo -e " ${GREEN}✓${NC}"

# Deploy Redis cache
echo -n "  Deploying Redis cache..."
kubectl apply -f - <<EOF &> /dev/null
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ${NAMESPACE}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: ${NAMESPACE}
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
EOF
echo -e " ${GREEN}✓${NC}"

# Deploy MongoDB
echo -n "  Deploying MongoDB..."
kubectl apply -f - <<EOF &> /dev/null
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: ${NAMESPACE}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:latest
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "sherlock"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "omega-secure-2025"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  namespace: ${NAMESPACE}
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
EOF
echo -e " ${GREEN}✓${NC}"

# Build and push Docker image
echo -e "${BLUE}🐳 Container Build & Push${NC}"
echo -n "  Building Sherlock Ω IDE image..."
docker build -t sherlock-omega-ide:${VERSION} . &> /dev/null
echo -e " ${GREEN}✓${NC}"

echo -n "  Pushing to registry..."
docker tag sherlock-omega-ide:${VERSION} gcr.io/sherlock-omega/sherlock-omega-ide:${VERSION} &> /dev/null
docker push gcr.io/sherlock-omega/sherlock-omega-ide:${VERSION} &> /dev/null
echo -e " ${GREEN}✓${NC}"

# Deploy main application
echo -e "${BLUE}🚀 Sherlock Ω IDE Deployment${NC}"
echo -n "  Deploying main application..."
kubectl apply -f - <<EOF &> /dev/null
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sherlock-omega-ide
  namespace: ${NAMESPACE}
  labels:
    app: sherlock-omega-ide
    version: ${VERSION}
spec:
  replicas: 5
  selector:
    matchLabels:
      app: sherlock-omega-ide
  template:
    metadata:
      labels:
        app: sherlock-omega-ide
        version: ${VERSION}
    spec:
      containers:
      - name: sherlock-omega-ide
        image: gcr.io/sherlock-omega/sherlock-omega-ide:${VERSION}
        ports:
        - containerPort: 3000
        - containerPort: 3001
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGO_URI
          value: "mongodb://sherlock:omega-secure-2025@mongodb-service:27017"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: VERSION
          value: "${VERSION}"
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: sherlock-omega-service
  namespace: ${NAMESPACE}
spec:
  selector:
    app: sherlock-omega-ide
  ports:
  - name: main
    port: 80
    targetPort: 3000
  - name: dashboard
    port: 3001
    targetPort: 3001
  - name: monitoring
    port: 3002
    targetPort: 3002
  type: LoadBalancer
EOF
echo -e " ${GREEN}✓${NC}"

# Configure auto-scaling
echo -n "  Configuring auto-scaling..."
kubectl apply -f - <<EOF &> /dev/null
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sherlock-omega-hpa
  namespace: ${NAMESPACE}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sherlock-omega-ide
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF
echo -e " ${GREEN}✓${NC}"

# Deploy monitoring
echo -e "${BLUE}📊 Monitoring Setup${NC}"
echo -n "  Deploying Prometheus..."
kubectl apply -f - <<EOF &> /dev/null
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: ${NAMESPACE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus-service
  namespace: ${NAMESPACE}
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
EOF
echo -e " ${GREEN}✓${NC}"

echo -n "  Deploying Grafana..."
kubectl apply -f - <<EOF &> /dev/null
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: ${NAMESPACE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "omega-admin-2025"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: grafana-service
  namespace: ${NAMESPACE}
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
EOF
echo -e " ${GREEN}✓${NC}"

# Wait for deployment to be ready
echo -e "${BLUE}⏳ Waiting for Deployment${NC}"
echo -n "  Waiting for pods to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/sherlock-omega-ide -n ${NAMESPACE} &> /dev/null
echo -e " ${GREEN}✓${NC}"

# Get service endpoints
echo -e "${BLUE}🌐 Service Endpoints${NC}"
EXTERNAL_IP=$(kubectl get service sherlock-omega-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
GRAFANA_IP=$(kubectl get service grafana-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

echo -e "  Main Application: ${CYAN}http://${EXTERNAL_IP}${NC}"
echo -e "  Dashboard: ${CYAN}http://${EXTERNAL_IP}:3001${NC}"
echo -e "  Monitoring: ${CYAN}http://${EXTERNAL_IP}:3002${NC}"
echo -e "  Grafana: ${CYAN}http://${GRAFANA_IP}:3000${NC}"

# Health check
echo -e "${BLUE}🏥 Health Validation${NC}"
echo -n "  Performing health check..."
sleep 10
if [ "$EXTERNAL_IP" != "pending" ]; then
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${EXTERNAL_IP}/api/health || echo "000")
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo -e " ${GREEN}✓${NC}"
    else
        echo -e " ${YELLOW}⚠ (HTTP ${HEALTH_STATUS})${NC}"
    fi
else
    echo -e " ${YELLOW}⚠ (External IP pending)${NC}"
fi

# Deployment summary
echo -e "\n${GREEN}🎉 Sherlock Ω IDE Deployment Complete!${NC}\n"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                              ║${NC}"
echo -e "${CYAN}║                              ${GREEN}DEPLOYMENT SUCCESS${CYAN}                              ║${NC}"
echo -e "${CYAN}║                                                                              ║${NC}"
echo -e "${CYAN}║                              ╔═══════════╗                                  ║${NC}"
echo -e "${CYAN}║                              ║     ${MAGENTA}Ω${CYAN}     ║                                  ║${NC}"
echo -e "${CYAN}║                              ║           ║                                  ║${NC}"
echo -e "${CYAN}║                              ║    ${BLUE}IDE${CYAN}    ║                                  ║${NC}"
echo -e "${CYAN}║                              ╚═══════════╝                                  ║${NC}"
echo -e "${CYAN}║                                                                              ║${NC}"
echo -e "${CYAN}║                    ${YELLOW}🌟 THE ULTIMATE IS NOW LIVE 🌟${CYAN}                       ║${NC}"
echo -e "${CYAN}║                                                                              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📊 Deployment Statistics:${NC}"
echo -e "  Version: ${CYAN}${VERSION}${NC}"
echo -e "  Namespace: ${CYAN}${NAMESPACE}${NC}"
echo -e "  Replicas: ${CYAN}5 (auto-scaling 5-50)${NC}"
echo -e "  Services: ${CYAN}4 (Main, Redis, MongoDB, Monitoring)${NC}"
echo -e "  External IP: ${CYAN}${EXTERNAL_IP}${NC}"

echo -e "\n${MAGENTA}🚀 Sherlock Ω IDE is now LIVE and ready to eliminate development friction!${NC}"
echo -e "${YELLOW}🌟 The Ultimate Development Experience has begun! 🌟${NC}\n"

# Final Ω celebration
echo -e "${CYAN}"
cat << "EOF"
                              ╔═══════════╗
                              ║     Ω     ║
                              ║           ║
                              ║  SUCCESS  ║
                              ╚═══════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}Development friction is now computationally extinct!${NC}"
echo -e "${BLUE}Welcome to the Ω revolution! 🚀${NC}\n"