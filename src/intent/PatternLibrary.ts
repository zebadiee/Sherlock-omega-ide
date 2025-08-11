/**
 * Pattern Library for Code Pattern Intent Analysis
 * Contains regex patterns and AST queries for detecting structural and semantic code patterns
 */

/**
 * Metadata for each pattern
 */
export interface PatternMetadata {
  name: string;
  description: string;
  severityScore: number; // 0.0-1.0, higher means more significant
  category: string;
  suggestedAction: string;
}

/**
 * Pattern definition with regex and metadata
 */
export interface PatternDefinition {
  regex: RegExp;
  metadata: PatternMetadata;
  extractLocation?: (match: RegExpMatchArray, code: string) => { line: number; column: number };
}

/**
 * Calculate line and column from match index
 */
function getLocationFromIndex(code: string, index: number): { line: number; column: number } {
  const lines = code.substring(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Pattern library containing all detectable code patterns
 */
export const PatternLibrary: Record<string, PatternDefinition> = {
  // Loop constructs
  'for-loop': {
    regex: /for\s*\(\s*(?:let|var|const)?\s*\w+[^)]*\)\s*\{/gi,
    metadata: {
      name: 'for-loop',
      description: 'Traditional for loop that could be optimized',
      severityScore: 0.6,
      category: 'performance',
      suggestedAction: 'Consider using array methods like map, filter, or forEach for better readability'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'while-loop': {
    regex: /while\s*\([^)]+\)\s*\{/gi,
    metadata: {
      name: 'while-loop',
      description: 'While loop that might benefit from refactoring',
      severityScore: 0.5,
      category: 'maintainability',
      suggestedAction: 'Review loop logic for potential infinite loops or optimization opportunities'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'array-map': {
    regex: /\.map\s*\(/gi,
    metadata: {
      name: 'array-map',
      description: 'Array map operation detected',
      severityScore: 0.3,
      category: 'functional',
      suggestedAction: 'Good use of functional programming - consider chaining with other array methods'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'array-filter': {
    regex: /\.filter\s*\(/gi,
    metadata: {
      name: 'array-filter',
      description: 'Array filter operation detected',
      severityScore: 0.3,
      category: 'functional',
      suggestedAction: 'Consider combining with map or reduce for better performance'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  // Async/await patterns
  'async-function': {
    regex: /async\s+function\s+\w+|async\s*\([^)]*\)\s*=>/gi,
    metadata: {
      name: 'async-function',
      description: 'Async function declaration',
      severityScore: 0.4,
      category: 'async',
      suggestedAction: 'Ensure proper error handling with try-catch blocks'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'await-usage': {
    regex: /await\s+\w+/gi,
    metadata: {
      name: 'await-usage',
      description: 'Await keyword usage',
      severityScore: 0.5,
      category: 'async',
      suggestedAction: 'Consider using Promise.all() for parallel async operations'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'promise-then': {
    regex: /\.then\s*\(/gi,
    metadata: {
      name: 'promise-then',
      description: 'Promise.then() usage detected',
      severityScore: 0.7,
      category: 'async',
      suggestedAction: 'Consider refactoring to async/await for better readability'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'callback-pattern': {
    regex: /function\s*\([^)]*callback[^)]*\)|callback\s*\(/gi,
    metadata: {
      name: 'callback-pattern',
      description: 'Callback pattern detected',
      severityScore: 0.8,
      category: 'async',
      suggestedAction: 'Refactor callbacks to async/await or Promises for better error handling'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  // Null/undefined checks
  'null-check-equality': {
    regex: /==\s*null|!=\s*null|===\s*null|!==\s*null/gi,
    metadata: {
      name: 'null-check-equality',
      description: 'Explicit null equality check',
      severityScore: 0.4,
      category: 'safety',
      suggestedAction: 'Consider using optional chaining (?.) or nullish coalescing (??)'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'undefined-check': {
    regex: /==\s*undefined|!=\s*undefined|===\s*undefined|!==\s*undefined|typeof\s+\w+\s*===?\s*['"]undefined['"]/gi,
    metadata: {
      name: 'undefined-check',
      description: 'Explicit undefined check',
      severityScore: 0.4,
      category: 'safety',
      suggestedAction: 'Consider using optional chaining (?.) or default parameters'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'optional-chaining': {
    regex: /\?\./gi,
    metadata: {
      name: 'optional-chaining',
      description: 'Optional chaining operator usage',
      severityScore: 0.2,
      category: 'modern',
      suggestedAction: 'Good use of modern JavaScript - consider combining with nullish coalescing'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'nullish-coalescing': {
    regex: /\?\?/gi,
    metadata: {
      name: 'nullish-coalescing',
      description: 'Nullish coalescing operator usage',
      severityScore: 0.2,
      category: 'modern',
      suggestedAction: 'Good use of modern JavaScript for handling null/undefined values'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  // Error handling
  'try-catch': {
    regex: /try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{/gi,
    metadata: {
      name: 'try-catch',
      description: 'Try-catch error handling block',
      severityScore: 0.3,
      category: 'error-handling',
      suggestedAction: 'Review error handling paths and consider specific error types'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'throw-statement': {
    regex: /throw\s+(?:new\s+)?\w+/gi,
    metadata: {
      name: 'throw-statement',
      description: 'Throw statement for error handling',
      severityScore: 0.4,
      category: 'error-handling',
      suggestedAction: 'Ensure thrown errors are properly caught and handled'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'console-error': {
    regex: /console\.(?:error|warn)\s*\(/gi,
    metadata: {
      name: 'console-error',
      description: 'Console error or warning statement',
      severityScore: 0.6,
      category: 'debugging',
      suggestedAction: 'Consider using proper logging framework instead of console statements'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  // Performance patterns
  'nested-loops': {
    regex: /for\s*\([^}]*\{[^}]*for\s*\(/gi,
    metadata: {
      name: 'nested-loops',
      description: 'Nested loop structure detected',
      severityScore: 0.8,
      category: 'performance',
      suggestedAction: 'Consider loop unrolling or algorithm optimization for better performance'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'array-push-loop': {
    regex: /for\s*\([^}]*\{[^}]*\.push\s*\(/gi,
    metadata: {
      name: 'array-push-loop',
      description: 'Array push inside loop',
      severityScore: 0.7,
      category: 'performance',
      suggestedAction: 'Consider using array methods like map() or pre-allocating array size'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  // Security patterns
  'eval-usage': {
    regex: /eval\s*\(/gi,
    metadata: {
      name: 'eval-usage',
      description: 'Eval function usage detected',
      severityScore: 0.9,
      category: 'security',
      suggestedAction: 'Avoid using eval() - consider safer alternatives like JSON.parse() or Function constructor'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  },

  'innerhtml-usage': {
    regex: /\.innerHTML\s*=/gi,
    metadata: {
      name: 'innerhtml-usage',
      description: 'innerHTML assignment detected',
      severityScore: 0.7,
      category: 'security',
      suggestedAction: 'Consider using textContent or sanitizing HTML to prevent XSS attacks'
    },
    extractLocation: (match, code) => getLocationFromIndex(code, match.index || 0)
  }
};

/**
 * Get all patterns by category
 */
export function getPatternsByCategory(category: string): PatternDefinition[] {
  return Object.values(PatternLibrary).filter(pattern => 
    pattern.metadata.category === category
  );
}

/**
 * Get pattern by name
 */
export function getPattern(name: string): PatternDefinition | undefined {
  return PatternLibrary[name];
}

/**
 * Get all available pattern names
 */
export function getAllPatternNames(): string[] {
  return Object.keys(PatternLibrary);
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(
    Object.values(PatternLibrary).map(pattern => pattern.metadata.category)
  );
  return Array.from(categories);
}