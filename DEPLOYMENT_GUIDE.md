# 🚀 Deployment Guide - Amantena Highway Farms

This guide provides step-by-step instructions for deploying the Amantena Highway Farms Business Management App to production.

## 🎯 Deployment Overview

The application consists of:
- **Frontend**: React.js app → Deploy to Netlify
- **Backend**: Node.js API → Deploy to Railway/Render
- **Database**: PostgreSQL → Neon (cloud hosted)
- **Images**: Cloudinary (cloud storage)

## 📋 Pre-Deployment Checklist

### 1. Required Accounts
- [ ] GitHub account (for code repository)
- [ ] Netlify account (for frontend hosting)
- [ ] Railway or Render account (for backend hosting)
- [ ] Neon account (for PostgreSQL database)
- [ ] Cloudinary account (for image storage)
- [ ] Gmail account (for email service)

### 2. Environment Variables Setup
Create accounts and gather these credentials:

```env
# Database (Neon)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Session Security
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (will be updated after Netlify deployment)
FRONTEND_URL=https://your-app.netlify.app

# Backend URL (will be updated after Railway/Render deployment)
REACT_APP_API_URL=https://your-backend.railway.app/api
```

## 🗄️ Step 1: Database Setup (Neon)

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project named "amantena-farms"

### 1.2 Get Database URL
1. In Neon dashboard, go to "Connection Details"
2. Copy the connection string
3. It should look like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

### 1.3 Test Database Connection
```bash
cd backend
echo "DATABASE_URL=your-neon-url" > .env
npx prisma db push
npx prisma generate
npm run seed
```

## ☁️ Step 2: Cloud Storage Setup (Cloudinary)

### 2.1 Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Go to Dashboard

### 2.2 Get Credentials
1. Copy Cloud Name, API Key, and API Secret from dashboard
2. Test upload (optional):
```bash
# Add to backend/.env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Test backend upload endpoint
npm run dev
# Upload test image via frontend
```

## 📧 Step 3: Email Setup (Gmail)

### 3.1 Enable App Passwords
1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not enabled)
3. App passwords → Generate password for "Mail"
4. Copy the 16-character password

### 3.2 Configure Email
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

## 🖥️ Step 4: Backend Deployment (Railway)

### 4.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your repository

### 4.2 Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your repository
3. Railway will auto-detect it's a Node.js app
4. Set root directory to `backend`

### 4.3 Configure Environment Variables
In Railway dashboard, go to Variables tab and add:
```env
DATABASE_URL=your-neon-database-url
SESSION_SECRET=your-session-secret-32-chars-min
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
EMAIL_USER=your-gmail-address
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://your-frontend.netlify.app
NODE_ENV=production
PORT=5000
```

### 4.4 Configure Build Settings
1. In Railway, go to Settings
2. Set Build Command: `npm install && npx prisma generate && npx prisma db push`
3. Set Start Command: `npm start`
4. Set Root Directory: `backend`

### 4.5 Deploy
1. Railway will automatically deploy
2. Get your backend URL from Railway dashboard
3. Test: `https://your-backend.railway.app/api/health`

## 🌐 Step 5: Frontend Deployment (Netlify)

### 5.1 Build Frontend Locally
```bash
cd frontend
echo "REACT_APP_API_URL=https://your-backend.railway.app/api" > .env
npm run build
```

### 5.2 Deploy to Netlify
#### Option A: Drag & Drop
1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Drag the `frontend/build` folder to Netlify
4. Get your site URL

