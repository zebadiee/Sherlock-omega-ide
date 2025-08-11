#!/usr/bin/env node
/**
 * Bundle Size Tracking Script for Sherlock Ω
 * Monitors and reports on bundle size changes
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Tracking Bundle Size...');

const distPath = path.join(__dirname, '..', 'dist');
const sizeLimits = {
  'index.js': 500 * 1024, // 500KB limit for main bundle
  'total': 2 * 1024 * 1024 // 2MB total limit
};

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    console.log('⚠️  Dist directory not found. Run npm run build first.');
    return 0;
  }

  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }

  calculateSize(dirPath);
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Calculate bundle sizes
const totalSize = getDirectorySize(distPath);
const mainBundlePath = path.join(distPath, 'index.js');
const mainBundleSize = fs.existsSync(mainBundlePath) ? fs.statSync(mainBundlePath).size : 0;

console.log('\n📦 Bundle Size Report:');
console.log(`   📄 Main Bundle: ${formatBytes(mainBundleSize)}`);
console.log(`   📁 Total Size: ${formatBytes(totalSize)}`);

// Check against limits
let hasWarnings = false;

if (mainBundleSize > sizeLimits['index.js']) {
  console.log(`   ⚠️  WARNING: Main bundle exceeds ${formatBytes(sizeLimits['index.js'])} limit`);
  hasWarnings = true;
}

if (totalSize > sizeLimits.total) {
  console.log(`   ⚠️  WARNING: Total bundle exceeds ${formatBytes(sizeLimits.total)} limit`);
  hasWarnings = true;
}

if (!hasWarnings) {
  console.log('   ✅ All bundle sizes within limits');
}

// Save size history
const historyPath = path.join(__dirname, '..', 'bundle-size-history.json');
let history = [];

if (fs.existsSync(historyPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  } catch (e) {
    console.log('⚠️  Could not read bundle size history');
  }
}

const currentEntry = {
  timestamp: new Date().toISOString(),
  mainBundleSize,
  totalSize,
  commit: process.env.GITHUB_SHA || 'local'
};

history.push(currentEntry);

// Keep only last 50 entries
if (history.length > 50) {
  history = history.slice(-50);
}

fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

// Show trend if we have previous data
if (history.length > 1) {
  const previous = history[history.length - 2];
  const sizeDiff = totalSize - previous.totalSize;
  
  if (sizeDiff > 0) {
    console.log(`   📈 Size increased by ${formatBytes(sizeDiff)} since last build`);
  } else if (sizeDiff < 0) {
    console.log(`   📉 Size decreased by ${formatBytes(Math.abs(sizeDiff))} since last build`);
  } else {
    console.log(`   ➡️  Size unchanged since last build`);
  }
}

console.log('\n✅ Bundle size tracking complete!');

// Exit with error code if limits exceeded
if (hasWarnings) {
  process.exit(1);
}