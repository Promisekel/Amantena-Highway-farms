# Netlify Deployment Checklist

## Pre-Deployment Checks

### 1. Environment Variables
- [ ] `REACT_APP_API_URL` is set correctly in Netlify dashboard
- [ ] `REACT_APP_CLOUDINARY_CLOUD_NAME` is set
- [ ] `REACT_APP_ENVIRONMENT=production`
- [ ] `CI=false` to disable strict builds
- [ ] `GENERATE_SOURCEMAP=false` to reduce build size

### 2. Build Configuration
- [ ] `package.json` has correct `build:netlify` script
- [ ] `netlify.toml` uses `build:netlify` command
- [ ] `cross-env` dependency is installed
- [ ] Build directory is set to `build`
- [ ] Base directory is set to `frontend`

### 3. Code Quality
- [ ] All import statements are correct
- [ ] No critical ESLint errors (warnings are OK)
- [ ] All required dependencies are in `package.json`
- [ ] No conflicting dependency versions

### 4. Local Testing
- [ ] `npm run build:netlify` succeeds locally
- [ ] `node verify-build.js` passes
- [ ] No console errors in built app

## Common Issues & Solutions

### Build Fails with Exit Code 2
1. **Sentry Issues**: Temporarily disable Sentry if causing problems
2. **ESLint Errors**: Use `DISABLE_ESLINT_PLUGIN=true`
3. **TypeScript Errors**: Use `TSC_COMPILE_ON_ERROR=true`
4. **Memory Issues**: Use `NODE_OPTIONS=--max-old-space-size=4096`

### Missing Environment Variables
- Check Netlify dashboard > Site settings > Environment variables
- Ensure all `REACT_APP_*` variables are set
- Verify variable names match exactly (case-sensitive)

### Dependency Issues
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for peer dependency warnings

### Import/Export Errors
- Verify all import paths are correct
- Check for missing default exports
- Ensure all used components are properly imported

## Deployment Commands

### Manual Deployment
```bash
# 1. Build locally
npm run build:netlify

# 2. Verify build
node verify-build.js

# 3. Push to Git (triggers auto-deploy)
git add .
git commit -m "Deploy: fixes for Netlify build"
git push origin main
```

### Troubleshooting Build
```bash
# Debug build with verbose output
npm run build:netlify --verbose

# Check for unused dependencies
npm run build:netlify 2>&1 | grep -i "warning\|error"

# Test with clean slate
rm -rf node_modules package-lock.json
npm install
npm run build:netlify
```

## Post-Deployment Verification

- [ ] Site loads without errors
- [ ] API calls work (check Network tab)
- [ ] All pages are accessible
- [ ] Environment-specific features work
- [ ] No console errors in production

## Emergency Rollback

If deployment fails:
1. Check Netlify deploy logs for specific errors
2. Revert to last working commit: `git revert HEAD`
3. Push fix: `git push origin main`
4. Or manually trigger deploy from previous working version in Netlify dashboard
