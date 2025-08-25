#!/bin/bash

# Wave 8: Enterprise Deployment & Monitoring Script
# Production-ready deployment with full observability

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="erp-webapp"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_REPO="${DOCKER_REPO:-renpereiradx/erp-webapp}"
VERSION="${VERSION:-$(git rev-parse --short HEAD)}"
ENVIRONMENT="${ENVIRONMENT:-production}"
NAMESPACE="${NAMESPACE:-erp-webapp}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Deployment failed at line $1 with exit code $exit_code"
    cleanup
    exit $exit_code
}

trap 'handle_error $LINENO' ERR

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Pre-deployment checks
check_prerequisites() {
    log_info "🔍 Checking prerequisites..."
    
    # Check required tools
    local required_tools=("node" "pnpm" "docker" "kubectl" "helm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_node="18.0.0"
    if ! printf '%s\n%s\n' "$required_node" "$node_version" | sort -V -C; then
        log_error "Node.js version $node_version is too old. Required: $required_node+"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build and test
build_and_test() {
    log_info "🔨 Building and testing application..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Run linting
    log_info "Running linting..."
    pnpm run lint || {
        log_error "Linting failed"
        exit 1
    }
    
    # Run type checking
    log_info "Running type checking..."
    if [ -f "tsconfig.json" ]; then
        pnpm run type-check || {
            log_error "Type checking failed"
            exit 1
        }
    fi
    
    # Run tests
    log_info "Running test suite..."
    pnpm run test:coverage || {
        log_error "Tests failed"
        exit 1
    }
    
    # Check test coverage
    local coverage=$(grep -o '"lines":{"pct":[0-9.]*' coverage/coverage-summary.json | cut -d':' -f3 || echo "0")
    local min_coverage=85
    if (( $(echo "$coverage < $min_coverage" | bc -l) )); then
        log_error "Test coverage ($coverage%) is below minimum ($min_coverage%)"
        exit 1
    fi
    log_success "Test coverage: $coverage%"
    
    # Build application
    log_info "Building application..."
    pnpm run build
    
    # Analyze bundle size
    log_info "Analyzing bundle size..."
    analyze_bundle_size
    
    log_success "Build and test completed"
}

# Bundle size analysis
analyze_bundle_size() {
    if [ -d "dist" ]; then
        local total_size=$(du -sb dist | cut -f1)
        local total_size_mb=$((total_size / 1024 / 1024))
        local max_size_mb=5
        
        log_info "Bundle analysis:"
        find dist -name "*.js" -exec ls -lh {} \; | awk '{print "  " $9 " - " $5}'
        log_info "Total bundle size: ${total_size_mb}MB"
        
        if [ $total_size_mb -gt $max_size_mb ]; then
            log_warning "Bundle size (${total_size_mb}MB) exceeds recommended limit (${max_size_mb}MB)"
        fi
    fi
}

# Security scanning
security_scan() {
    log_info "🔒 Running security scans..."
    
    # Dependency audit
    log_info "Running dependency audit..."
    pnpm audit --audit-level moderate || {
        log_warning "Some security vulnerabilities found in dependencies"
    }
    
    # Container security scan (if Trivy is available)
    if command -v trivy &> /dev/null; then
        log_info "Scanning container image for vulnerabilities..."
        trivy image --severity HIGH,CRITICAL "$DOCKER_REPO:$VERSION" || {
            log_warning "Container vulnerabilities found"
        }
    fi
    
    log_success "Security scan completed"
}

# Docker operations
build_docker_image() {
    log_info "🐳 Building Docker image..."
    
    local image_tag="$DOCKER_REPO:$VERSION"
    local latest_tag="$DOCKER_REPO:latest"
    
    # Build multi-platform image
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag "$image_tag" \
        --tag "$latest_tag" \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --build-arg VCS_REF="$(git rev-parse HEAD)" \
        --push \
        .
    
    log_success "Docker image built and pushed: $image_tag"
}

# Kubernetes deployment
deploy_to_kubernetes() {
    log_info "☸️  Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configurations
    log_info "Applying Kubernetes configurations..."
    
    # Replace image tag in deployment
    sed -i.bak "s|erp-webapp:latest|$DOCKER_REPO:$VERSION|g" k8s/deployment.yaml
    
    # Apply all configurations
    kubectl apply -f k8s/ -n "$NAMESPACE"
    
    # Restore original deployment file
    mv k8s/deployment.yaml.bak k8s/deployment.yaml
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl rollout status deployment/erp-webapp -n "$NAMESPACE" --timeout=600s
    
    # Get deployment info
    log_info "Deployment status:"
    kubectl get pods -n "$NAMESPACE" -l app=erp-webapp
    
    log_success "Kubernetes deployment completed"
}

# Health checks
run_health_checks() {
    log_info "🏥 Running health checks..."
    
    # Get service URL
    local service_url
    if kubectl get ingress erp-webapp-ingress -n "$NAMESPACE" &> /dev/null; then
        service_url="https://$(kubectl get ingress erp-webapp-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}')"
    else
        # Port forward for testing
        kubectl port-forward service/erp-webapp-service 8080:80 -n "$NAMESPACE" &
        local port_forward_pid=$!
        sleep 5
        service_url="http://localhost:8080"
    fi
    
    # Health check endpoint
    log_info "Checking health endpoint..."
    if curl -f "$service_url/health" > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
    
    # Performance check with Lighthouse (if available)
    if command -v lighthouse &> /dev/null; then
        log_info "Running Lighthouse performance audit..."
        lighthouse "$service_url" \
            --only-categories=performance,pwa,best-practices \
            --chrome-flags="--headless" \
            --output=json \
            --output-path=./lighthouse-report.json \
            --quiet || {
            log_warning "Lighthouse audit failed"
        }
    fi
    
    # Kill port forward if used
    if [ ! -z "${port_forward_pid:-}" ]; then
        kill $port_forward_pid 2>/dev/null || true
    fi
    
    log_success "Health checks completed"
}

# Monitoring setup
setup_monitoring() {
    log_info "📊 Setting up monitoring..."
    
    # Deploy monitoring stack if not exists
    if ! kubectl get namespace monitoring &> /dev/null; then
        log_info "Deploying monitoring stack..."
        
        # Create monitoring namespace
        kubectl create namespace monitoring
        
        # Deploy Prometheus (using Helm if available)
        if command -v helm &> /dev/null; then
            helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
            helm repo update
            
            helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
                --namespace monitoring \
                --values monitoring/prometheus-values.yaml \
                --wait
        else
            log_warning "Helm not available, monitoring stack not deployed"
        fi
    fi
    
    # Configure alerting rules
    kubectl apply -f monitoring/alerts/ -n monitoring 2>/dev/null || {
        log_warning "Alert rules not applied (files may not exist)"
    }
    
    log_success "Monitoring setup completed"
}

# Rollback function
rollback_deployment() {
    log_warning "🔄 Rolling back deployment..."
    
    kubectl rollout undo deployment/erp-webapp -n "$NAMESPACE"
    kubectl rollout status deployment/erp-webapp -n "$NAMESPACE" --timeout=300s
    
    log_success "Rollback completed"
}

# Notification
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification (if webhook URL is configured)
    if [ ! -z "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"ERP WebApp Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || {
            log_warning "Failed to send Slack notification"
        }
    fi
    
    # Email notification (if configured)
    if [ ! -z "${NOTIFICATION_EMAIL:-}" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "ERP WebApp Deployment $status" "$NOTIFICATION_EMAIL" || {
            log_warning "Failed to send email notification"
        }
    fi
}

# Main deployment function
main() {
    log_info "🚀 Starting Wave 8 Enterprise Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Registry: $DOCKER_REGISTRY"
    
    local start_time=$(date +%s)
    
    # Run deployment steps
    check_prerequisites
    build_and_test
    security_scan
    build_docker_image
    deploy_to_kubernetes
    setup_monitoring
    run_health_checks
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "🎉 Deployment completed successfully in ${duration}s"
    log_info "Application URL: https://erp.company.com"
    log_info "Monitoring: https://grafana.company.com"
    
    # Send success notification
    send_notification "SUCCESS" "ERP WebApp v$VERSION deployed successfully to $ENVIRONMENT in ${duration}s"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health-check")
        run_health_checks
        ;;
    "security-scan")
        security_scan
        ;;
    "monitoring")
        setup_monitoring
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|security-scan|monitoring}"
        exit 1
        ;;
esac
