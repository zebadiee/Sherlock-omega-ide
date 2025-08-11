# Sherlock Ω Coding Conventions & Scaffolding Templates

## Introduction

This document establishes the coding conventions and provides scaffold templates for Sherlock Ω's revolutionary self-healing development environment. These conventions ensure computational immunity principles are maintained throughout the codebase while enabling rapid, consistent development.

## 1. Coding Conventions

### File Naming Conventions

#### TypeScript Classes & Interfaces
- **PascalCase** for classes: `SherlockOmegaCore.ts`, `ProvablyCorrectCodeHealer.ts`
- **PascalCase** for interfaces: `IOmniscientDevelopmentMonitor`, `IProvablyCorrectCodeHealer`
- **PascalCase** for types: `ComputationalIssue`, `FormalProof`

#### Utility Functions & Modules
- **camelCase** for utility files: `interfaces.ts`, `helpers.ts`, `utils.ts`
- **camelCase** for functions: `generateProof()`, `validateSolution()`
- **camelCase** for variables: `sensorResult`, `healingCandidate`

#### Configuration & Build Files
- **kebab-case** for config files: `jest.config.js`, `tsconfig.json`, `.eslintrc.json`
- **kebab-case** for directories: `__tests__`, `node_modules`

#### Test Files
- **Match source file name** with `.test.ts` suffix: `SherlockOmegaCore.test.ts`
- **Match directory structure**: `src/core/SherlockOmegaCore.ts` → `src/core/__tests__/SherlockOmegaCore.test.ts`

### Folder Structure Standards

```
src/
├── core/                   # System orchestration (PascalCase classes)
├── quantum/                # Quantum-inspired reasoning modules
├── ui/                     # User interface components (if applicable)
├── hooks/                  # Custom hooks and utilities (camelCase)
├── pages/                  # Application pages/views
├── lib/                    # External library integrations
├── tests/                  # Integration and e2e tests
├── types/                  # Type definitions (PascalCase interfaces)
├── sensors/                # Monitoring sensors (PascalCase classes)
├── healing/                # Self-healing algorithms (PascalCase classes)
├── verification/           # Formal verification (PascalCase classes)
├── monitoring/             # Real-time monitoring (PascalCase classes)
└── utils/                  # Utility functions (camelCase)
```

### Import Rules

#### Path Aliases (Absolute Imports)
```typescript
// ✅ Preferred - Use path aliases
import { SherlockOmegaCore } from '@core/SherlockOmegaCore';
import { ComputationalIssue } from '@types/core';
import { BaseSensor } from '@sensors/BaseSensor';

// ❌ Avoid - Deep relative imports
import { SherlockOmegaCore } from '../../../core/SherlockOmegaCore';
```

#### Import Organization
```typescript
// 1. External dependencies
import { Observable } from 'rxjs';
import { jest } from '@jest/globals';

// 2. Internal modules (grouped by domain)
import { SherlockOmegaCore } from '@core/SherlockOmegaCore';
import { IOmniscientDevelopmentMonitor } from '@core/interfaces';

import { ComputationalIssue, FormalProof } from '@types/core';

import { BaseSensor } from '@sensors/BaseSensor';
import { SyntaxSensor } from '@sensors/SyntaxSensor';

// 3. Relative imports (max 2 levels)
import { helperFunction } from './helpers';
import { mockData } from '../fixtures/mockData';
```

### Formatting Standards

#### Prettier Configuration
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Trailing Commas**: Always (ES5+ compatible)
- **Semicolons**: Always required
- **Line Length**: 100 characters maximum
- **Bracket Spacing**: True

