/**
 * 🧪 SHERLOCK Ω IDE - JEST SETUP CONFIGURATION
 * =============================================
 * 
 * Global test setup with comprehensive mocking and utilities
 */

import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

// ============================================================================
// 🌍 GLOBAL ENVIRONMENT SETUP
// ============================================================================

// Polyfills for Node.js environment
Object.assign(global, {
  TextEncoder,
  TextDecoder,
  fetch: jest.fn(),
  Request: jest.fn(),
  Response: jest.fn(),
  Headers: jest.fn(),
});

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!';
process.env.DATABASE_URL = 'memory://test-database';
process.env.REDIS_URL = 'memory://test-redis';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// ============================================================================
// 🎭 GLOBAL MOCKS
// ============================================================================

// Mock console methods to reduce test noise
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers
jest.useFakeTimers({
  advanceTimers: true,
  doNotFake: ['setTimeout', 'setInterval'], // Keep some real timers for async operations
});

// ============================================================================
// 🔧 MODULE MOCKS
// ============================================================================

// Mock external dependencies
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: 'test-user', exp: Date.now() + 3600 }),
  decode: jest.fn().mockReturnValue({ sub: 'test-user' }),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('mock-hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
}));

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
  }),
}));

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn().mockResolvedValue({
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        }),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock OpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        code: 'mock-generated-code',
        explanation: 'Mock AI explanation',
        confidence: 0.95,
      }),
    }),
    stream: jest.fn().mockResolvedValue({
      async* [Symbol.asyncIterator]() {
        yield { content: 'Mock streaming response' };
      },
    }),
  })),
}));

// Mock LangGraph
jest.mock('@langchain/langgraph', () => ({
  Annotation: {
    Root: jest.fn().mockReturnValue({}),
  },
  StateGraph: jest.fn().mockImplementation(() => ({
    addNode: jest.fn().mockReturnThis(),
    addEdge: jest.fn().mockReturnThis(),
    compile: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({}),
      stream: jest.fn().mockResolvedValue({}),
    }),
  })),
  START: 'start',
  END: 'end',
}));

// Mock quantum-circuit
jest.mock('quantum-circuit', () => {
  return jest.fn().mockImplementation(() => ({
    numQubits: 2,
    numGates: 0,
    addGate: jest.fn().mockReturnThis(),
    run: jest.fn().mockReturnValue({
      probabilities: [0.5, 0.5, 0, 0],
      amplitudes: [0.707, 0.707, 0, 0],
    }),
    reset: jest.fn().mockReturnThis(),
    measure: jest.fn().mockReturnValue([0, 1]),
    getState: jest.fn().mockReturnValue([1, 0, 0, 0]),
    save: jest.fn().mockReturnValue('mock-circuit-data'),
    load: jest.fn().mockReturnThis(),
  }));
});

// Mock file system operations
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('mock-file-content'),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue([]),
  statSync: jest.fn().mockReturnValue({
    isFile: jest.fn().mockReturnValue(true),
    isDirectory: jest.fn().mockReturnValue(false),
  }),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('mock-file-content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
  stat: jest.fn().mockResolvedValue({
    isFile: jest.fn().mockReturnValue(true),
    isDirectory: jest.fn().mockReturnValue(false),
  }),
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn().mockImplementation((command, callback) => {
    callback(null, 'mock-command-output', '');
  }),
  execSync: jest.fn().mockReturnValue('mock-sync-output'),
  spawn: jest.fn().mockReturnValue({
    stdout: {
      on: jest.fn(),
      pipe: jest.fn(),
    },
    stderr: {
      on: jest.fn(),
    },
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(0), 100);
      }
    }),
  }),
}));

// ============================================================================
// 🎯 CUSTOM MATCHERS
// ============================================================================

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidQuantumState(): R;
      toHaveHighFidelity(threshold?: number): R;
      toBeValidResult(): R;
      toBeSecureString(): R;
    }
  }
}

// Custom matcher for quantum states
expect.extend({
  toBeValidQuantumState(received: number[]) {
    const sumOfSquares = received.reduce((sum, amp) => sum + Math.abs(amp) ** 2, 0);
    const isNormalized = Math.abs(sumOfSquares - 1.0) < 1e-10;
    const isPowerOfTwo = Number.isInteger(Math.log2(received.length));
    
    return {
      message: () =>
        `expected quantum state to be normalized (sum of squares = ${sumOfSquares}) and have power-of-2 length`,
      pass: isNormalized && isPowerOfTwo,
    };
  },

  toHaveHighFidelity(received: any, threshold: number = 0.9) {
    const fidelity = received?.fidelity || received;
    const isHigh = typeof fidelity === 'number' && fidelity >= threshold;
    
    return {
      message: () =>
        `expected fidelity ${fidelity} to be at least ${threshold}`,
      pass: isHigh,
    };
  },

  toBeValidResult(received: any) {
    const hasSuccess = 'success' in received;
    const hasCorrectShape = received.success
      ? 'data' in received && !('error' in received)
      : 'error' in received && !('data' in received);
    
    return {
      message: () =>
        `expected Result type with correct shape, got ${JSON.stringify(received)}`,
      pass: hasSuccess && hasCorrectShape,
    };
  },

  toBeSecureString(received: string) {
    const hasNoScript = !/<script|javascript:|vbscript:/i.test(received);
    const hasNoSql = !/\b(select|insert|update|delete|drop|union)\b/i.test(received);
    const hasNoTraversal = !/\.\.\//.test(received);
    
    return {
      message: () =>
        `expected string to be secure (no XSS, SQL injection, or directory traversal)`,
      pass: hasNoScript && hasNoSql && hasNoTraversal,
    };
  },
});

// ============================================================================
// 🔧 TEST UTILITIES
// ============================================================================

// Global test utilities
global.testUtils = {
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'developer',
    ...overrides,
  }),

  // Create mock quantum circuit
  createMockCircuit: (qubits = 2) => ({
    qubits,
    gates: [
      { type: 'H', targets: [0] },
      { type: 'CNOT', controls: [0], targets: [1] },
    ],
    fidelity: 0.95,
  }),

  // Create mock AI request
  createMockAIRequest: (overrides = {}) => ({
    model: 'gpt-4',
    prompt: 'Generate quantum code',
    temperature: 0.7,
    maxTokens: 1000,
    ...overrides,
  }),

  // Wait for async operations
  waitFor: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
};

// ============================================================================
// 🧹 CLEANUP
// ============================================================================

// Global cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterAll(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase test timeout for complex operations
jest.setTimeout(30000);