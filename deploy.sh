#!/bin/bash

# Deployment script for Amantena Highway Farms Business Management App
# This script automates the deployment process for both frontend and backend

set -e  # Exit on any error

echo "🚀 Starting deployment for Amantena Highway Farms App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_warning "Git is not installed. Some features may not work."
    fi
    
    print_success "All requirements check passed!"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_success "All dependencies installed!"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy environment example files if they don't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Copied .env.example to .env. Please update with your values."
        else
            print_error ".env.example not found. Please create environment files manually."
        fi
    fi
    
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_warning "Copied backend/.env.example to backend/.env. Please update with your values."
        fi
    fi
    
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            print_warning "Copied frontend/.env.example to frontend/.env. Please update with your values."
        fi
    fi
    
    print_success "Environment files setup complete!"
}

# Run database setup
setup_database() {
    print_status "Setting up database..."
    
    cd backend
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    print_status "Running database migrations..."
    npx prisma db push
    
    # Seed database with initial data
    print_status "Seeding database..."
    npm run seed
    
    cd ..
    
    print_success "Database setup complete!"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run backend tests
    print_status "Running backend tests..."
    cd backend
    if npm test --passWithNoTests; then
        print_success "Backend tests passed!"
    else
        print_warning "Backend tests failed or no tests found."
    fi
    cd ..
    
    # Run frontend tests
    print_status "Running frontend tests..."
    cd frontend
    if npm run test:ci; then
        print_success "Frontend tests passed!"
    else
        print_warning "Frontend tests failed."
    fi
    cd ..
    
    print_success "Tests completed!"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    npm run build
    cd ..
    
    print_success "Frontend build complete!"
}

# Development deployment
deploy_development() {
    print_status "Deploying for development..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    print_status "Starting frontend development server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Development servers started!"
    print_status "Backend running on http://localhost:5000"
    print_status "Frontend running on http://localhost:3000"
    print_status "Press Ctrl+C to stop servers"
    
    # Wait for interrupt
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
}

# Production deployment
deploy_production() {
    print_status "Deploying for production..."
    
    # Build frontend
    build_frontend
    
    # Start backend
    print_status "Starting backend in production mode..."
    cd backend
    npm start
    cd ..
}

# Docker deployment (optional)
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists for Docker
    if [ ! -f ".env" ]; then
        if [ -f ".env.docker" ]; then
            cp .env.docker .env
            print_warning "Copied .env.docker to .env. Please update with your values."
            print_warning "You need to update DATABASE_URL, CLOUDINARY credentials, and EMAIL settings."
            read -p "Press Enter to continue after updating .env file..."
        else
            print_error ".env file not found. Please create one based on .env.docker template."
            exit 1
        fi
    fi
    
    # Build and run with docker-compose
    print_status "Building Docker images..."
    if command -v docker-compose &> /dev/null; then
        docker-compose down --remove-orphans
        docker-compose build --no-cache
        docker-compose up -d
    else
        docker compose down --remove-orphans
        docker compose build --no-cache
        docker compose up -d
    fi
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Run database setup
    print_status "Setting up database in Docker..."
    if command -v docker-compose &> /dev/null; then
        docker-compose exec backend npx prisma db push
        docker-compose exec backend npm run seed
    else
        docker compose exec backend npx prisma db push
        docker compose exec backend npm run seed
    fi
    
    print_success "Docker deployment complete!"
    print_status "Services are running:"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:5000"
    print_status "Database: localhost:5432"
    print_status ""
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
}

# Production Docker deployment
deploy_docker_production() {
    print_status "Deploying Docker for production..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Use production docker-compose file
    if [ -f "docker-compose.prod.yml" ]; then
        print_status "Using production Docker configuration..."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.prod.yml down --remove-orphans
            docker-compose -f docker-compose.prod.yml build --no-cache
            docker-compose -f docker-compose.prod.yml up -d
        else
            docker compose -f docker-compose.prod.yml down --remove-orphans
            docker compose -f docker-compose.prod.yml build --no-cache
            docker compose -f docker-compose.prod.yml up -d
        fi
    else
        print_error "docker-compose.prod.yml not found."
        exit 1
    fi
    
    print_success "Production Docker deployment complete!"
}

# Cloud deployment helpers
deploy_cloud() {
    local platform=${1:-""}
    
    case $platform in
        "netlify")
            deploy_netlify
            ;;
        "railway")
            deploy_railway
            ;;
        "render")
            deploy_render
            ;;
        "vercel")
            deploy_vercel
            ;;
        *)
            print_error "Unknown cloud platform: $platform"
            echo "Available platforms: netlify, railway, render, vercel"
            exit 1
            ;;
    esac
}

# Netlify deployment
deploy_netlify() {
    print_status "Deploying frontend to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Build frontend
    cd frontend
    npm run build
    
    # Deploy to Netlify
    print_status "Deploying to Netlify..."
    netlify deploy --prod --dir=build
    
    cd ..
    print_success "Frontend deployed to Netlify!"
}