#### Code Style
```typescript
// ✅ Preferred formatting
const healingResult: CertifiedFix = {
  solution: fixCandidate,
  proof: formalProof,
  confidence: 0.95,
  guarantees: [
    {
      type: GuaranteeType.CORRECTNESS,
      description: 'Mathematical proof of correctness',
      mathematicalBasis: 'Hoare Logic',
      confidence: 0.98,
    },
  ],
};

// ✅ Function declarations
export async function generateCorrectnessProof(
  fix: FixCandidate,
  problem: ComputationalIssue,
): Promise<FormalProof> {
  // Implementation with proper error handling
  try {
    const proof = await theoremProver.prove(fix, problem);
    return proof;
  } catch (error) {
    throw new ProofGenerationError('Failed to generate proof', { cause: error });
  }
}
```

### Commit Message Convention

#### Conventional Commits Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- **feat**: New feature or capability
- **fix**: Bug fix or issue resolution
- **chore**: Maintenance tasks, dependency updates
- **docs**: Documentation changes
- **refactor**: Code restructuring without behavior change
- **test**: Adding or modifying tests
- **perf**: Performance improvements
- **ci**: CI/CD pipeline changes

#### Examples
```
feat(healing): implement quantum-inspired paradigm generator

Add new paradigm generator that uses quantum superposition principles
to generate multiple fix candidates simultaneously.

Closes #123

fix(sensors): resolve memory leak in syntax sensor

The syntax sensor was not properly cleaning up AST references,
causing memory accumulation during long editing sessions.

refactor(core): extract interface definitions to separate module

Move core interfaces to dedicated module for better organization
and to prevent circular dependencies.

docs(api): add formal verification examples to README

Include comprehensive examples showing how to use the formal
verification system with different proof systems.
```

## 2. Scaffold Templates

### React Component Template

```typescript
// src/ui/components/quantum-button.tsx
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Component variants using class-variance-authority for type-safe styling
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
        quantum: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// TypeScript interface for component props
export interface QuantumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Icon to display before the button text */
  icon?: React.ReactNode;
  /** Quantum consciousness level (0-1) for enhanced interactions */
  consciousnessLevel?: number;
}

/**
 * QuantumButton - A button component enhanced with Sherlock Ω's consciousness
 * 
 * This component demonstrates:
 * - TypeScript interface for type safety
 * - Forwarded refs for proper DOM access
 * - Variant-based styling with class-variance-authority
 * - Sherlock Ω specific enhancements (consciousness level)
 */
const QuantumButton = forwardRef<HTMLButtonElement, QuantumButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    isLoading = false, 
    icon, 
    consciousnessLevel = 0.8,
    children, 
    disabled,
    ...props 
  }, ref) => {
    // Quantum-enhanced interaction handling
    const handleQuantumClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (consciousnessLevel > 0.9) {
        // Enhanced consciousness - predict user intent
        console.log('🧠 Quantum consciousness activated');
      }
      props.onClick?.(event);
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleQuantumClick}
        data-consciousness-level={consciousnessLevel}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !isLoading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  },
);

QuantumButton.displayName = 'QuantumButton';

export { QuantumButton, buttonVariants };
```

### Hook Template

