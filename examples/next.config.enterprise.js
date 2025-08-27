/** @type {import('next').NextConfig} */

const path = require('path');

/**
 * 🚀 ENTERPRISE NEXT.JS CONFIGURATION
 * ===================================
 * Optimized for: Turbopack, OAuth, Cross-origin development, Enterprise security
 * Compatible with: Next.js 13+, React 18+, TypeScript 5+
 * 
 * Features:
 * ✅ Turbopack with absolute paths and optimized rules
 * ✅ OAuth-ready with proper CORS and redirect handling
 * ✅ Cross-origin development workflow support
 * ✅ Enterprise security headers
 * ✅ Performance optimizations
 * ✅ SVG, image, and font handling
 * ✅ Path aliases for clean imports
 */

const nextConfig = {
  // ============================================================================
  // 🚀 TURBOPACK CONFIGURATION
  // ============================================================================
  experimental: {
    turbo: {
      // Use absolute path for Turbopack root - critical for proper resolution
      root: path.resolve(__dirname),
      
      // Turbopack-specific rules for asset handling
      rules: {
        // SVG support with @svgr/webpack for React components
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
        
        // Image optimization with multiple formats
        '*.{png,jpg,jpeg,gif,webp,avif,ico}': {
          loaders: ['file-loader'],
          as: '*.js',
        },
        
        // Font handling for web fonts
        '*.{woff,woff2,eot,ttf,otf}': {
          loaders: ['file-loader'],
          as: '*.js',
        },
        
        // CSS and styling
        '*.{css,scss,sass,less}': {
          loaders: ['css-loader', 'postcss-loader'],
          as: '*.css',
        },
        
        // JSON and data files
        '*.{json,yml,yaml,toml}': {
          loaders: ['json-loader'],
          as: '*.json',
        },
      },
      
      // Memory and performance optimizations
      memoryLimit: 8192, // 8GB memory limit for large projects
      
      // Enable source maps for better debugging
      resolveSourceMaps: true,
      
      // Enable module concatenation for better performance
      moduleConcat: true,
      
      // Tree shaking optimization
      sideEffects: false,
    },
    
    // Additional experimental features
    esmExternals: true,
    serverComponentsExternalPackages: [
      'canvas',
      'jsdom',
      'node-canvas-webgl',
    ],
    
    // Enable app directory (App Router)
    appDir: true,
    
    // Server actions for form handling
    serverActions: true,
    
    // Optimized package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      'date-fns',
      'lodash',
    ],
  },
  
  // ============================================================================
  // 🌐 CROSS-ORIGIN DEVELOPMENT SUPPORT
  // ============================================================================
  // IMPORTANT: This must be OUTSIDE the turbo configuration
  allowedDevOrigins: [
    // Standard localhost ports
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:8000',
    'http://localhost:8080',
    
    // 127.0.0.1 variants
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3004',
    
    // 0.0.0.0 for Docker/container development
    'http://0.0.0.0:3002',
    
    // Local network access for LAN testing (common ranges)
    'http://192.168.1.*:3002',
    'http://192.168.0.*:3002',
    'http://10.0.0.*:3002',
    'http://172.16.*.*:3002',
    
    // Development environments
    'https://*.vercel.app',
    'https://*.netlify.app',
    'https://*.github.io',
    
    // Custom development domains
    'http://dev.local:3002',
    'http://staging.local:3002',
  ],
  
  // ============================================================================
  // 🔒 ENTERPRISE SECURITY HEADERS
  // ============================================================================
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          
          // Referrer Policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=(), accelerometer=(), gyroscope=(), magnetometer=()',
          },
          
          // Content Security Policy (basic - customize as needed)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://avatars.githubusercontent.com https://github.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.github.com https://*.supabase.co wss://*.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; '),
          },
          
          // Strict Transport Security (HTTPS enforcement)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      
      // API routes get additional security headers
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  
  // ============================================================================
  // 🖼️ IMAGE OPTIMIZATION
  // ============================================================================
  images: {
    // Allowed external image domains
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'cdn.jsdelivr.net',
    ],
    
    // Supported image formats (ordered by preference)
    formats: ['image/avif', 'image/webp'],
    
    // Image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Enable dangerous allow all for development (remove in production)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // ============================================================================
  // 🛠️ WEBPACK CUSTOMIZATION
  // ============================================================================
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // SVG handling as React components
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            typescript: true,
            ext: 'tsx',
          },
        },
      ],
    });
    
    // Path aliases for clean imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/styles': path.resolve(__dirname, './styles'),
      '@/types': path.resolve(__dirname, './types'),
      '@/config': path.resolve(__dirname, './config'),
      '@/constants': path.resolve(__dirname, './constants'),
      '@/store': path.resolve(__dirname, './store'),
      '@/api': path.resolve(__dirname, './app/api'),
      '@/public': path.resolve(__dirname, './public'),
    };
    
    // Handle node modules that need to be treated as ES modules
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        bufferutil: 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }
    
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // ============================================================================
  // 🌍 INTERNATIONALIZATION (i18n)
  // ============================================================================
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
    defaultLocale: 'en',
    localeDetection: true,
  },
  
  // ============================================================================
  // 📡 API AND ENVIRONMENT
  // ============================================================================
  env: {
    // Custom environment variables
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    BUILD_ID: process.env.BUILD_ID,
    COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  },
  
  // Public runtime configuration
  publicRuntimeConfig: {
    APP_NAME: 'Enterprise IDE',
    APP_VERSION: process.env.npm_package_version,
  },
  
  // Server runtime configuration (not exposed to frontend)
  serverRuntimeConfig: {
    SECRET_KEY: process.env.SECRET_KEY,
  },
  
  // ============================================================================
  // ⚡ PERFORMANCE AND BUILD SETTINGS
  // ============================================================================
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Enable gzip compression
  compress: true,
  
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  // HTTP timeout for API routes
  httpAgentOptions: {
    keepAlive: true,
  },
  
  // ============================================================================
  // 📄 PAGE AND FILE CONFIGURATION
  // ============================================================================
  
  // Supported page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // Trailing slash configuration
  trailingSlash: false,
  
  // Asset prefix for CDN (if using)
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.example.com' : '',
  
  // ============================================================================
  // 🔄 REDIRECTS AND REWRITES
  // ============================================================================
  async redirects() {
    return [
      // Example: Redirect old paths to new ones
      {
        source: '/old-dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      
      // Redirect root to dashboard for authenticated users
      {
        source: '/',
        has: [
          {
            type: 'cookie',
            key: 'auth-token',
          },
        ],
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  
  async rewrites() {
    return [
      // API proxy for external services
      {
        source: '/api/external/:path*',
        destination: 'https://api.external-service.com/:path*',
      },
    ];
  },
  
  // ============================================================================
  // 📊 ANALYTICS AND MONITORING
  // ============================================================================
  
  // Bundle analyzer (enable when needed)
  // ...(process.env.ANALYZE === 'true' ? { bundleAnalyzer: { enabled: true } } : {}),
  
  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    // React refresh for fast development
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    
    // Styled-jsx plugin
    styledJsx: true,
  },
  
  // ============================================================================
  // 🚨 ERROR HANDLING
  // ============================================================================
  
  // Custom error page
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Development indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  // ============================================================================
  // 🎯 TYPESCRIPT CONFIGURATION
  // ============================================================================
  typescript: {
    // Type checking during build
    typeCheck: true,
    // Ignore TypeScript errors during build (not recommended for production)
    // ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Run ESLint during build
    ignoreDuringBuilds: false,
    dirs: ['pages', 'app', 'components', 'lib', 'utils'],
  },
};

module.exports = nextConfig;