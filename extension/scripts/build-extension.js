#!/usr/bin/env node
/**
 * Build Script for Sherlock Ω VS Code Extension
 * Compiles TypeScript and prepares extension for packaging
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️ Building Sherlock Ω VS Code Extension...');

const extensionDir = __dirname + '/..';
const rootDir = path.join(extensionDir, '..');

try {
    // Change to extension directory
    process.chdir(extensionDir);

    // Install dependencies if needed
    if (!fs.existsSync('node_modules')) {
        console.log('📦 Installing extension dependencies...');
        execSync('npm install', { stdio: 'inherit' });
    }

    // Compile TypeScript
    console.log('🔧 Compiling TypeScript...');
    execSync('npm run compile', { stdio: 'inherit' });

    // Copy necessary files from root project
    console.log('📋 Copying core library...');
    
    // Ensure the core library is built
    process.chdir(rootDir);
    if (!fs.existsSync('dist')) {
        console.log('🏗️ Building core library...');
        execSync('npm run build', { stdio: 'inherit' });
    }

    // Return to extension directory
    process.chdir(extensionDir);

    // Create extension package
    console.log('📦 Creating extension package...');
    execSync('npm run package', { stdio: 'inherit' });

    console.log('✅ Extension build complete!');
    console.log('📁 Extension package: sherlock-omega-ide-*.vsix');
    console.log('🚀 Ready for installation or publishing');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}