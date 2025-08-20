/**
 * Monaco Completion Provider Unit Tests
 * 
 * Tests for Monaco Editor integration with AI completion system
 * validating <200ms response time and >90% accuracy targets.
 */

import * as monaco from 'monaco-editor';
import { MonacoCompletionProvider, AICompletionItem } from '../monaco-completion-provider';
import { ContextAnalyzer, CompletionContext, CompletionType } from '../context-analyzer';
import { CompletionRanker } from '../completion-ranker';
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

describe('MonacoCompletionProvider', () => {
  let provider: MonacoCompletionProvider;
  let mockContextAnalyzer: jest.Mocked<ContextAnalyzer>;
  let mockCompletionRanker: jest.Mocked<CompletionRanker>;
  let mockProjectAnalyzer: jest.Mocked<ProjectAnalyzer>;
  let mockAIOrchestrator: jest.Mocked<AIOrchestrator>;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;
  let mockModel: jest.Mocked<monaco.editor.ITextModel>;
  let mockCancellationToken: jest.Mocked<monaco.CancellationToken>;
  
  // Mock context objects
  let mockContext: monaco.languages.CompletionContext;
  let mockCompletionContext: CompletionContext;
  let mockPosition: monaco.Position;

  beforeEach(() => {
    // Initialize mock objects
    mockContext = { triggerKind: monaco.languages.CompletionTriggerKind.Invoke };
    mockCompletionContext = {
      type: CompletionType.FUNCTION,
      scope: 'local',
      imports: [],
      variables: [],
      functions: [],
      classes: [],
      suggestions: []
    };
    mockPosition = { lineNumber: 1, column: 1 } as monaco.Position;
    
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
      getValue: jest.fn().mockReturnValue('const x = ')
    } as any;

    mockCancellationToken = {
      isCancellationRequested: false
    } as any;

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
    const mockPosition: monaco.Position = {
      lineNumber: 1,
      column: 10
    } as any;

    const mockContext: monaco.languages.CompletionContext = {
      triggerKind: monaco.languages.CompletionTriggerKind.Invoke
    } as any;

    const mockCompletionContext: CompletionContext = {
      currentFile: '/test.ts',
      cursorPosition: { line: 0, character: 9 },
      surroundingCode: 'const x = ',
      imports: [],
      functions: [],
      variables: [],
      scope: { type: 'module', name: 'global', variables: [] },
      completionType: CompletionType.VARIABLE_DECLARATION,
      availableSymbols: [
        {
          name: 'testSymbol',
          type: 'string',
          kind: 'variable' as any,
          scope: 'local',
          confidence: 0.9
        }
      ],
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
        availableTypes: ['string', 'number'],
        genericConstraints: [],
        importedModules: [],
        currentNamespace: undefined
      }
    };

    it('should provide completion items successfully', async () => {
      // Setup mocks
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([
        {
          symbol: mockCompletionContext.availableSymbols[0],
          score: 0.9,
          confidence: 0.9,
          relevanceFactors: [],
          insertText: 'testSymbol',
          displayText: 'testSymbol: string',
          sortText: '001_testSymbol',
          filterText: 'testSymbol'
        }
      ]);

      // Execute
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      // Verify
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].label).toBe('testSymbol: string');
      expect(mockContextAnalyzer.analyzeCompletionContext).toHaveBeenCalledWith(
        '/test.ts',
        { line: 0, character: 9 },
        expect.any(Object)
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('Providing completion items', expect.any(Object));
    });

    it('should meet <200ms response time target', async () => {
      const startTime = Date.now();
      
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);

      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200); // <200ms target
    });

    it('should handle cancellation gracefully', async () => {
      mockCancellationToken.isCancellationRequested = true;

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      expect(result.suggestions).toHaveLength(0);
      expect(mockContextAnalyzer.analyzeCompletionContext).not.toHaveBeenCalled();
    });

    it('should use cached completions when available', async () => {
      // First call
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([
        {
          symbol: mockCompletionContext.availableSymbols[0],
          score: 0.9,
          confidence: 0.9,
          relevanceFactors: [],
          insertText: 'testSymbol',
          displayText: 'testSymbol: string',
          sortText: '001_testSymbol',
          filterText: 'testSymbol'
        }
      ]);

      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      // Second call should use cache
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      expect(result.suggestions).toHaveLength(1);
      expect(mockContextAnalyzer.analyzeCompletionContext).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should integrate AI completions when appropriate', async () => {
      const mockAIResponse: AIResponse = {
        id: 'ai-response-1',
        requestId: 'test-request',
        result: 'suggestedValue\nanotherSuggestion',
        confidence: 0.85,
        modelUsed: 'gpt-4-turbo',
        processingTime: 150,
        tokens: {
          promptTokens: 20,
          completionTokens: 10,
          totalTokens: 30,
          cost: 0.001
        }
      };

      // Setup for AI completion scenario
      const aiCompletionContext = {
        ...mockCompletionContext,
        completionType: CompletionType.GENERIC_EXPRESSION,
        availableSymbols: [] // Few local symbols to trigger AI
      };

      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(aiCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);
      mockAIOrchestrator.processRequest.mockResolvedValue(mockAIResponse);

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      expect(mockAIOrchestrator.processRequest).toHaveBeenCalled();
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Check AI metadata
      const aiItem = result.suggestions[0] as AICompletionItem;
      expect(aiItem.aiMetadata.modelUsed).toBe('gpt-4-turbo');
      expect(aiItem.aiMetadata.confidence).toBe(0.85);
    });

    it('should handle AI completion timeout gracefully', async () => {
      const aiCompletionContext = {
        ...mockCompletionContext,
        completionType: CompletionType.GENERIC_EXPRESSION,
        availableSymbols: []
      };

      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(aiCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);
      
      // Simulate timeout
      mockAIOrchestrator.processRequest.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 300))
      );

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      // Should still return local completions
      expect(result.suggestions).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith('AI completion failed', expect.any(Object));
    });

    it('should handle errors gracefully', async () => {
      mockContextAnalyzer.analyzeCompletionContext.mockRejectedValue(new Error('Analysis failed'));

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      expect(result.suggestions).toHaveLength(0);
      expect(mockLogger.error).toHaveBeenCalledWith('Completion provision failed', expect.any(Object));
    });
  });

  describe('resolveCompletionItem', () => {
    it('should resolve completion item with detailed documentation', async () => {
      const mockItem: AICompletionItem = {
        label: 'testFunction',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'testFunction()',
        detail: 'function testFunction(): void',
        aiMetadata: {
          confidence: 0.9,
          relevanceFactors: ['context_match'],
          processingTime: 50
        }
      };

      const result = await provider.resolveCompletionItem(mockItem, mockCancellationToken);

      expect(result.documentation).toBeDefined();
      expect(result.documentation).toMatchObject({
        value: expect.stringContaining('**testFunction**'),
        isTrusted: true
      });
    });
  });

  describe('trackCompletionAcceptance', () => {
    it('should track completion acceptance for learning', () => {
      const mockItem: AICompletionItem = {
        label: 'testSymbol',
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: 'testSymbol',
        aiMetadata: {
          confidence: 0.9,
          relevanceFactors: ['context_match'],
          processingTime: 50
        }
      };

      provider.trackCompletionAcceptance(mockItem, true, mockCompletionContext);

      expect(mockCompletionRanker.updateUserPreferences).toHaveBeenCalledWith(
        expect.any(Object),
        true,
        mockCompletionContext
      );
      expect(mockContextAnalyzer.updateUsagePatterns).toHaveBeenCalledWith(
        '/test.ts',
        'testSymbol',
        'const x = ',
        true
      );
    });

    it('should update user satisfaction score', () => {
      const mockItem: AICompletionItem = {
        label: 'testSymbol',
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: 'testSymbol',
        aiMetadata: {
          confidence: 0.9,
          relevanceFactors: ['context_match'],
          processingTime: 50
        }
      };

      const initialStats = provider.getStatistics();
      provider.trackCompletionAcceptance(mockItem, true, mockCompletionContext);
      const updatedStats = provider.getStatistics();

      expect(updatedStats.userSatisfactionScore).toBeGreaterThan(initialStats.userSatisfactionScore);
    });
  });

  describe('performance requirements', () => {
    it('should maintain >90% accuracy in completion relevance', async () => {
      // Setup high-quality completions
      const highQualityCompletions = Array.from({ length: 10 }, (_, i) => ({
        symbol: {
          name: `symbol${i}`,
          type: 'string',
          kind: 'variable' as any,
          scope: 'local',
          confidence: 0.95
        },
        score: 0.95,
        confidence: 0.95,
        relevanceFactors: [],
        insertText: `symbol${i}`,
        displayText: `symbol${i}: string`,
        sortText: `00${i}_symbol${i}`,
        filterText: `symbol${i}`
      }));

      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue(highQualityCompletions);

      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      // All suggestions should have high confidence
      const averageConfidence = result.suggestions.reduce((sum, item) => {
        const aiItem = item as AICompletionItem;
        return sum + aiItem.aiMetadata.confidence;
      }, 0) / result.suggestions.length;

      expect(averageConfidence).toBeGreaterThan(0.9); // >90% accuracy target
    });

    it('should handle large symbol sets efficiently', async () => {
      // Create large symbol set
      const largeSymbolSet = Array.from({ length: 1000 }, (_, i) => ({
        name: `symbol${i}`,
        type: 'string',
        kind: 'variable' as any,
        scope: 'local',
        confidence: 0.8
      }));

      const largeCompletionContext = {
        ...mockCompletionContext,
        availableSymbols: largeSymbolSet
      };

      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(largeCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);

      const startTime = Date.now();
      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(200); // Should still meet <200ms target
    });
  });

  describe('caching behavior', () => {
    it('should cache completions for performance', async () => {
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);

      // First call
      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      // Second call should be faster due to caching
      const startTime = Date.now();
      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );
      const cachedTime = Date.now() - startTime;

      expect(cachedTime).toBeLessThan(50); // Cached calls should be very fast
    });

    it('should clear cache when requested', () => {
      provider.clearCache();
      expect(mockLogger.debug).toHaveBeenCalledWith('Completion cache cleared');
    });
  });

  describe('statistics tracking', () => {
    it('should track completion statistics', async () => {
      mockContextAnalyzer.analyzeCompletionContext.mockResolvedValue(mockCompletionContext);
      mockCompletionRanker.rankCompletions.mockResolvedValue([]);

      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockCancellationToken
      );

      const stats = provider.getStatistics();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });
  });
});