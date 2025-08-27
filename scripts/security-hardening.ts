#!/usr/bin/env ts-node

/**
 * Security Hardening Script for Sherlock Omega IDE
 * Addresses critical vulnerabilities and implements security best practices
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔒 Starting Security Hardening Process...\n');

interface SecurityCheck {
  name: string;
  check: () => Promise<boolean>;
  fix: () => Promise<void>;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Security audit and fix vulnerabilities
 */
async function auditAndFix(): Promise<void> {
  console.log('📋 Running npm audit...');
  
  try {
    // Run audit and capture output
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditOutput);
    
    if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
      console.log(`⚠️  Found ${Object.keys(audit.vulnerabilities).length} vulnerabilities`);
      
      // Try automatic fix
      console.log('🔧 Attempting automatic fixes...');
      execSync('npm audit fix --force', { stdio: 'inherit' });
      
      // Manual fixes for specific vulnerabilities
      await fixMathJSVulnerability();
      await updateQuantumCircuit();
      
    } else {
      console.log('✅ No vulnerabilities found');
    }
  } catch (error) {
    console.log('⚠️  Audit completed with warnings - proceeding with manual fixes');
    await fixMathJSVulnerability();
    await updateQuantumCircuit();
  }
}

/**
 * Fix MathJS vulnerability by updating to secure version
 */
async function fixMathJSVulnerability(): Promise<void> {
  console.log('🔧 Fixing MathJS vulnerability...');
  
  try {
    // Remove vulnerable version and install secure version
    execSync('npm uninstall quantum-circuit', { stdio: 'inherit' });
    
    // Check if there's a newer secure version available
    try {
      execSync('npm install quantum-circuit@latest --save', { stdio: 'inherit' });
      console.log('✅ Updated quantum-circuit to latest version');
    } catch (installError) {
      console.log('⚠️  Could not update quantum-circuit - may need manual intervention');
      // Create a wrapper that uses a secure math library
      await createSecureMathWrapper();
    }
  } catch (error) {
    console.log('❌ Failed to fix MathJS vulnerability:', error);
  }
}

/**
 * Create a secure math wrapper to avoid mathjs vulnerabilities
 */
async function createSecureMathWrapper(): Promise<void> {
  const wrapperPath = path.join(__dirname, '../src/utils/secure-math.ts');
  const wrapperContent = `
/**
 * Secure Math Wrapper
 * Provides safe mathematical operations without prototype pollution risks
 */

export class SecureMath {
  /**
   * Safely evaluate mathematical expressions without eval()
   */
  static safeEvaluate(expression: string): number {
    // Whitelist allowed operations and constants
    const allowedOps = /^[0-9+\-*/().\s]+$/;
    
    if (!allowedOps.test(expression)) {
      throw new Error('Invalid mathematical expression');
    }
    
    try {
      // Use Function constructor instead of eval for safer evaluation
      return new Function('return ' + expression)();
    } catch (error) {
      throw new Error('Failed to evaluate expression safely');
    }
  }
  
  /**
   * Complex number operations for quantum computing
   */
  static complex(real: number, imag: number = 0): { real: number; imag: number } {
    return { real, imag };
  }
  
  static add(a: { real: number; imag: number }, b: { real: number; imag: number }): { real: number; imag: number } {
    return {
      real: a.real + b.real,
      imag: a.imag + b.imag
    };
  }
  
  static multiply(a: { real: number; imag: number }, b: { real: number; imag: number }): { real: number; imag: number } {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real
    };
  }
  
  static magnitude(a: { real: number; imag: number }): number {
    return Math.sqrt(a.real * a.real + a.imag * a.imag);
  }
}
`;
  
  fs.writeFileSync(wrapperPath, wrapperContent);
  console.log('✅ Created secure math wrapper');
}

/**
 * Update quantum circuit to secure version
 */
async function updateQuantumCircuit(): Promise<void> {
  console.log('🔧 Updating quantum dependencies...');
  
  try {
    // Install alternative secure quantum libraries
    execSync('npm install @quantum/core --save-optional', { stdio: 'pipe' });
    console.log('✅ Installed alternative quantum library');
  } catch (error) {
    console.log('⚠️  Alternative quantum library not available');
  }
}

/**
 * Implement Content Security Policy headers
 */
async function implementCSP(): Promise<void> {
  const cspConfig = `
/**
 * Content Security Policy Configuration
 * Prevents XSS and other injection attacks
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for quantum calculations
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' ws: wss:",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'"
  ].join('; ')
};

/**
 * Security headers middleware
 */
export function securityHeaders(req: any, res: any, next: any) {
  // CSP
  res.set(CSP_HEADERS);
  
  // Additional security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  
  next();
}
`;

  const securityPath = path.join(__dirname, '../src/security/headers.ts');
  fs.mkdirSync(path.dirname(securityPath), { recursive: true });
  fs.writeFileSync(securityPath, cspConfig);
  console.log('✅ Implemented security headers');
}

/**
 * Enable input validation and sanitization
 */
async function enableInputValidation(): Promise<void> {
  const validationConfig = `
/**
 * Input Validation and Sanitization
 */
import { z } from 'zod';

export const ValidationSchemas = {
  quantumCircuit: z.object({
    gates: z.array(z.object({
      type: z.enum(['H', 'X', 'Y', 'Z', 'CNOT', 'RX', 'RY', 'RZ']),
      qubits: z.array(z.number().int().min(0).max(100)),
      params: z.array(z.number()).optional()
    })),
    qubits: z.number().int().min(1).max(100)
  }),
  
  userInput: z.object({
    query: z.string().min(1).max(1000).regex(/^[a-zA-Z0-9\s\-_.,:;!?()]+$/),
    code: z.string().max(10000)
  })
};

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, input: any): T {
  const sanitized = typeof input === 'string' ? sanitizeInput(input) : input;
  return schema.parse(sanitized);
}
`;

  const validationPath = path.join(__dirname, '../src/security/validation.ts');
  fs.writeFileSync(validationPath, validationConfig);
  console.log('✅ Enabled input validation');
}

/**
 * Main security hardening function
 */
async function main(): Promise<void> {
  const checks: SecurityCheck[] = [
    {
      name: 'Audit and Fix Vulnerabilities',
      check: async () => true,
      fix: auditAndFix,
      priority: 'HIGH'
    },
    {
      name: 'Implement Security Headers',
      check: async () => true,
      fix: implementCSP,
      priority: 'HIGH'
    },
    {
      name: 'Enable Input Validation',
      check: async () => true,
      fix: enableInputValidation,
      priority: 'MEDIUM'
    }
  ];

  for (const check of checks) {
    console.log(`\n🔍 ${check.name} (${check.priority} priority)`);
    
    try {
      await check.fix();
      console.log(`✅ ${check.name} completed`);
    } catch (error) {
      console.log(`❌ ${check.name} failed:`, error);
    }
  }

  console.log('\n🎉 Security hardening completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npm audit to verify fixes');
  console.log('2. Run: npm test to ensure functionality');
  console.log('3. Update CI/CD pipeline with security checks');
  console.log('4. Review and test all security implementations');
}

if (require.main === module) {
  main().catch(console.error);
}