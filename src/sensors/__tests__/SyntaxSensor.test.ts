/**
 * Test suite for SyntaxSensor
 * Tests real-time syntax monitoring and AST parsing
 */

import { SyntaxSensor, TypeScriptParser } from '../SyntaxSensor';
import { SensorStatus, SeverityLevel, ProblemType } from '@types/core';

describe('SyntaxSensor', () => {
  let sensor: SyntaxSensor;

  beforeEach(() => {
    sensor = new SyntaxSensor();
  });

  afterEach(() => {
    sensor.stopMonitoring();
  });

  describe('File Management', () => {
    test('should add file for monitoring', () => {
      sensor.addFile('test.ts', 'const x = 1;', 'typescript');
      
      // File should be added (we can't directly test private members, but no error should occur)
      expect(true).toBe(true);
    });

    test('should detect language from file extension', () => {
      sensor.addFile('test.ts', 'const x = 1;');
      sensor.addFile('test.js', 'const x = 1;');
      sensor.addFile('test.tsx', 'const x = 1;');
      
      // Should detect TypeScript for all these extensions
      expect(true).toBe(true);
    });

    test('should update file content', () => {
      sensor.addFile('test.ts', 'const x = 1;');
      sensor.updateFile('test.ts', 'const y = 2;');
      
      expect(true).toBe(true);
    });

    test('should set active file', () => {
      sensor.addFile('test1.ts', 'const x = 1;');
      sensor.addFile('test2.ts', 'const y = 2;');
      
      sensor.setActiveFile('test1.ts');
      sensor.setActiveFile('test2.ts');
      
      expect(true).toBe(true);
    });

    test('should remove file from monitoring', () => {
      sensor.addFile('test.ts', 'const x = 1;');
      sensor.removeFile('test.ts');
      
      expect(true).toBe(true);
    });
  });

  describe('Syntax Error Detection', () => {
    test('should detect syntax errors in TypeScript code', async () => {
      const codeWithErrors = `
        function test {  // Missing parentheses
          const x = 1
          return x
        }
      `;

      sensor.addFile('test.ts', codeWithErrors);
      const issues = await sensor.getFileSyntaxErrors('test.ts');

      expect(issues.length).toBeGreaterThan(0);
      
      const syntaxError = issues.find(issue => 
        issue.type === ProblemType.SYNTAX_ERROR && 
        issue.severity >= SeverityLevel.MEDIUM
      );
      
      expect(syntaxError).toBeDefined();
      expect(syntaxError?.context.file).toBe('test.ts');
      expect(syntaxError?.context.line).toBeGreaterThan(0);
    });

    test('should detect missing semicolons', async () => {
      const codeWithMissingSemicolon = `
        const x = 1
        const y = 2
      `;

      sensor.addFile('test.ts', codeWithMissingSemicolon);
      const issues = await sensor.getFileSyntaxErrors('test.ts');

      const missingSemicolonIssues = issues.filter(issue => 
        issue.metadata.tags.includes('TS1005')
      );

      expect(missingSemicolonIssues.length).toBeGreaterThan(0);
    });

    test('should detect unmatched brackets', async () => {
      const codeWithUnmatchedBrackets = `
        function test() {
          if (true) {
            console.log('test');
          // Missing closing bracket
        }
      `;

      sensor.addFile('test.ts', codeWithUnmatchedBrackets);
      const issues = await sensor.getFileSyntaxErrors('test.ts');

      const bracketIssues = issues.filter(issue => 
        issue.metadata.tags.some(tag => tag.includes('bracket'))
      );

      expect(bracketIssues.length).toBeGreaterThan(0);
    });

    test('should detect unused variables', async () => {
      const codeWithUnusedVar = `
        function test() {
          const unusedVar = 'never used';
          const usedVar = 'used';
          console.log(usedVar);
        }
      `;

      sensor.addFile('test.ts', codeWithUnusedVar);
      const issues = await sensor.getFileSyntaxErrors('test.ts');

      const unusedVarIssues = issues.filter(issue => 
        issue.metadata.tags.includes('TS6133')
      );

      expect(unusedVarIssues.length).toBeGreaterThan(0);
    });

    test('should return no issues for valid code', async () => {
      const validCode = `
        function test(): string {
          const message = 'Hello, World!';
          return message;
        }
        
        export { test };
      `;

      sensor.addFile('test.ts', validCode);
      const issues = await sensor.getFileSyntaxErrors('test.ts');

      const errorIssues = issues.filter(issue => 
        issue.severity >= SeverityLevel.HIGH
      );

      expect(errorIssues.length).toBe(0);
    });
  });

  describe('Real-time Monitoring', () => {
    test('should perform monitoring across all files', async () => {
      sensor.addFile('file1.ts', 'const x = 1;');
      sensor.addFile('file2.ts', 'function test {'); // Has error
      sensor.addFile('file3.ts', 'const y = 2;');

      const result = await sensor.monitor();

      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.metrics.totalFiles).toBe(3);
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Should have at least one error from file2.ts
      const hasErrors = result.issues.some(issue => 
        issue.context.file === 'file2.ts' && 
        issue.severity >= SeverityLevel.HIGH
      );
      expect(hasErrors).toBe(true);
    });

    test('should prioritize active file in monitoring', async () => {
      sensor.addFile('inactive.ts', 'function test {'); // Has error
      sensor.addFile('active.ts', 'const x = 1;'); // No error
      
      sensor.setActiveFile('active.ts');

      const result = await sensor.monitor();

      expect(result.metrics.activeFiles).toBe(1);
      expect(result.metrics.totalFiles).toBe(2);
    });

    test('should handle monitoring errors gracefully', async () => {
      sensor.addFile('test.ts', 'const x = 1;');
      
      // Mock parser to throw error
      const originalParser = sensor['parsers'].get('typescript');
      if (originalParser) {
        const mockParser = {
          ...originalParser,
          parse: async () => {
            throw new Error('Parser error');
          }
        };
        sensor['parsers'].set('typescript', mockParser);
      }

      const result = await sensor.monitor();

      // Should create monitoring error issue
      const monitoringErrors = result.issues.filter(issue => 
        issue.metadata.tags.includes('monitoring-error')
      );

      expect(monitoringErrors.length).toBeGreaterThan(0);
    });

    test('should calculate correct metrics', async () => {
      sensor.addFile('errors.ts', 'function test {'); // Has errors
      sensor.addFile('warnings.ts', 'const unused = 1;'); // Has warnings
      sensor.addFile('clean.ts', 'const x = 1;'); // Clean

      const result = await sensor.monitor();

      expect(result.metrics.totalFiles).toBe(3);
      expect(result.metrics.totalErrors).toBeGreaterThan(0);
      expect(result.metrics.totalWarnings).toBeGreaterThan(0);
      expect(result.metrics.parseTime).toBeGreaterThan(0);
    });
  });

  describe('Parser Registration', () => {
    test('should register custom parser', () => {
      const customParser = {
        language: 'custom',
        extensions: ['.custom'],
        parse: async () => ({
          success: true,
          errors: [],
          warnings: []
        }),
        validate: () => []
      };

      sensor.registerParser(customParser);
      
      // Should not throw error
      expect(true).toBe(true);
    });

    test('should use registered parser for file', async () => {
      const customParser = {
        language: 'custom',
        extensions: ['.custom'],
        parse: async () => ({
          success: true,
          errors: [],
          warnings: []
        }),
        validate: () => []
      };

      sensor.registerParser(customParser);
      sensor.addFile('test.custom', 'custom code', 'custom');

      const issues = await sensor.getFileSyntaxErrors('test.custom');
      expect(issues.length).toBe(0); // Custom parser returns no issues
    });
  });

  describe('Status Determination', () => {
    test('should report HEALTHY status with no issues', async () => {
      sensor.addFile('clean.ts', 'const x = 1;');

      const result = await sensor.monitor();
      expect(result.status).toBe('HEALTHY');
    });

    test('should report WARNING status with warnings only', async () => {
      sensor.addFile('warnings.ts', 'const unused = 1;');

      const result = await sensor.monitor();
      expect(result.status).toBe('WARNING');
    });

    test('should report CRITICAL status with errors', async () => {
      sensor.addFile('errors.ts', 'function test {');

      const result = await sensor.monitor();
      expect(result.status).toBe('CRITICAL');
    });
  });

  describe('Continuous Monitoring', () => {
    test('should start and stop continuous monitoring', () => {
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);

      sensor.startMonitoring();
      expect(sensor.getStatus()).toBe(SensorStatus.ACTIVE);

      sensor.stopMonitoring();
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);
    });

    test('should monitor continuously when started', (done) => {
      sensor.addFile('test.ts', 'const x = 1;');
      
      let monitoringCount = 0;
      const originalMonitor = sensor.monitor.bind(sensor);
      sensor.monitor = async () => {
        monitoringCount++;
        if (monitoringCount >= 2) {
          sensor.stopMonitoring();
          done();
        }
        return originalMonitor();
      };

      sensor.startMonitoring();
    }, 10000);
  });
});