# Railway deployment
deploy_railway() {
    print_status "Deploying backend to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Deploy backend
    cd backend
    print_status "Deploying to Railway..."
    railway login
    railway deploy
    
    cd ..
    print_success "Backend deployed to Railway!"
}

# Render deployment
deploy_render() {
    print_status "Setting up Render deployment..."
    
    print_status "For Render deployment:"
    print_status "1. Connect your GitHub repository to Render"
    print_status "2. Create a Web Service for backend with:"
    print_status "   - Build Command: npm install && npx prisma generate"
    print_status "   - Start Command: npm start"
    print_status "   - Root Directory: backend"
    print_status "3. Create a Static Site for frontend with:"
    print_status "   - Build Command: npm run build"
    print_status "   - Publish Directory: frontend/build"
    print_status "4. Set environment variables in Render dashboard"
    
    print_success "Render deployment guide provided!"
}

# Vercel deployment
deploy_vercel() {
    print_status "Deploying frontend to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy frontend
    cd frontend
    print_status "Deploying to Vercel..."
    vercel --prod
    
    cd ..
    print_success "Frontend deployed to Vercel!"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Remove node_modules
    if [ "$1" = "--clean" ]; then
        print_status "Removing node_modules directories..."
        rm -rf node_modules
        rm -rf backend/node_modules
        rm -rf frontend/node_modules
        print_success "Cleanup complete!"
    fi
}

# Health check
health_check() {
    print_status "Running health check..."
    
    # Check if backend is running
    if curl -s -f "http://localhost:5000/api/health" > /dev/null; then
        print_success "Backend is healthy!"
    else
        print_warning "Backend health check failed."
    fi
    
    # Check if frontend is built
    if [ -d "frontend/build" ]; then
        print_success "Frontend is built!"
    else
        print_warning "Frontend build not found."
    fi
}

# Main deployment function
main() {
    local deployment_type=${1:-"development"}
    local should_test=${2:-"yes"}
    
    print_status "Deployment type: $deployment_type"
    
    # Run setup steps
    check_requirements
    install_dependencies
    setup_environment
    setup_database
    
    # Run tests if requested
    if [ "$should_test" = "yes" ]; then
        run_tests
    fi
    
    # Deploy based on type
    case $deployment_type in
        "development" | "dev")
            deploy_development
            ;;
        "production" | "prod")
            deploy_production
            ;;
        "docker")
            deploy_docker
            ;;
        "docker-prod")
            deploy_docker_production
            ;;
        "cloud")
            deploy_cloud "$2"
            ;;
        "netlify")
            deploy_cloud "netlify"
            ;;
        "railway")
            deploy_cloud "railway"
            ;;
        "render")
            deploy_cloud "render"
            ;;
        "vercel")
            deploy_cloud "vercel"
            ;;
        "health")
            health_check
            ;;
        "clean")
            cleanup --clean
            ;;
        *)
            print_error "Unknown deployment type: $deployment_type"
            echo "Usage: $0 [development|production|docker|docker-prod|cloud|netlify|railway|render|vercel|health|clean] [yes|no]"
            echo "  deployment_type: Type of deployment (default: development)"
            echo "  run_tests: Whether to run tests (default: yes)"
            echo ""
            echo "Cloud platforms:"
            echo "  netlify    Deploy frontend to Netlify"
            echo "  railway    Deploy backend to Railway"
            echo "  render     Deploy to Render (instructions)"
            echo "  vercel     Deploy frontend to Vercel"
            exit 1
            ;;
    esac
}

# Help function
show_help() {
    echo "Amantena Highway Farms Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  development, dev    Deploy for development (default)"
    echo "  production, prod    Deploy for production"
    echo "  docker             Deploy using Docker"
    echo "  docker-prod        Deploy using Docker for production"
    echo "  cloud <platform>   Deploy to cloud platform"
    echo "  netlify           Deploy frontend to Netlify"
    echo "  railway           Deploy backend to Railway"
    echo "  render            Deploy to Render (guide)"
    echo "  vercel            Deploy frontend to Vercel"
    echo "  health            Run health check"
    echo "  clean             Clean up node_modules"
    echo "  help              Show this help message"
    echo ""
    echo "Options:"
    echo "  --no-tests         Skip running tests"
    echo "  --clean            Clean before deployment"
    echo ""
    echo "Examples:"
    echo "  $0                     # Development deployment with tests"
    echo "  $0 production          # Production deployment"
    echo "  $0 docker              # Docker development deployment"
    echo "  $0 docker-prod         # Docker production deployment"
    echo "  $0 netlify             # Deploy frontend to Netlify"
    echo "  $0 railway             # Deploy backend to Railway"
    echo "  $0 cloud netlify       # Deploy to Netlify via cloud command"
    echo "  $0 dev --no-tests      # Development without tests"
    echo "  $0 clean               # Clean up files"
}

# Parse command line arguments
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Handle --no-tests flag
run_tests_flag="yes"
if [[ "$*" == *"--no-tests"* ]]; then
    run_tests_flag="no"
fi

# Handle --clean flag
if [[ "$*" == *"--clean"* ]]; then
    cleanup --clean
fi

# Run main function
main "$1" "$run_tests_flag"
