# 🚀 Production Deployment Guide

## ✅ Ready for Production

Your Amantena Highway Farms application is now fully configured for production deployment with:

- ✅ **Sentry Error Monitoring** (Frontend & Backend)
- ✅ **Production Environment Templates**
- ✅ **Platform-Specific Configurations**
- ✅ **Security Headers & CORS**
- ✅ **Performance Optimizations**

## 🌐 Deployment Options

### Option 1: Netlify + Railway (Recommended)

#### Frontend (Netlify)
1. **Connect Repository**
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Netlify Setup**
   - Go to [netlify.com](https://netlify.com)
   - Connect GitHub repository
   - Build settings will auto-detect from `netlify.toml`
   - Add environment variables:
     ```
     REACT_APP_API_URL=https://amantena-backend.railway.app/api
     REACT_APP_SENTRY_DSN=your-sentry-dsn
     REACT_APP_VERSION=1.0.0
     ```

#### Backend (Railway)
1. **Railway Setup**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository
   - Select backend folder as root directory
   - Add environment variables:
     ```
     DATABASE_URL=your-neon-db-url
     SESSION_SECRET=your-secure-session-secret
     CLOUDINARY_CLOUD_NAME=dnerhroxc
     CLOUDINARY_API_KEY=668351163117448
     CLOUDINARY_API_SECRET=your-secret
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=your-app-password
     FRONTEND_URL=https://your-app.netlify.app
     SENTRY_DSN=your-backend-sentry-dsn
     ```

### Option 2: Vercel + Render

#### Frontend (Vercel)
1. **Vercel Setup**
   - Go to [vercel.com](https://vercel.com)
   - Import from GitHub
   - Set framework preset: Create React App
   - Set output directory: `frontend/build`
   - Add environment variables

#### Backend (Render)
1. **Render Setup**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect GitHub repository
   - Configuration will auto-detect from `render.yaml`

## 🔐 Security Setup

### 1. Environment Variables
Copy and update these templates:

**Frontend (.env.production):**
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

**Backend (.env):**
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=your-super-secure-32-char-secret-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://your-frontend-url.com
SENTRY_DSN=https://your-backend-sentry-dsn@sentry.io/project
NODE_ENV=production
```

### 2. Sentry Setup
1. Create account at [sentry.io](https://sentry.io)
2. Create two projects: "amantena-frontend" and "amantena-backend"
3. Copy DSN keys to environment variables
4. Test error reporting

## 📊 Monitoring & Analytics

### Error Monitoring
- **Frontend**: Sentry tracks React errors, performance issues
- **Backend**: Sentry tracks API errors, database issues, performance

### Performance Monitoring
- **Sentry Performance**: Tracks page loads, API response times
- **Railway/Render**: Built-in monitoring dashboards

## 🔧 Database Setup

### Neon PostgreSQL
Your database is already configured with:
- Connection URL: `postgresql://neondb_owner:npg_qI2E5ZuPCOis@ep-hidden-frog-a91hlc6s-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require`
- All tables created and seeded
- Admin user: admin@amantena.com / admin123

### Migration in Production
```bash
# Run this after deploying backend
npx prisma db push
npx prisma db seed
```

## 🧪 Testing Production

### Pre-deployment Checklist
- [ ] Update all environment variables
- [ ] Test build process: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Verify Sentry configuration
- [ ] Check database connection

### Post-deployment Testing
- [ ] Login with admin credentials
- [ ] Create test product
- [ ] Process test sale
- [ ] Upload test image
- [ ] Send test email invite
- [ ] Trigger test error (check Sentry)
- [ ] Test mobile responsiveness

## 🚀 Deployment Commands

### One-Click Deployment
```powershell
# Run the production deployment script
.\deploy-production.ps1
```

### Manual Deployment
```bash
# Build frontend
cd frontend
npm install
npm run build

# Prepare backend
cd ../backend
npm install
npx prisma generate

# Deploy to your chosen platforms
```

## 📋 Production URLs

After deployment, you'll have:
- **Frontend**: https://amantena.netlify.app
- **Backend API**: https://amantena-backend.railway.app
- **Database**: Neon PostgreSQL (managed)
- **Images**: Cloudinary (managed)
- **Monitoring**: Sentry (error tracking)

## 🎯 Next Steps

1. **Deploy**: Follow platform-specific instructions above
2. **Configure**: Update environment variables
3. **Test**: Verify all functionality works
4. **Monitor**: Check Sentry for any issues
5. **Scale**: Monitor usage and upgrade plans as needed

## 🆘 Troubleshooting

### Common Issues
- **CORS Errors**: Update FRONTEND_URL in backend env
- **Database Connection**: Verify DATABASE_URL format
- **Image Upload**: Check Cloudinary API keys
- **Email Issues**: Use Gmail App Password, not regular password
- **Build Failures**: Check Node.js version compatibility

### Support Resources
- **Documentation**: See README.md files
- **Deployment Guide**: DEPLOYMENT_GUIDE.md
- **Project Status**: PROJECT_STATUS.md

---

## 🎉 Production Ready!

Your Amantena Highway Farms Business Management Application is now configured for production deployment with enterprise-grade monitoring, security, and performance optimizations!

**Deploy with confidence! 🚀**
