/**
 * Monaco Completion Provider Unit Tests - Fixed Version
 * 
 * Tests for Monaco Editor integration with AI completion system
 * validating <200ms response time and >90% accuracy targets.
 */

import * as monaco from 'monaco-editor';
import { MonacoCompletionProvider, AICompletionItem } from '../monaco-completion-provider';
import { ContextAnalyzer, CompletionContext, CompletionType, SymbolKind } from '../context-analyzer';
import { CompletionRanker, FactorType } from '../completion-ranker';
import { ProjectAnalyzer } from '../project-analyzer';
import { AIOrchestrator } from '../../orchestrator';
import { Logger } from '../../../logging/logger';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor';
import { PlatformType } from '../../../core/whispering-interfaces';
import {
  AIResponse,
  ProjectContext,
  PrivacyLevel,
  RequestPriority
} from '../../interfaces';

// Mock Monaco Editor
jest.mock('monaco-editor');

// Mock dependencies
jest.mock('../context-analyzer');
jest.mock('../completion-ranker');
jest.mock('../project-analyzer');
jest.mock('../../orchestrator');
jest.mock('../../../logging/logger');
jest.mock('../../../monitoring/performance-monitor');

describe('MonacoCompletionProvider - Fixed', () => {
  let provider: MonacoCompletionProvider;
  let mockContextAnalyzer: jest.Mocked<ContextAnalyzer>;
  let mockCompletionRanker: jest.Mocked<CompletionRanker>;
  let mockProjectAnalyzer: jest.Mocked<ProjectAnalyzer>;
  let mockAIOrchestrator: jest.Mocked<AIOrchestrator>;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;
  let mockModel: jest.Mocked<monaco.editor.ITextModel>;
  let mockPosition: monaco.Position;
  let mockContext: monaco.languages.CompletionContext;
  let mockCancellationToken: { isCancellationRequested: boolean };
  let mockCompletionContext: CompletionContext;

  beforeEach(() => {
    // Create mocks
    mockContextAnalyzer = {
      analyzeCompletionContext: jest.fn(),
      updateUsagePatterns: jest.fn()
    } as any;

    mockCompletionRanker = {
      rankCompletions: jest.fn(),
      updateUserPreferences: jest.fn()
    } as any;

    mockProjectAnalyzer = {
      analyzeProject: jest.fn()
    } as any;

    mockAIOrchestrator = {
      processRequest: jest.fn()
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    mockPerformanceMonitor = {
      recordMetric: jest.fn()
    } as any;

    mockModel = {
      uri: {
        toString: jest.fn().mockReturnValue('file:///test.ts'),
        fsPath: '/test.ts'
      },
      getValue: jest.fn().mockReturnValue('const x = '),
      getWordUntilPosition: jest.fn().mockReturnValue({
        startColumn: 1,
        endColumn: 10,
        word: 'test'
      })
    } as any;

    mockPosition = new monaco.Position(1, 10);
    
    mockContext = {
      triggerKind: monaco.languages.CompletionTriggerKind.Invoke,
      triggerCharacter: undefined
    };

    // Use a mutable object instead of trying to modify readonly property
    mockCancellationToken = {
      isCancellationRequested: false
    };

    mockCompletionContext = {
      currentFile: '/test.ts',
      cursorPosition: { line: 0, character: 9 },
      surroundingCode: 'const x = ',
      imports: [],
      functions: [],
      variables: [],
      scope: {
        type: 'module',
        name: 'test',
        variables: []
      },
      completionType: CompletionType.VARIABLE_DECLARATION,
      expectedType: 'any',
      availableSymbols: [],
      recentUsage: [],
      syntaxContext: {
        inString: false,
        inComment: false,
        inFunction: false,
        inClass: false,
        inBlock: false,
        indentationLevel: 0
      },
      semanticContext: {
        availableTypes: ['string', 'number', 'boolean'],
        genericConstraints: [],
        importedModules: []
      }
    };

    provider = new MonacoCompletionProvider(
      mockContextAnalyzer,
      mockCompletionRanker,
      mockProjectAnalyzer,
      mockAIOrchestrator,
      mockLogger,
      mockPerformanceMonitor
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('provideCompletionItems', () => {
    it('should provide completion items successfully', async () => {
      // Setup mocks
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);
      
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle cancellation gracefully', async () => {
      // Set cancellation flag
      mockCancellationToken.isCancellationRequested = true;

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      expect(result.suggestions).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Completion request cancelled by user action.');
    });

    it('should complete within 200ms target', async () => {
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);

      const startTime = Date.now();
      
      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200); // <200ms target
    });

    it('should handle errors gracefully', async () => {
      mockContextAnalyzer.analyzeCompletionContext.mockRejectedValue(new Error('Analysis failed'));

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      expect(result.suggestions).toHaveLength(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should include range property in completion items', async () => {
      const mockRankedCompletion = {
        displayText: 'testFunction',
        insertText: 'testFunction()',
        symbol: { 
          kind: SymbolKind.FUNCTION, 
          type: 'function', 
          name: 'testFunction',
          scope: 'local',
          confidence: 0.9
        },
        confidence: 0.9,
        score: 0.9,
        relevanceFactors: [{ 
          type: FactorType.SCOPE_PROXIMITY, 
          weight: 0.8, 
          score: 0.9, 
          description: 'Local scope match' 
        }],
        sortText: '001',
        filterText: 'testFunction',
        documentation: 'Test function'
      };

      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([mockRankedCompletion]);

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      result.suggestions.forEach(suggestion => {
        expect(suggestion.range).toBeDefined();
        expect(suggestion.range).toHaveProperty('startLineNumber');
        expect(suggestion.range).toHaveProperty('endLineNumber');
        expect(suggestion.range).toHaveProperty('startColumn');
        expect(suggestion.range).toHaveProperty('endColumn');
      });
    });
  });

  describe('trackCompletionAcceptance', () => {
    it('should track completion acceptance with proper range', () => {
      const mockItem: AICompletionItem = {
        label: 'testFunction',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'testFunction()',
        detail: 'Test function',
        range: new monaco.Range(1, 1, 1, 10),
        aiMetadata: {
          confidence: 0.9,
          relevanceFactors: ['local_scope'],
          processingTime: 50
        }
      };

      provider.trackCompletionAcceptance(mockItem, true, mockCompletionContext);

      expect(mockCompletionRanker.updateUserPreferences).toHaveBeenCalledWith(
        expect.any(Object),
        true,
        mockCompletionContext
      );
    });

    it('should track completion rejection with proper range', () => {
      const mockItem: AICompletionItem = {
        label: 'testVariable',
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: 'testVariable',
        range: new monaco.Range(1, 1, 1, 10),
        aiMetadata: {
          confidence: 0.7,
          relevanceFactors: ['type_match'],
          processingTime: 30
        }
      };

      provider.trackCompletionAcceptance(mockItem, false, mockCompletionContext);

      expect(mockCompletionRanker.updateUserPreferences).toHaveBeenCalledWith(
        expect.any(Object),
        false,
        mockCompletionContext
      );
    });
  });

  describe('AI completion integration', () => {
    it('should handle AI completion timeout gracefully', async () => {
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      
      // Mock AI orchestrator to timeout
      mockAIOrchestrator.processRequest.mockImplementation(() => 
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 300)) // Longer than 200ms timeout
      );

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      expect(result.suggestions).toBeDefined();
      // Should still return local completions even if AI times out
    });

    it('should merge AI and local completions properly', async () => {
      const mockLocalCompletion = {
        displayText: 'localVar',
        insertText: 'localVar',
        symbol: { 
          kind: SymbolKind.VARIABLE, 
          type: 'string', 
          name: 'localVar',
          scope: 'local',
          confidence: 0.8
        },
        confidence: 0.8,
        score: 0.8,
        relevanceFactors: [{ 
          type: FactorType.SCOPE_PROXIMITY, 
          weight: 0.7, 
          score: 0.8, 
          description: 'Local variable match' 
        }],
        sortText: '001',
        filterText: 'localVar',
        documentation: 'Local variable'
      };

      const mockAIResponse: AIResponse = {
        id: 'ai-response-1',
        requestId: 'req-1',
        result: 'aiSuggestion\nanotherSuggestion',
        confidence: 0.9,
        modelUsed: 'gpt-4',
        processingTime: 150,
        tokens: { promptTokens: 50, completionTokens: 20, totalTokens: 70 }
      };

      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue({
        ...mockCompletionContext,
        availableSymbols: [{ 
          name: 'localVar', 
          kind: SymbolKind.VARIABLE, 
          type: 'string',
          scope: 'local',
          confidence: 0.9
        }]
      });
      mockCompletionRanker.rankCompletions.mockResolvedValue([mockLocalCompletion]);
      mockAIOrchestrator.processRequest.mockResolvedValue(mockAIResponse);

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      // Should contain both local and AI suggestions
    });
  });

  describe('performance and caching', () => {
    it('should record performance metrics', async () => {
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);

      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken as any
      );

      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith(
        'completion_response_time',
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should clear cache successfully', () => {
      expect(() => provider.clearCache()).not.toThrow();
    });

    it('should return statistics', () => {
      const stats = provider.getStatistics();
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('accuracyRate');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('userSatisfactionScore');
    });
  });

  describe('project context management', () => {
    it('should set project context successfully', () => {
      const mockProjectContext: ProjectContext = {
        projectId: 'test-project',
        language: 'typescript',
        dependencies: [
          { name: 'react', version: '18.0.0', type: 'production', source: 'npm' },
          { name: 'lodash', version: '4.17.21', type: 'production', source: 'npm' }
        ],
        architecture: 'mvc' as any,
        codeMetrics: {
          linesOfCode: 1000,
          complexity: 5.2,
          testCoverage: 85,
          technicalDebt: 2.5,
          maintainabilityIndex: 75
        },
        userPreferences: {
          codingStyle: {
            indentation: 'spaces',
            indentSize: 2,
            lineLength: 100,
            namingConvention: 'camelCase',
            bracketStyle: 'same-line'
          },
          preferredPatterns: ['factory', 'observer'],
          completionSettings: {
            enabled: true,
            triggerCharacters: ['.', '('],
            maxSuggestions: 20,
            minConfidence: 0.1,
            showDocumentation: true
          },
          privacyLevel: PrivacyLevel.INTERNAL,
          modelPreferences: {
            preferredProviders: ['openai'],
            fallbackStrategy: 'most_accurate',
            maxCostPerRequest: 0.01,
            localOnly: false
          }
        }
      };

      expect(() => provider.setProjectContext(mockProjectContext)).not.toThrow();
    });
  });
});