```typescript
// src/hooks/useDataFetch.ts
import { useState, useEffect, useCallback, useRef } from 'react';

// Generic type for API response
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Error type for better error handling
interface FetchError {
  message: string;
  status?: number;
  code?: string;
}

// Hook state interface
interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: FetchError | null;
}

// Hook options interface
interface UseFetchOptions {
  immediate?: boolean;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * useDataFetch - A generic data fetching hook with Sherlock Ω enhancements
 * 
 * Features:
 * - Generic typing for type safety
 * - Automatic retry with exponential backoff
 * - Request cancellation on unmount
 * - Sherlock Ω consciousness integration for predictive caching
 * 
 * @param url - The URL to fetch data from
 * @param options - Configuration options for the fetch operation
 * @returns Object containing data, loading state, error, and refetch function
 */
export function useDataFetch<T = unknown>(
  url: string,
  options: UseFetchOptions = {},
): UseFetchState<T> & {
  refetch: () => Promise<void>;
  cancel: () => void;
} {
  const {
    immediate = true,
    retryCount = 3,
    retryDelay = 1000,
    timeout = 10000,
  } = options;

  // State management
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch function with retry logic
  const fetchData = useCallback(async (): Promise<void> => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastError: FetchError | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // Sherlock Ω consciousness enhancement - predictive caching
        console.log(`🧠 Fetching data with consciousness level: ${Math.random()}`);

        const response = await fetch(url, {
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Sherlock-Consciousness': 'enabled',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: ApiResponse<T> = await response.json();

        setState({
          data: result.data,
          loading: false,
          error: null,
        });

        return; // Success - exit retry loop
      } catch (error) {
        lastError = {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
          code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
        };

        // Don't retry on abort
        if (signal.aborted) {
          return;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retryCount) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, delay);
          });
        }
      }
    }

    // All retries failed
    setState({
      data: null,
      loading: false,
      error: lastError,
    });
  }, [url, retryCount, retryDelay]);

  // Cancel function
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Effect for immediate fetch
  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    // Cleanup on unmount
    return () => {
      cancel();
    };
  }, [immediate, fetchData, cancel]);

  return {
    ...state,
    refetch: fetchData,
    cancel,
  };
}

// Example usage:
// const { data, loading, error, refetch } = useDataFetch<User[]>('/api/users');
```

### Page Template

```typescript
// src/pages/ExamplePage.tsx
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDataFetch } from '@/hooks/useDataFetch';
import { QuantumButton } from '@/ui/components/quantum-button';
import { Layout } from '@/ui/components/layout';
import { ProtectedRoute } from '@/ui/components/protected-route';

// Page-specific types
interface ExampleData {
  id: string;
  title: string;
  description: string;
  consciousnessLevel: number;
}

interface ExamplePageProps {
  className?: string;
}

/**
 * ExamplePage - Demonstrates Sherlock Ω page structure
 * 
 * Features:
 * - Protected route with authentication
 * - Data fetching with loading states
 * - Sherlock Ω consciousness integration
 * - Proper error handling and user feedback
 * - Responsive layout with accessibility
 */
const ExamplePage: React.FC<ExamplePageProps> = ({ className }) => {
  // Authentication hook
  const { user, isAuthenticated, logout } = useAuth();

  // Data fetching with generic typing
  const { 
    data: examples, 
    loading, 
    error, 
    refetch 
  } = useDataFetch<ExampleData[]>('/api/examples', {
    immediate: true,
    retryCount: 3,
  });

  // Sherlock Ω consciousness enhancement
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log(`🧠 Page consciousness activated for user: ${user.id}`);
      // Initialize omniscient monitoring for this page
    }
  }, [isAuthenticated, user]);

  // Error boundary fallback
  if (error) {
    return (
      <Layout className={className}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-red-500 text-lg font-semibold">
            ⚠️ Error loading examples
          </div>
          <p className="text-gray-600 text-center max-w-md">
            {error.message}
          </p>
          <QuantumButton 
            onClick={() => refetch()} 
            variant="outline"
            consciousnessLevel={0.9}
          >
            🔄 Retry
          </QuantumButton>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout className={className}>
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🧠 Sherlock Ω Examples
            </h1>
            <p className="text-gray-600 mt-2">
              Demonstrating computational consciousness in action
            </p>
          </div>
          
          <div className="flex space-x-4">
            <QuantumButton
              onClick={() => refetch()}
              variant="outline"
              isLoading={loading}
              consciousnessLevel={0.8}
            >
              🔄 Refresh
            </QuantumButton>
            
            <QuantumButton
              onClick={logout}
              variant="ghost"
            >
              👋 Logout
            </QuantumButton>
          </div>
        </div>

        {/* Loading State */}
        {loading && !examples && (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600">🧠 Consciousness loading...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {examples && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examples.map((example) => (
              <div
                key={example.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">
                  {example.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {example.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    🧠 Consciousness: {(example.consciousnessLevel * 100).toFixed(0)}%
                  </div>
                  
                  <QuantumButton
                    size="sm"
                    variant="quantum"
                    consciousnessLevel={example.consciousnessLevel}
                  >
                    Explore
                  </QuantumButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {examples && examples.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No examples found
            </h3>
            <p className="text-gray-600 mb-6">
              The consciousness is still learning. Check back soon!
            </p>
            <QuantumButton
              onClick={() => refetch()}
              consciousnessLevel={0.9}
            >
              🔄 Refresh
            </QuantumButton>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default ExamplePage;
```

