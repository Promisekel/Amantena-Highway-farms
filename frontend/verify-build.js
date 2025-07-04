#!/usr/bin/env node

/**
 * Build Verification Script
 * Checks if the build artifacts are properly created
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');
const requiredFiles = [
  'index.html',
  'static/css',
  'static/js'
];

const optionalFiles = [
  'static/media'
];

console.log('🔍 Verifying build artifacts...');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory does not exist');
  process.exit(1);
}

// Check required files/directories
let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(buildDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

// Check optional files/directories
optionalFiles.forEach(file => {
  const filePath = path.join(buildDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found (optional): ${file}`);
  } else {
    console.log(`ℹ️ Optional file not found: ${file}`);
  }
});

// Check index.html content
const indexPath = path.join(buildDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.includes('<div id="root"></div>')) {
    console.log('✅ index.html has correct React root');
  } else {
    console.error('❌ index.html missing React root div');
    allFilesExist = false;
  }
}

// Check for any .js files in static/js
const jsDir = path.join(buildDir, 'static', 'js');
if (fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  if (jsFiles.length > 0) {
    console.log(`✅ Found ${jsFiles.length} JavaScript files`);
  } else {
    console.error('❌ No JavaScript files found');
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('🎉 Build verification successful!');
  process.exit(0);
} else {
  console.error('💥 Build verification failed!');
  process.exit(1);
}
