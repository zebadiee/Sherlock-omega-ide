#!/usr/bin/env node
/**
 * Complete Packaging Script for Sherlock Ω VS Code Extension
 * Builds, validates, and packages the extension for distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Sherlock Ω Extension Packaging Pipeline');
console.log('==========================================');

const extensionDir = __dirname + '/..';
const rootDir = path.join(extensionDir, '..');

async function validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`   Node.js: ${nodeVersion}`);
    
    // Check if vsce is installed
    try {
        const vsceVersion = execSync('npx vsce --version', { encoding: 'utf8' }).trim();
        console.log(`   VSCE: ${vsceVersion}`);
    } catch (error) {
        throw new Error('VSCE not found. Install with: npm install -g vsce');
    }
    
    // Check TypeScript
    try {
        const tscVersion = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
        console.log(`   TypeScript: ${tscVersion}`);
    } catch (error) {
        throw new Error('TypeScript not found');
    }
    
    console.log('✅ Environment validation passed');
}

async function buildCoreLibrary() {
    console.log('🏗️ Building Sherlock Ω core library...');
    
    process.chdir(rootDir);
    
    // Clean and build
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }
    
    execSync('npm install', { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });
    
    // Verify build output
    if (!fs.existsSync('dist/index.js')) {
        throw new Error('Core library build failed - dist/index.js not found');
    }
    
    console.log('✅ Core library built successfully');
}

async function buildExtension() {
    console.log('🔧 Building VS Code extension...');
    
    process.chdir(extensionDir);
    
    // Clean previous build
    if (fs.existsSync('out')) {
        fs.rmSync('out', { recursive: true, force: true });
    }
    
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
    
    // Compile TypeScript
    execSync('npm run compile', { stdio: 'inherit' });
    
    // Verify compilation
    if (!fs.existsSync('out/extension.js')) {
        throw new Error('Extension compilation failed - out/extension.js not found');
    }
    
    console.log('✅ Extension compiled successfully');
}

async function validatePackageJson() {
    console.log('📋 Validating package.json...');
    
    const packagePath = path.join(extensionDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Required fields
    const requiredFields = ['name', 'displayName', 'description', 'version', 'publisher', 'engines', 'main'];
    const missingFields = requiredFields.filter(field => !packageJson[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields in package.json: ${missingFields.join(', ')}`);
    }
    
    // Validate main entry point
    const mainPath = path.join(extensionDir, packageJson.main);
    if (!fs.existsSync(mainPath)) {
        throw new Error(`Main entry point not found: ${packageJson.main}`);
    }
    
    // Validate VS Code engine version
    if (!packageJson.engines.vscode) {
        throw new Error('VS Code engine version not specified');
    }
    
    console.log(`   Name: ${packageJson.displayName}`);
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Publisher: ${packageJson.publisher}`);
    console.log(`   VS Code: ${packageJson.engines.vscode}`);
    console.log('✅ Package.json validation passed');
}

async function createIcon() {
    console.log('🎨 Preparing extension icon...');
    
    const iconPath = path.join(extensionDir, 'images', 'icon.png');
    
    if (!fs.existsSync(iconPath)) {
        console.log('⚠️  No icon found, creating placeholder...');
        
        // Create a simple text-based icon placeholder
        const iconContent = `# Sherlock Ω Icon Placeholder
# Replace this with a 128x128 PNG icon
# The icon should represent the Sherlock Ω brand
# Recommended: Brain or detective-themed icon with Ω symbol`;
        
        fs.writeFileSync(iconPath, iconContent);
        console.log('   Created placeholder icon (replace with actual PNG)');
    } else {
        console.log('   Icon found: images/icon.png');
    }
}

async function packageExtension() {
    console.log('📦 Creating extension package...');
    
    process.chdir(extensionDir);
    
    // Remove any existing .vsix files
    const existingVsix = fs.readdirSync('.').filter(file => file.endsWith('.vsix'));
    existingVsix.forEach(file => {
        fs.unlinkSync(file);
        console.log(`   Removed old package: ${file}`);
    });
    
    // Create the package
    execSync('npx vsce package --no-dependencies', { stdio: 'inherit' });
    
    // Find the created package
    const newVsix = fs.readdirSync('.').filter(file => file.endsWith('.vsix'));
    if (newVsix.length === 0) {
        throw new Error('Package creation failed - no .vsix file found');
    }
    
    const packageFile = newVsix[0];
    const packageSize = fs.statSync(packageFile).size;
    const packageSizeMB = (packageSize / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Package created: ${packageFile}`);
    console.log(`   Size: ${packageSizeMB} MB`);
    
    return packageFile;
}

async function generateInstallInstructions(packageFile) {
    console.log('📖 Generating installation instructions...');
    
    const instructions = `
# Sherlock Ω VS Code Extension Installation

## Package Information
- **File**: ${packageFile}
- **Version**: ${JSON.parse(fs.readFileSync('package.json', 'utf8')).version}
- **Built**: ${new Date().toISOString()}

## Installation Methods

### Method 1: VS Code Command Line
\`\`\`bash
code --install-extension ${packageFile}
\`\`\`

### Method 2: VS Code UI
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu
4. Select "Install from VSIX..."
5. Choose the ${packageFile} file

### Method 3: Command Palette
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Extensions: Install from VSIX"
3. Select the ${packageFile} file

## Activation
After installation, the extension will activate automatically when you:
- Open a TypeScript/JavaScript file
- Run the "🧠 Activate Sherlock Ω" command

## Features
- 🧠 Computational Consciousness IDE
- ⚡ Zero-Friction Development Protocol
- 🔍 Omniscient Problem Detection
- 🔧 Automatic Dependency Installation
- 📊 Thought Completion System
- 🎯 Intent-Driven Development

## Support
- GitHub: https://github.com/zebadiee/Sherlock-omega-ide
- Issues: https://github.com/zebadiee/Sherlock-omega-ide/issues
- Documentation: https://sherlock-omega.dev

---
Built with ❤️ by the Sherlock Ω team
`;
    
    fs.writeFileSync('INSTALL.md', instructions);
    console.log('✅ Installation instructions created: INSTALL.md');
}

async function main() {
    try {
        await validateEnvironment();
        await buildCoreLibrary();
        await buildExtension();
        await validatePackageJson();
        await createIcon();
        const packageFile = await packageExtension();
        await generateInstallInstructions(packageFile);
        
        console.log('');
        console.log('🎉 Sherlock Ω Extension Packaging Complete!');
        console.log('============================================');
        console.log(`📦 Package: ${packageFile}`);
        console.log('📖 Instructions: INSTALL.md');
        console.log('');
        console.log('🚀 Ready for distribution!');
        console.log('');
        console.log('Next steps:');
        console.log('  • Test installation: code --install-extension ' + packageFile);
        console.log('  • Publish to marketplace: npm run publish');
        console.log('  • Share with team or users');
        
    } catch (error) {
        console.error('');
        console.error('❌ Packaging failed:', error.message);
        console.error('');
        process.exit(1);
    }
}

// Run the packaging pipeline
main();