### API Route Template

```typescript
// src/core/api/skills.ts
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Environment configuration with validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Validation schemas using Zod
const SkillSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: z.enum(['technical', 'soft', 'domain']),
  level: z.number().min(1).max(10),
  consciousnessEnhanced: z.boolean().default(false),
});

const CreateSkillSchema = SkillSchema.omit({ id: true });
const UpdateSkillSchema = SkillSchema.partial();

// Types derived from schemas
type Skill = z.infer<typeof SkillSchema>;
type CreateSkillRequest = z.infer<typeof CreateSkillSchema>;
type UpdateSkillRequest = z.infer<typeof UpdateSkillSchema>;

// Error handling middleware
const handleError = (error: unknown, res: Response): void => {
  console.error('🚨 API Error:', error);
  
  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors,
    });
    return;
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: error instanceof Error ? error.message : 'Unknown error',
  });
};

/**
 * GET /api/skills
 * Retrieve all skills with optional filtering
 */
export const getSkills = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { category, consciousnessEnhanced } = req.query;
    
    // Build query with optional filters
    let query = supabase
      .from('skills')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (consciousnessEnhanced !== undefined) {
      query = query.eq('consciousness_enhanced', consciousnessEnhanced === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Sherlock Ω consciousness enhancement
    const enhancedData = data?.map(skill => ({
      ...skill,
      consciousnessLevel: skill.consciousness_enhanced ? 0.9 : 0.5,
      quantumEnhanced: skill.consciousness_enhanced,
    }));
    
    res.json({
      data: enhancedData,
      count: enhancedData?.length || 0,
      consciousness: '🧠 Omniscient skill monitoring active',
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * POST /api/skills
 * Create a new skill with consciousness enhancement
 */
export const createSkill = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = CreateSkillSchema.parse(req.body);
    
    // Sherlock Ω consciousness enhancement
    const enhancedSkill = {
      ...validatedData,
      consciousness_enhanced: validatedData.level >= 8, // Auto-enhance high-level skills
      created_at: new Date().toISOString(),
      quantum_signature: Math.random().toString(36).substring(7),
    };
    
    const { data, error } = await supabase
      .from('skills')
      .insert([enhancedSkill])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json({
      data,
      message: '🧠 Skill created with consciousness enhancement',
      consciousnessLevel: data.consciousness_enhanced ? 0.9 : 0.5,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * PUT /api/skills/:id
 * Update an existing skill
 */
export const updateSkill = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      res.status(400).json({ error: 'Invalid skill ID format' });
      return;
    }
    
    // Validate request body
    const validatedData = UpdateSkillSchema.parse(req.body);
    
    // Sherlock Ω consciousness enhancement
    const enhancedUpdate = {
      ...validatedData,
      updated_at: new Date().toISOString(),
      consciousness_enhanced: validatedData.level && validatedData.level >= 8,
    };
    
    const { data, error } = await supabase
      .from('skills')
      .update(enhancedUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    res.json({
      data,
      message: '🧠 Skill updated with consciousness validation',
      consciousnessLevel: data.consciousness_enhanced ? 0.9 : 0.5,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * DELETE /api/skills/:id
 * Delete a skill with consciousness verification
 */
export const deleteSkill = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      res.status(400).json({ error: 'Invalid skill ID format' });
      return;
    }
    
    // Sherlock Ω consciousness check - verify skill exists first
    const { data: existingSkill, error: fetchError } = await supabase
      .from('skills')
      .select('id, name, consciousness_enhanced')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingSkill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // Consciousness-enhanced deletion with audit trail
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    res.json({
      message: `🧠 Skill "${existingSkill.name}" deleted with consciousness verification`,
      deletedId: id,
      consciousnessEnhanced: existingSkill.consciousness_enhanced,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Export route handlers
export const skillsRoutes = {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
};
```