#### Option B: Git Integration
1. In Netlify, click "New site from Git"
2. Connect GitHub and select repository
3. Set build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`

### 5.3 Configure Environment Variables
In Netlify, go to Site settings → Environment variables:
```env
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_SOCKET_URL=https://your-backend.railway.app
```

### 5.4 Update Backend with Frontend URL
Go back to Railway and update:
```env
FRONTEND_URL=https://your-frontend.netlify.app
```

## 🔧 Step 6: Final Configuration

### 6.1 Update CORS Settings
Your backend is already configured for production CORS. The origins will automatically include your Netlify URL.

### 6.2 Test Full Deployment
1. Visit your Netlify URL
2. Try logging in with demo credentials:
   - Admin: `admin@amantena.com` / `admin123`
   - Staff: `staff@amantena.com` / `staff123`
3. Test key features:
   - Record a sale
   - Upload an image
   - Send an invitation (Admin)
   - Create a calendar event

### 6.3 Setup Custom Domain (Optional)
#### Netlify Custom Domain
1. In Netlify: Site settings → Domain management
2. Add custom domain
3. Configure DNS settings

#### Railway Custom Domain
1. In Railway: Settings → Domains
2. Add custom domain
3. Update DNS records

## 🚀 Automated Deployment

### Using Deployment Scripts

#### Linux/Mac
```bash
# Production deployment
./deploy.sh production

# Health check
./deploy.sh health
```

#### Windows
```powershell
# Production deployment
.\deploy.ps1 -DeploymentType production

# Health check
.\deploy.ps1 -DeploymentType health
```

## 🔍 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check Railway logs
railway logs

# Common fixes:
# 1. Verify DATABASE_URL is correct
# 2. Check if Prisma client is generated
# 3. Verify all environment variables are set
```

#### Frontend Build Errors
```bash
# Check build logs in Netlify
# Common fixes:
# 1. Verify REACT_APP_API_URL is set
# 2. Check for missing dependencies
# 3. Verify Node.js version compatibility
```

#### Database Connection Issues
```bash
# Test database connection
cd backend
npx prisma db push
npx prisma studio

# Common fixes:
# 1. Verify Neon database URL
# 2. Check SSL mode in connection string
# 3. Verify database exists and is accessible
```

#### CORS Errors
```bash
# Check browser console for CORS errors
# Common fixes:
# 1. Verify FRONTEND_URL in backend environment
# 2. Check API URL in frontend environment
# 3. Ensure HTTPS is used in production
```

## 📊 Post-Deployment Monitoring

### Health Checks
- Backend: `https://your-backend.railway.app/api/health`
- Frontend: `https://your-frontend.netlify.app`
- Database: Check Railway logs for connection status

### Performance Monitoring
- Railway: Built-in metrics dashboard
- Netlify: Analytics and performance insights
- Neon: Database performance metrics

### Log Monitoring
```bash
# Railway logs
railway logs --tail

# Netlify function logs (if using functions)
netlify logs
```

## 🔐 Security Checklist

- [ ] Environment variables are set in hosting platforms (not in code)
- [ ] SESSION_SECRET is secure (32+ characters)
- [ ] Database uses SSL connection
- [ ] HTTPS is enabled on both frontend and backend
- [ ] CORS is properly configured
- [ ] Gmail app password is used (not regular password)
- [ ] Cloudinary API secrets are secure

## 📈 Scaling Considerations

### Database Scaling
- Neon automatically scales
- Monitor connection limits
- Consider read replicas for heavy read workloads

### Backend Scaling
- Railway auto-scales based on traffic
- Monitor CPU and memory usage
- Consider implementing Redis for sessions if needed

### Frontend Scaling
- Netlify CDN handles global distribution
- Static assets are automatically cached
- Consider implementing service workers for offline support

## 🎉 Deployment Complete!

Your Amantena Highway Farms Business Management App is now live!

### Access URLs:
- **Frontend**: https://your-app.netlify.app
- **Backend API**: https://your-backend.railway.app/api
- **Database**: Managed by Neon
- **Images**: Stored in Cloudinary

### Demo Accounts:
- **Admin**: admin@amantena.com / admin123
- **Staff**: staff@amantena.com / staff123

### Next Steps:
1. Share the frontend URL with your team
2. Create real user accounts
3. Import your actual product data
4. Configure backup strategies
5. Set up monitoring and alerts

**🌾 Your farm management system is ready for use! 🚀**
