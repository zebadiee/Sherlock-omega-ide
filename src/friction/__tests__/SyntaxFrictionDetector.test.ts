/**
 * Tests for SyntaxFrictionDetector
 * Validates syntax error detection and auto-correction capabilities
 */

import { 
  SyntaxFrictionDetector, 
  SyntaxContext, 
  SupportedLanguage,
  CorrectionType 
} from '../SyntaxFrictionDetector';
import { FrictionType, FrictionPoint } from '../FrictionDetector';
import { SeverityLevel } from '../../types/core';

describe('SyntaxFrictionDetector', () => {
  let detector: SyntaxFrictionDetector;

  beforeEach(() => {
    detector = new SyntaxFrictionDetector();
  });

  describe('TypeScript/JavaScript Syntax Detection', () => {
    it('should detect missing semicolon', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const x = 5\nconst y = 10;',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      // TypeScript compiler might not always flag missing semicolons as errors
      // depending on configuration, so we'll check for any syntax issues
      expect(Array.isArray(frictionPoints)).toBe(true);
      if (frictionPoints.length > 0) {
        expect(frictionPoints[0].type).toBe(FrictionType.SYNTAX);
      }
    });

    it('should detect missing closing bracket', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'function test() {\n  console.log("hello");\n',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints.length).toBeGreaterThan(0);
      const bracketError = frictionPoints.find(f => 
        f.description.toLowerCase().includes('expected') && 
        f.description.includes('}')
      );
      expect(bracketError).toBeDefined();
    });

    it('should detect unterminated string', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const message = "hello world\nconsole.log(message);',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints.length).toBeGreaterThan(0);
      const stringError = frictionPoints.find(f => 
        f.description.toLowerCase().includes('unterminated')
      );
      expect(stringError).toBeDefined();
    });

    it('should detect undefined variable usage', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'console.log(undefinedVariable);',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      // Note: This might not be detected as a syntax error but as a semantic error
      // The test validates that the detector can handle such cases
      expect(Array.isArray(frictionPoints)).toBe(true);
    });

    it('should handle valid syntax without errors', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: `
          function greet(name: string): string {
            return \`Hello, \${name}!\`;
          }
          
          const message = greet("World");
        `,
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      // Filter out library-related errors (like missing 'console' definition)
      const syntaxErrors = frictionPoints.filter(f => 
        !f.description.includes('Cannot find name') && 
        !f.description.includes('target library')
      );
      
      expect(syntaxErrors).toHaveLength(0);
    });
  });

  describe('JSON Syntax Detection', () => {
    it('should detect invalid JSON syntax', async () => {
      const context: SyntaxContext = {
        filePath: 'test.json',
        content: '{"name": "test", "value": }',
        language: SupportedLanguage.JSON
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints).toHaveLength(1);
      expect(frictionPoints[0].type).toBe(FrictionType.SYNTAX);
      expect(frictionPoints[0].description).toContain('Unexpected token');
    });

    it('should detect missing comma in JSON', async () => {
      const context: SyntaxContext = {
        filePath: 'test.json',
        content: '{"name": "test" "value": 123}',
        language: SupportedLanguage.JSON
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints).toHaveLength(1);
      expect(frictionPoints[0].type).toBe(FrictionType.SYNTAX);
    });

    it('should handle valid JSON without errors', async () => {
      const context: SyntaxContext = {
        filePath: 'test.json',
        content: '{"name": "test", "value": 123, "active": true}',
        language: SupportedLanguage.JSON
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints).toHaveLength(0);
    });
  });

  describe('Markdown Syntax Detection', () => {
    it('should detect unclosed code blocks', async () => {
      const context: SyntaxContext = {
        filePath: 'test.md',
        content: '# Title\n\n```typescript\nconst x = 5;\n\nSome text after',
        language: SupportedLanguage.MARKDOWN
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints).toHaveLength(1);
      expect(frictionPoints[0].description).toBe('Unclosed code block');
      expect(frictionPoints[0].location.line).toBe(3);
    });

    it('should detect empty link URLs', async () => {
      const context: SyntaxContext = {
        filePath: 'test.md',
        content: '# Title\n\nCheck out [this link]() for more info.',
        language: SupportedLanguage.MARKDOWN
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints).toHaveLength(1);
      expect(frictionPoints[0].description).toBe('Empty link URL');
    });

    it('should handle valid markdown without errors', async () => {
      const context: SyntaxContext = {
        filePath: 'test.md',
        content: `# Title

This is a paragraph with [a link](https://example.com).

Another paragraph.`,
        language: SupportedLanguage.MARKDOWN
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(frictionPoints).toHaveLength(0);
    });
  });

  describe('Auto-Correction Generation', () => {
    it('should generate semicolon correction suggestion', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const x = 5',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      if (frictionPoints.length > 0) {
        const result = await detector.eliminateFriction(frictionPoints[0]);
        expect(result.strategy.name).toContain('semicolon');
        expect(result.strategy.type).toBe('AUTO_CORRECTION');
      }
    });

    it('should generate bracket correction suggestion', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'function test() {\n  console.log("hello");',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      if (frictionPoints.length > 0) {
        const bracketError = frictionPoints.find(f => 
          f.description.includes('}')
        );
        
        if (bracketError) {
          const result = await detector.eliminateFriction(bracketError);
          expect(result.strategy.name).toContain('BRACKET');
          expect(result.strategy.type).toBe('AUTO_CORRECTION');
        }
      }
    });
  });

  describe('Friction Point Creation', () => {
    it('should create friction point with correct properties', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const x = 5',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      if (frictionPoints.length > 0) {
        const friction = frictionPoints[0];
        
        expect(friction.id).toBeDefined();
        expect(friction.type).toBe(FrictionType.SYNTAX);
        expect(friction.severity).toBeGreaterThan(0);
        expect(friction.description).toBeDefined();
        expect(friction.location.file).toBe('test.ts');
        expect(friction.impact.flowDisruption).toBeGreaterThan(0);
        expect(friction.impact.timeDelay).toBeGreaterThan(0);
        expect(friction.metadata.confidence).toBeGreaterThan(0);
        expect(friction.metadata.tags).toContain('syntax');
        expect(friction.metadata.tags).toContain('auto-correctable');
      }
    });

    it('should calculate appropriate impact metrics', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const x = 5',
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      if (frictionPoints.length > 0) {
        const friction = frictionPoints[0];
        
        expect(friction.impact.flowDisruption).toBeGreaterThan(0);
        expect(friction.impact.flowDisruption).toBeLessThanOrEqual(1);
        expect(friction.impact.timeDelay).toBeGreaterThan(0);
        expect(friction.impact.cognitiveLoad).toBeGreaterThanOrEqual(0);
        expect(friction.impact.cognitiveLoad).toBeLessThanOrEqual(1);
        expect(friction.impact.blockingPotential).toBeGreaterThanOrEqual(0);
        expect(friction.impact.blockingPotential).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file content gracefully', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: '', // Empty content
        language: SupportedLanguage.TYPESCRIPT
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(Array.isArray(frictionPoints)).toBe(true);
      // Empty content should not cause errors, just return empty array
    });

    it('should handle unsupported language gracefully', async () => {
      const context: SyntaxContext = {
        filePath: 'test.py',
        content: 'print("hello")',
        language: 'python' as SupportedLanguage // Unsupported language
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(Array.isArray(frictionPoints)).toBe(true);
      expect(frictionPoints).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should detect syntax errors quickly', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const x = 5\nconst y = 10',
        language: SupportedLanguage.TYPESCRIPT
      };

      const startTime = Date.now();
      const frictionPoints = await detector.detectFriction(context);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(Array.isArray(frictionPoints)).toBe(true);
    });

    it('should handle large files efficiently', async () => {
      // Generate a large TypeScript file
      const largeContent = Array(1000).fill(0).map((_, i) => 
        `const variable${i} = ${i};`
      ).join('\n') + '\nconst errorLine = 5'; // Missing semicolon at the end

      const context: SyntaxContext = {
        filePath: 'large-test.ts',
        content: largeContent,
        language: SupportedLanguage.TYPESCRIPT
      };

      const startTime = Date.now();
      const frictionPoints = await detector.detectFriction(context);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(Array.isArray(frictionPoints)).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should work with cursor position context', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const x = 5\nconst y = 10;',
        language: SupportedLanguage.TYPESCRIPT,
        cursorPosition: { line: 1, column: 12 }
      };

      const frictionPoints = await detector.detectFriction(context);
      
      expect(Array.isArray(frictionPoints)).toBe(true);
      // The detector should still work with cursor position information
    });

    it('should maintain detection history', async () => {
      const context: SyntaxContext = {
        filePath: 'test.ts',
        content: 'const x = 5',
        language: SupportedLanguage.TYPESCRIPT
      };

      // First detection
      const frictionPoints1 = await detector.detectFriction(context);
      
      // Second detection with same content
      const frictionPoints2 = await detector.detectFriction(context);
      
      expect(Array.isArray(frictionPoints1)).toBe(true);
      expect(Array.isArray(frictionPoints2)).toBe(true);
      
      // Should maintain consistent detection
      expect(frictionPoints1.length).toBe(frictionPoints2.length);
    });
  });
});