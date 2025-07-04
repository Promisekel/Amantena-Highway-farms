#!/bin/bash

# Quick Setup Script for Amantena Highway Farms
# This script provides a guided setup for quick deployment

echo "🌾 Welcome to Amantena Highway Farms Quick Setup!"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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

# Ask user for deployment type
echo "Choose your deployment method:"
echo "1. Development (local with hot reload)"
echo "2. Docker (containerized local deployment)"
echo "3. Cloud (production deployment guide)"
echo "4. Demo setup (quick demo with sample data)"
echo ""
read -p "Enter your choice (1-4): " deployment_choice

case $deployment_choice in
    1)
        deployment_type="development"
        ;;
    2)
        deployment_type="docker"
        ;;
    3)
        deployment_type="cloud"
        ;;
    4)
        deployment_type="demo"
        ;;
    *)
        print_error "Invalid choice. Defaulting to development."
        deployment_type="development"
        ;;
esac

print_step "Selected deployment type: $deployment_type"
echo ""

# Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

node_version=$(node --version)
print_success "Node.js found: $node_version"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

npm_version=$(npm --version)
print_success "npm found: $npm_version"

# Check Docker if needed
if [ "$deployment_type" = "docker" ]; then
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Download from: https://docker.com/"
        exit 1
    fi
    
    docker_version=$(docker --version)
    print_success "Docker found: $docker_version"
fi

echo ""

# Environment setup
print_step "Setting up environment..."

# Check if we need to create environment files
if [ ! -f ".env" ]; then
    if [ "$deployment_type" = "docker" ]; then
        if [ -f ".env.docker" ]; then
            cp .env.docker .env
            print_success "Created .env from .env.docker template"
        fi
    else
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from .env.example template"
        fi
    fi
fi

# Ask about demo credentials
if [ "$deployment_type" = "demo" ] || [ "$deployment_type" = "development" ]; then
    echo ""
    echo "Do you want to use demo credentials for quick setup?"
    echo "This includes:"
    echo "- Demo database (Neon)"
    echo "- Demo Cloudinary account"
    echo "- Demo email settings"
    echo ""
    read -p "Use demo credentials? (y/n): " use_demo

    if [ "$use_demo" = "y" ] || [ "$use_demo" = "Y" ]; then
        print_step "Setting up demo credentials..."
        
        # Create demo environment
        cat > .env << EOL
# Demo Environment - Amantena Highway Farms
NODE_ENV=development

# Demo Database (Neon)
DATABASE_URL=postgresql://demo_user:demo_pass@ep-demo.us-east-1.aws.neon.tech/amantena_demo?sslmode=require

# Session Secret
SESSION_SECRET=demo-session-secret-change-in-production-32-chars

# Demo Cloudinary
CLOUDINARY_CLOUD_NAME=dnerhroxc
CLOUDINARY_API_KEY=668351163117448
CLOUDINARY_API_SECRET=k4T-pGbMEP1GDZEzhQQiFyd5xTQ

# Demo Email (disabled in demo mode)
EMAIL_USER=demo@amantena.com
EMAIL_PASSWORD=demo_password

# URLs
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
EOL

        # Copy to backend and frontend
        cp .env backend/.env
        cp .env frontend/.env
        
        print_success "Demo credentials configured!"
        print_warning "Remember to update these for production use!"
    else
        print_warning "You'll need to manually configure environment variables."
        print_warning "See .env.example for required variables."
    fi
fi

echo ""

# Run the deployment
print_step "Starting deployment..."

case $deployment_type in
    "development"|"demo")
        ./deploy.sh development
        ;;
    "docker")
        ./deploy.sh docker
        ;;
    "cloud")
        echo ""
        print_step "Cloud deployment requires manual setup."
        echo "Please follow the DEPLOYMENT_GUIDE.md for detailed instructions."
        echo ""
        echo "Quick links:"
        echo "1. Neon (Database): https://neon.tech/"
        echo "2. Netlify (Frontend): https://netlify.com/"
        echo "3. Railway (Backend): https://railway.app/"
        echo "4. Cloudinary (Images): https://cloudinary.com/"
        echo ""
        echo "Or use our automated cloud deployment:"
        echo "./deploy.sh netlify  # Deploy frontend"
        echo "./deploy.sh railway  # Deploy backend"
        ;;
esac

# Post-deployment instructions
echo ""
print_success "Setup complete!"
echo ""

case $deployment_type in
    "development"|"demo")
        echo "🎉 Your application is running!"
        echo ""
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:5000"
        echo ""
        echo "Demo accounts:"
        echo "Admin:  admin@amantena.com / admin123"
        echo "Staff:  staff@amantena.com / staff123"
        echo ""
        echo "To stop the servers, press Ctrl+C"
        ;;
    "docker")
        echo "🐳 Docker containers are running!"
        echo ""
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:5000"
        echo "Database: localhost:5432"
        echo ""
        echo "Commands:"
        echo "View logs:    docker-compose logs -f"
        echo "Stop:         docker-compose down"
        echo "Restart:      docker-compose restart"
        ;;
    "cloud")
        echo "☁️ Cloud deployment guide provided above."
        echo "Follow DEPLOYMENT_GUIDE.md for complete instructions."
        ;;
esac

echo ""
echo "📚 Documentation:"
echo "- README.md: Complete project documentation"
echo "- DEPLOYMENT_GUIDE.md: Detailed deployment instructions"
echo "- PROJECT_STATUS.md: Feature completion status"
echo ""
echo "🌾 Happy farming with Amantena Highway Farms! 🚀"