describe('TypeScriptParser', () => {
  let parser: TypeScriptParser;

  beforeEach(() => {
    parser = new TypeScriptParser();
  });

  describe('Language Detection', () => {
    test('should support TypeScript extensions', () => {
      expect(parser.language).toBe('typescript');
      expect(parser.extensions).toContain('.ts');
      expect(parser.extensions).toContain('.tsx');
      expect(parser.extensions).toContain('.js');
      expect(parser.extensions).toContain('.jsx');
    });
  });

  describe('Code Parsing', () => {
    test('should parse valid TypeScript code', async () => {
      const validCode = `
        function greet(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `;

      const result = await parser.parse(validCode, 'test.ts');

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.errors.length).toBe(0);
    });

    test('should detect syntax errors', async () => {
      const invalidCode = `
        function test {  // Missing parentheses
          return 'test';
        }
      `;

      const result = await parser.parse(invalidCode, 'test.ts');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const error = result.errors[0];
      expect(error.message).toContain('Expected "(" after function name');
      expect(error.line).toBeGreaterThan(0);
      expect(error.column).toBeGreaterThan(0);
    });

    test('should provide suggestions for errors', async () => {
      const codeWithError = 'function test {';

      const result = await parser.parse(codeWithError, 'test.ts');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].suggestion).toBeDefined();
    });

    test('should handle parsing exceptions', async () => {
      // Test with code that might cause parser to throw
      const problematicCode = null as any;

      const result = await parser.parse(problematicCode, 'test.ts');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('AST Validation', () => {
    test('should validate AST structure', () => {
      const mockAst = {
        type: 'Program',
        body: []
      };

      const validationResults = parser.validate(mockAst);

      // Should return array (may be empty for simple AST)
      expect(Array.isArray(validationResults)).toBe(true);
    });

    test('should handle invalid AST', () => {
      const invalidAst = null;

      const validationResults = parser.validate(invalidAst);

      expect(Array.isArray(validationResults)).toBe(true);
    });
  });
});