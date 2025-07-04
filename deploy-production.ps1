# Production Deployment Script for Amantena Highway Farms
param(
    [string]$Platform = "netlify", # netlify, railway, render
    [switch]$BuildOnly = $false,
    [switch]$Help = $false
)

function Write-Info {
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

if ($Help) {
    Write-Host @"
Amantena Highway Farms Production Deployment Script

Usage: .\deploy-production.ps1 [OPTIONS]

Options:
  -Platform <string>    Deployment platform (netlify, railway, render)
                       Default: netlify
  -BuildOnly           Only build the application without deploying
  -Help                Show this help message

Examples:
  .\deploy-production.ps1                    # Deploy to Netlify
  .\deploy-production.ps1 -Platform railway # Deploy to Railway
  .\deploy-production.ps1 -BuildOnly         # Build only
  .\deploy-production.ps1 -Help              # Show help

Platforms:
  netlify  - Deploy frontend to Netlify, backend to Railway
  railway  - Deploy both frontend and backend to Railway
  render   - Deploy to Render.com
"@
    exit 0
}

Write-Info "🚀 Starting production deployment for Amantena Highway Farms..."
Write-Info "Platform: $Platform"

# Check if production environment files exist
if (!(Test-Path ".env.production")) {
    Write-Warning "Production environment file not found. Using template..."
    Copy-Item ".env.example" ".env.production"
}

if (!(Test-Path "frontend\.env.production")) {
    Write-Warning "Frontend production environment file not found. Creating..."
    @"
REACT_APP_API_URL=https://api.amantena.com/api
REACT_APP_CLOUDINARY_CLOUD_NAME=dnerhroxc
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
"@ | Out-File -FilePath "frontend\.env.production" -Encoding UTF8
}

if (!(Test-Path "backend\.env.production")) {
    Write-Warning "Backend production environment file not found. Creating..."
    Copy-Item "backend\.env" "backend\.env.production"
}

Write-Info "Building application for production..."

# Build Frontend
Write-Info "Building frontend..."
Set-Location "frontend"
if ($LASTEXITCODE -eq 0) {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend build completed successfully!"
    } else {
        Write-Error "Frontend build failed!"
        exit 1
    }
} else {
    Write-Error "Failed to change to frontend directory!"
    exit 1
}

Set-Location ".."

# Build Backend (generate Prisma client)
Write-Info "Preparing backend..."
Set-Location "backend"
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend prepared successfully!"
} else {
    Write-Error "Backend preparation failed!"
    exit 1
}

Set-Location ".."

if ($BuildOnly) {
    Write-Success "Build completed! Ready for deployment."
    Write-Info "Frontend build: frontend/build/"
    Write-Info "Backend ready: backend/"
    exit 0
}

Write-Info "🌐 Deploying to $Platform..."

switch ($Platform) {
    "netlify" {
        Write-Info "Deploying frontend to Netlify..."
        Write-Info "1. Install Netlify CLI: npm install -g netlify-cli"
        Write-Info "2. Login to Netlify: netlify login"
        Write-Info "3. Deploy: netlify deploy --prod --dir=frontend/build"
        Write-Info ""
        Write-Info "Deploying backend to Railway..."
        Write-Info "1. Install Railway CLI: npm install -g @railway/cli"
        Write-Info "2. Login to Railway: railway login"
        Write-Info "3. Deploy: railway up"
    }
    "railway" {
        Write-Info "Deploying to Railway..."
        Write-Info "1. Install Railway CLI: npm install -g @railway/cli"
        Write-Info "2. Login to Railway: railway login"
        Write-Info "3. Create project: railway new"
        Write-Info "4. Deploy: railway up"
    }
    "render" {
        Write-Info "Deploying to Render..."
        Write-Info "1. Push code to GitHub repository"
        Write-Info "2. Connect Render to your GitHub repo"
        Write-Info "3. Use render.yaml for configuration"
        Write-Info "4. Deploy automatically via Render dashboard"
    }
    default {
        Write-Error "Unknown platform: $Platform"
        Write-Info "Supported platforms: netlify, railway, render"
        exit 1
    }
}

Write-Success "🎉 Production deployment preparation complete!"
Write-Info ""
Write-Info "📋 Next Steps:"
Write-Info "1. ✅ Code is built and ready for deployment"
Write-Info "2. 🔧 Update production environment variables"
Write-Info "3. 🚀 Follow the platform-specific deployment steps above"
Write-Info "4. 🔒 Configure domain and SSL certificates"
Write-Info "5. 📊 Set up monitoring and logging"
Write-Info ""
Write-Info "🔗 Production URLs:"
Write-Info "Frontend: https://amantena.netlify.app"
Write-Info "Backend API: https://api.amantena.com"