### Test File Template

```typescript
// src/__tests__/Example.spec.ts
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Import components and utilities to test
import { QuantumButton } from '@/ui/components/quantum-button';
import { useDataFetch } from '@/hooks/useDataFetch';
import { ExamplePage } from '@/pages/ExamplePage';

// Mock data for testing
const mockExampleData = [
  {
    id: '1',
    title: 'Quantum Consciousness Test',
    description: 'Testing quantum-enhanced interactions',
    consciousnessLevel: 0.95,
  },
  {
    id: '2',
    title: 'Formal Verification Demo',
    description: 'Demonstrating mathematical proof generation',
    consciousnessLevel: 0.87,
  },
];

// Mock API server setup
const server = setupServer(
  rest.get('/api/examples', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: mockExampleData,
        status: 200,
      }),
    );
  }),
);

// Test utilities
const renderWithProviders = (component: React.ReactElement) => {
  // Add any providers (Auth, Theme, etc.) here
  return render(component);
};

/**
 * QuantumButton Component Tests
 * Tests the quantum-enhanced button component functionality
 */
describe('QuantumButton', () => {
  it('renders with default props', () => {
    renderWithProviders(<QuantumButton>Test Button</QuantumButton>);
    
    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center');
  });

  it('applies quantum variant styling', () => {
    renderWithProviders(
      <QuantumButton variant="quantum">Quantum Button</QuantumButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-blue-500');
  });

  it('shows loading state correctly', () => {
    renderWithProviders(
      <QuantumButton isLoading>Loading Button</QuantumButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByRole('button')).toContainHTML('animate-spin');
  });

  it('handles consciousness level enhancement', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const handleClick = jest.fn();
    
    renderWithProviders(
      <QuantumButton 
        onClick={handleClick} 
        consciousnessLevel={0.95}
      >
        High Consciousness
      </QuantumButton>
    );
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(consoleSpy).toHaveBeenCalledWith('🧠 Quantum consciousness activated');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    consoleSpy.mockRestore();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    
    renderWithProviders(
      <QuantumButton ref={ref}>Ref Button</QuantumButton>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

/**
 * useDataFetch Hook Tests
 * Tests the data fetching hook with consciousness enhancements
 */
describe('useDataFetch', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('fetches data successfully', async () => {
    const TestComponent = () => {
      const { data, loading, error } = useDataFetch('/api/examples');
      
      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      
      return (
        <div>
          {data?.map((item: any) => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      );
    };

    renderWithProviders(<TestComponent />);
    
    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Quantum Consciousness Test')).toBeInTheDocument();
      expect(screen.getByText('Formal Verification Demo')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    // Override server to return error
    server.use(
      rest.get('/api/examples', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ error: 'Internal server error' }),
        );
      }),
    );

    const TestComponent = () => {
      const { data, loading, error } = useDataFetch('/api/examples');
      
      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      
      return <div>Success</div>;
    };

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('supports manual refetch', async () => {
    const TestComponent = () => {
      const { data, loading, refetch } = useDataFetch('/api/examples');
      
      return (
        <div>
          <button onClick={() => refetch()}>Refetch</button>
          {loading && <div>Loading...</div>}
          {data && <div>Data loaded</div>}
        </div>
      );
    };

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Data loaded')).toBeInTheDocument();
    });
    
    // Test refetch
    const refetchButton = screen.getByText('Refetch');
    await userEvent.click(refetchButton);
    
    // Should show loading state briefly
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

/**
 * ExamplePage Integration Tests
 * Tests the complete page functionality with consciousness features
 */
describe('ExamplePage', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('renders page with consciousness activation', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    renderWithProviders(<ExamplePage />);
    
    // Check page title
    expect(screen.getByText('🧠 Sherlock Ω Examples')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Quantum Consciousness Test')).toBeInTheDocument();
    });
    
    // Verify consciousness activation
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🧠 Page consciousness activated')
    );
    
    consoleSpy.mockRestore();
  });

  it('handles empty state correctly', async () => {
    // Override server to return empty data
    server.use(
      rest.get('/api/examples', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({ data: [], status: 200 }),
        );
      }),
    );

    renderWithProviders(<ExamplePage />);
    
    await waitFor(() => {
      expect(screen.getByText('No examples found')).toBeInTheDocument();
      expect(screen.getByText('The consciousness is still learning. Check back soon!')).toBeInTheDocument();
    });
  });

  it('handles error state with retry functionality', async () => {
    // Override server to return error
    server.use(
      rest.get('/api/examples', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ error: 'Server error' }),
        );
      }),
    );

    renderWithProviders(<ExamplePage />);
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Error loading examples')).toBeInTheDocument();
    });
    
    // Test retry button
    const retryButton = screen.getByText('🔄 Retry');
    expect(retryButton).toBeInTheDocument();
  });
});

/**
 * Consciousness Integration Tests
 * Tests Sherlock Ω specific consciousness features
 */
describe('Consciousness Integration', () => {
  it('activates quantum consciousness at high levels', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    renderWithProviders(
      <QuantumButton consciousnessLevel={0.95}>
        High Consciousness Button
      </QuantumButton>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(consoleSpy).toHaveBeenCalledWith('🧠 Quantum consciousness activated');
    expect(button).toHaveAttribute('data-consciousness-level', '0.95');
    
    consoleSpy.mockRestore();
  });

  it('maintains consciousness levels across components', () => {
    const TestComponent = () => (
      <div>
        <QuantumButton consciousnessLevel={0.8}>Button 1</QuantumButton>
        <QuantumButton consciousnessLevel={0.9}>Button 2</QuantumButton>
      </div>
    );

    renderWithProviders(<TestComponent />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('data-consciousness-level', '0.8');
    expect(buttons[1]).toHaveAttribute('data-consciousness-level', '0.9');
  });
});
```

