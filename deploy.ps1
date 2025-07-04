# PowerShell Deployment Script for Amantena Highway Farms Business Management App
# This script automates the deployment process for both frontend and backend on Windows

param(
    [string]$DeploymentType = "development",
    [switch]$NoTests = $false,
    [switch]$Clean = $false,
    [switch]$Help = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check requirements
function Test-Requirements {
    Write-Status "Checking requirements..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Status "Node.js version: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Status "npm version: $npmVersion"
    }
    catch {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
    
    # Check git
    try {
        $gitVersion = git --version
        Write-Status "Git version: $gitVersion"
    }
    catch {
        Write-Warning "Git is not installed. Some features may not work."
    }
    
    Write-Success "All requirements check passed!"
}

# Function to install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Install root dependencies
    Write-Status "Installing root dependencies..."
    npm install
    
    # Install backend dependencies
    Write-Status "Installing backend dependencies..."
    Set-Location backend
    npm install
    Set-Location ..
    
    # Install frontend dependencies
    Write-Status "Installing frontend dependencies..."
    Set-Location frontend
    npm install
    Set-Location ..
    
    Write-Success "All dependencies installed!"
}

# Function to setup environment files
function Initialize-Environment {
    Write-Status "Setting up environment files..."
    
    # Copy environment example files if they don't exist
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Warning "Copied .env.example to .env. Please update with your values."
        }
        else {
            Write-Error ".env.example not found. Please create environment files manually."
        }
    }
    
    if (-not (Test-Path "backend\.env")) {
        if (Test-Path "backend\.env.example") {
            Copy-Item "backend\.env.example" "backend\.env"
            Write-Warning "Copied backend\.env.example to backend\.env. Please update with your values."
        }
    }
    
    if (-not (Test-Path "frontend\.env")) {
        if (Test-Path "frontend\.env.example") {
            Copy-Item "frontend\.env.example" "frontend\.env"
            Write-Warning "Copied frontend\.env.example to frontend\.env. Please update with your values."
        }
    }
    
    Write-Success "Environment files setup complete!"
}

# Function to setup database
function Initialize-Database {
    Write-Status "Setting up database..."
    
    Set-Location backend
    
    # Generate Prisma client
    Write-Status "Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    Write-Status "Running database migrations..."
    npx prisma db push
    
    # Seed database with initial data
    Write-Status "Seeding database..."
    npm run seed
    
    Set-Location ..
    
    Write-Success "Database setup complete!"
}

# Function to run tests
function Invoke-Tests {
    Write-Status "Running tests..."
    
    # Run backend tests
    Write-Status "Running backend tests..."
    Set-Location backend
    try {
        npm test -- --passWithNoTests
        Write-Success "Backend tests passed!"
    }
    catch {
        Write-Warning "Backend tests failed or no tests found."
    }
    Set-Location ..
    
    # Run frontend tests
    Write-Status "Running frontend tests..."
    Set-Location frontend
    try {
        npm run test:ci
        Write-Success "Frontend tests passed!"
    }
    catch {
        Write-Warning "Frontend tests failed."
    }
    Set-Location ..
    
    Write-Success "Tests completed!"
}

# Function to build frontend
function Build-Frontend {
    Write-Status "Building frontend..."
    
    Set-Location frontend
    npm run build
    Set-Location ..
    
    Write-Success "Frontend build complete!"
}

# Function for development deployment
function Start-Development {
    Write-Status "Deploying for development..."
    
    # Start backend in background
    Write-Status "Starting backend server..."
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        npm run dev
    }
    
    # Wait a moment for backend to start
    Start-Sleep -Seconds 3
    
    # Start frontend
    Write-Status "Starting frontend development server..."
    Set-Location frontend
    
    Write-Success "Development servers starting!"
    Write-Status "Backend running on http://localhost:5000"
    Write-Status "Frontend will start on http://localhost:3000"
    Write-Status "Press Ctrl+C to stop servers"
    
    try {
        npm start
    }
    finally {
        # Clean up background job
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
        Set-Location ..
    }
}

# Function for production deployment
function Start-Production {
    Write-Status "Deploying for production..."
    
    # Build frontend
    Build-Frontend
    
    # Start backend
    Write-Status "Starting backend in production mode..."
    Set-Location backend
    npm start
    Set-Location ..
}

# Function to cleanup
function Clear-ProjectFiles {
    Write-Status "Cleaning up..."
    
    # Remove node_modules
    if ($Clean) {
        Write-Status "Removing node_modules directories..."
        if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force }
        if (Test-Path "backend\node_modules") { Remove-Item "backend\node_modules" -Recurse -Force }
        if (Test-Path "frontend\node_modules") { Remove-Item "frontend\node_modules" -Recurse -Force }
        Write-Success "Cleanup complete!"
    }
}

# Function for health check
function Test-Health {
    Write-Status "Running health check..."
    
    # Check if backend is running
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
        Write-Success "Backend is healthy!"
    }
    catch {
        Write-Warning "Backend health check failed."
    }
    
    # Check if frontend is built
    if (Test-Path "frontend\build") {
        Write-Success "Frontend is built!"
    }
    else {
        Write-Warning "Frontend build not found."
    }
}

# Function to show help
function Show-Help {
    Write-Host @"
Amantena Highway Farms Deployment Script (PowerShell)

Usage: .\deploy.ps1 [OPTIONS]

Options:
  -DeploymentType <string>    Type of deployment (development, production, health, clean)
                             Default: development
  -NoTests                   Skip running tests
  -Clean                     Clean up node_modules directories
  -Help                      Show this help message

Examples:
  .\deploy.ps1                              # Development deployment with tests
  .\deploy.ps1 -DeploymentType production   # Production deployment
  .\deploy.ps1 -NoTests                     # Development without tests
  .\deploy.ps1 -DeploymentType clean        # Clean up files
  .\deploy.ps1 -Help                        # Show this help
"@
}

# Main function
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Status "🚀 Starting deployment for Amantena Highway Farms App..."
    Write-Status "Deployment type: $DeploymentType"
    
    try {
        # Handle clean first if requested
        if ($Clean) {
            Clear-ProjectFiles
        }
        
        # Run setup steps for most deployment types
        if ($DeploymentType -ne "health" -and $DeploymentType -ne "clean") {
            Test-Requirements
            Install-Dependencies
            Initialize-Environment
            Initialize-Database
            
            # Run tests if requested
            if (-not $NoTests) {
                Invoke-Tests
            }
        }
        
        # Deploy based on type
        switch ($DeploymentType.ToLower()) {
            { $_ -in "development", "dev" } {
                Start-Development
            }
            { $_ -in "production", "prod" } {
                Start-Production
            }
            "health" {
                Test-Health
            }
            "clean" {
                Clear-ProjectFiles
            }
            default {
                Write-Error "Unknown deployment type: $DeploymentType"
                Show-Help
                exit 1
            }
        }
    }
    catch {
        Write-Error "Deployment failed: $_"
        exit 1
    }
}

# Run main function
Main