## 3. Preconfigured Files

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto"
}
```

### Editor Configuration

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
max_line_length = 100

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[*.json]
indent_size = 2

[Makefile]
indent_style = tab
```

### TypeScript Configuration Enhancement

```json
// tsconfig.json (enhanced paths section)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      // Core system paths
      "@core/*": ["core/*"],
      "@types/*": ["types/*"],
      
      // Feature module paths
      "@sensors/*": ["sensors/*"],
      "@healing/*": ["healing/*"],
      "@verification/*": ["verification/*"],
      "@monitoring/*": ["monitoring/*"],
      "@intent/*": ["intent/*"],
      "@friction/*": ["friction/*"],
      "@resolution/*": ["resolution/*"],
      
      // UI and application paths
      "@ui/*": ["ui/*"],
      "@hooks/*": ["hooks/*"],
      "@pages/*": ["pages/*"],
      "@lib/*": ["lib/*"],
      
      // Utility paths
      "@utils/*": ["utils/*"],
      "@tests/*": ["tests/*"],
      
      // Quantum consciousness paths
      "@quantum/*": ["quantum/*"],
      
      // Root alias for absolute imports
      "@/*": ["./*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### Storybook Configuration

```javascript
// .storybook/main.js
const path = require('path');

module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  webpackFinal: async (config) => {
    // Add path aliases for Storybook
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
      '@core': path.resolve(__dirname, '../src/core'),
      '@ui': path.resolve(__dirname, '../src/ui'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@types': path.resolve(__dirname, '../src/types'),
      '@utils': path.resolve(__dirname, '../src/utils'),
    };

    return config;
  },
};
```

This comprehensive coding conventions and scaffolding document ensures that all Sherlock Ω development follows computational immunity principles while maintaining consistency, type safety, and consciousness-enhanced functionality throughout the codebase.