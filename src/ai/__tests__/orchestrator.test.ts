/**
 * AI Orchestrator Unit Tests
 * 
 * Comprehensive tests for AI orchestration functionality including
 * performance validation, error handling, and quality control.
 */

import { AIOrchestrator } from '../orchestrator';
import { ModelRouter } from '../model-router';
import { ContextEngine } from '../context-engine';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import {
  AIRequest,
  AIResponse,
  AIRequestType,
  RequestPriority,
  PrivacyLevel,
  ModelSelection,
  ValidationResult,
  PerformanceMetrics,
  UserFeedback,
  OrchestratorConfig,
  AIError,
  AIErrorCode
} from '../interfaces';
import { PlatformType } from '../../core/whispering-interfaces';

// Mock dependencies
jest.mock('../model-router');
jest.mock('../context-engine');
jest.mock('../../logging/logger');
jest.mock('../../monitoring/performance-monitor');

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator;
  let mockModelRouter: jest.Mocked<ModelRouter>;
  let mockContextEngine: jest.Mocked<ContextEngine>;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;
  let config: OrchestratorConfig;

  beforeEach(() => {
    // Create mocks
    mockModelRouter = new ModelRouter(null as any, null as any) as jest.Mocked<ModelRouter>;
    mockContextEngine = new ContextEngine(null as any, null as any) as jest.Mocked<ContextEngine>;
    mockLogger = new Logger(PlatformType.WEB) as jest.Mocked<Logger>;
    mockPerformanceMonitor = new PerformanceMonitor(PlatformType.WEB) as jest.Mocked<PerformanceMonitor>;

    // Configure mocks
    mockModelRouter.selectModel = jest.fn();
    mockModelRouter.routeRequest = jest.fn();
    mockModelRouter.getAvailableModels = jest.fn();
    mockContextEngine.analyzeProject = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.debug = jest.fn();
    mockLogger.error = jest.fn();
    mockPerformanceMonitor.recordMetric = jest.fn();

    config = {
      maxConcurrentRequests: 10,
      requestTimeout: 30000,
      retryAttempts: 3,
      fallbackStrategy: 'graceful_degradation',
      qualityThreshold: 0.7
    };

    orchestrator = new AIOrchestrator(
      mockModelRouter,
      mockContextEngine,
      mockLogger,
      mockPerformanceMonitor,
      config
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processRequest', () => {
    const mockRequest: AIRequest = {
      id: 'test-request-1',
      type: AIRequestType.CODE_COMPLETION,
      context: {
        projectId: 'test-project',
        language: 'typescript',
        dependencies: [],
        architecture: 'unknown' as any,
        codeMetrics: {
          linesOfCode: 1000,
          complexity: 5,
          testCoverage: 80,
          technicalDebt: 2,
          maintainabilityIndex: 85
        },
        userPreferences: {
          codingStyle: {
            indentation: 'spaces',
            indentSize: 2,
            lineLength: 100,
            namingConvention: 'camelCase',
            bracketStyle: 'same-line'
          },
          preferredPatterns: [],
          completionSettings: {
            enabled: true,
            triggerCharacters: ['.'],
            maxSuggestions: 10,
            minConfidence: 0.7,
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
      },
      payload: { code: 'const x = ', position: { line: 1, character: 10 } },
      priority: RequestPriority.NORMAL,
      privacyLevel: PrivacyLevel.INTERNAL,
      timestamp: new Date()
    };

    const mockModelSelection: ModelSelection = {
      modelId: 'gpt-4-turbo',
      provider: 'openai',
      confidence: 0.9,
      estimatedCost: 0.005,
      estimatedLatency: 1500,
      reasoning: 'Best model for code completion'
    };

    const mockResponse: AIResponse = {
      id: 'response-1',
      requestId: 'test-request-1',
      result: 'const x = "hello world";',
      confidence: 0.85,
      modelUsed: 'gpt-4-turbo',
      processingTime: 1200,
      tokens: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70,
        cost: 0.0021
      }
    };

    it('should process request successfully', async () => {
      // Setup mocks
      mockModelRouter.selectModel.mockResolvedValue(mockModelSelection);
      mockModelRouter.routeRequest.mockResolvedValue(mockResponse);

      // Execute
      const result = await orchestrator.processRequest(mockRequest);

      // Verify
      expect(result).toEqual(mockResponse);
      expect(mockModelRouter.selectModel).toHaveBeenCalledWith(mockRequest);
      expect(mockModelRouter.routeRequest).toHaveBeenCalledWith(mockRequest, mockModelSelection);
      expect(mockLogger.info).toHaveBeenCalledWith('Processing AI request', expect.any(Object));
      expect(mockLogger.info).toHaveBeenCalledWith('AI request completed successfully', expect.any(Object));
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalled();
    });

    it('should validate request before processing', async () => {
      const invalidRequest = { ...mockRequest, id: '' };

      await expect(orchestrator.processRequest(invalidRequest)).rejects.toThrow('Invalid request');
    });

    it('should enforce concurrent request limits', async () => {
      // Set low limit for testing
      config.maxConcurrentRequests = 1;
      
      // Setup long-running mock
      mockModelRouter.selectModel.mockResolvedValue(mockModelSelection);
      mockModelRouter.routeRequest.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 1000))
      );

      // Start first request
      const firstRequest = orchestrator.processRequest(mockRequest);

      // Second request should be rejected
      const secondRequest = { ...mockRequest, id: 'test-request-2' };
      await expect(orchestrator.processRequest(secondRequest)).rejects.toThrow('Maximum concurrent requests exceeded');

      // Wait for first request to complete
      await firstRequest;
    });

    it('should validate response quality', async () => {
      const lowQualityResponse = { ...mockResponse, confidence: 0.5 };
      
      mockModelRouter.selectModel.mockResolvedValue(mockModelSelection);
      mockModelRouter.routeRequest.mockResolvedValue(lowQualityResponse);

      await expect(orchestrator.processRequest(mockRequest)).rejects.toThrow('Response validation failed');
    });

    it('should handle model routing errors', async () => {
      const routingError = new Error('Model unavailable') as AIError;
      routingError.code = AIErrorCode.MODEL_UNAVAILABLE;
      routingError.retryable = true;

      mockModelRouter.selectModel.mockRejectedValue(routingError);

      await expect(orchestrator.processRequest(mockRequest)).rejects.toThrow('Model unavailable');
      expect(mockLogger.error).toHaveBeenCalledWith('AI request failed', expect.any(Object));
    });

    it('should track performance metrics for successful requests', async () => {
      mockModelRouter.selectModel.mockResolvedValue(mockModelSelection);
      mockModelRouter.routeRequest.mockResolvedValue(mockResponse);

      await orchestrator.processRequest(mockRequest);

      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('ai_response_time', expect.any(Number));
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('ai_throughput', expect.any(Number));
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('ai_error_rate', 0);
    });

    it('should track error metrics for failed requests', async () => {
      const error = new Error('Processing failed');
      mockModelRouter.selectModel.mockRejectedValue(error);

      await expect(orchestrator.processRequest(mockRequest)).rejects.toThrow('Processing failed');

      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('ai_error_rate', 1);
    });
  });

  describe('routeToOptimalModel', () => {
    const mockRequest: AIRequest = {
      id: 'test-request-1',
      type: AIRequestType.CODE_COMPLETION,
      context: {} as any,
      payload: {},
      priority: RequestPriority.NORMAL,
      privacyLevel: PrivacyLevel.INTERNAL,
      timestamp: new Date()
    };

    it('should route to optimal model successfully', async () => {
      const mockSelection: ModelSelection = {
        modelId: 'gpt-4-turbo',
        provider: 'openai',
        confidence: 0.9,
        estimatedCost: 0.005,
        estimatedLatency: 1500,
        reasoning: 'Best model for code completion'
      };

      mockModelRouter.getAvailableModels.mockResolvedValue([{} as any]);
      mockModelRouter.selectModel.mockResolvedValue(mockSelection);

      const result = await orchestrator.routeToOptimalModel(mockRequest);

      expect(result).toEqual(mockSelection);
      expect(mockModelRouter.selectModel).toHaveBeenCalledWith(mockRequest);
      expect(mockLogger.debug).toHaveBeenCalledWith('Model selected for request', expect.any(Object));
    });

    it('should throw error when no models available', async () => {
      mockModelRouter.getAvailableModels.mockResolvedValue([]);

      await expect(orchestrator.routeToOptimalModel(mockRequest)).rejects.toThrow('No AI models available');
    });

    it('should handle model selection errors', async () => {
      const selectionError = new Error('Model selection failed');
      
      mockModelRouter.getAvailableModels.mockResolvedValue([{} as any]);
      mockModelRouter.selectModel.mockRejectedValue(selectionError);

      await expect(orchestrator.routeToOptimalModel(mockRequest)).rejects.toThrow('Model selection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to route request to model', expect.any(Object));
    });
  });

  describe('aggregateResponses', () => {
    const mockResponses: AIResponse[] = [
      {
        id: 'response-1',
        requestId: 'test-request-1',
        result: 'Result 1',
        confidence: 0.8,
        modelUsed: 'model-1',
        processingTime: 1000,
        tokens: { promptTokens: 50, completionTokens: 20, totalTokens: 70, cost: 0.002 }
      },
      {
        id: 'response-2',
        requestId: 'test-request-1',
        result: 'Result 2',
        confidence: 0.9,
        modelUsed: 'model-2',
        processingTime: 1500,
        tokens: { promptTokens: 60, completionTokens: 25, totalTokens: 85, cost: 0.003 }
      }
    ];

    it('should aggregate multiple responses successfully', async () => {
      const result = await orchestrator.aggregateResponses(mockResponses);

      expect(result.confidence).toBe(0.85); // Average of 0.8 and 0.9
      expect(result.processingTime).toBe(1500); // Max processing time
      expect(result.tokens.totalTokens).toBe(155); // Sum of tokens
      expect(result.tokens.cost).toBe(0.005); // Sum of costs
      expect(mockLogger.debug).toHaveBeenCalledWith('Responses aggregated', expect.any(Object));
    });

    it('should return single response when only one provided', async () => {
      const singleResponse = [mockResponses[0]];
      const result = await orchestrator.aggregateResponses(singleResponse);

      expect(result).toEqual(mockResponses[0]);
    });

    it('should throw error when no responses provided', async () => {
      await expect(orchestrator.aggregateResponses([])).rejects.toThrow('No responses to aggregate');
    });
  });

  describe('validateResponse', () => {
    const mockResponse: AIResponse = {
      id: 'response-1',
      requestId: 'test-request-1',
      result: 'Valid result',
      confidence: 0.85,
      modelUsed: 'gpt-4-turbo',
      processingTime: 1200,
      tokens: { promptTokens: 50, completionTokens: 20, totalTokens: 70, cost: 0.002 }
    };

    it('should validate high-quality response as valid', async () => {
      const result = await orchestrator.validateResponse(mockResponse);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(0.85);
      expect(result.issues).toHaveLength(0);
    });

    it('should flag low confidence responses', async () => {
      const lowConfidenceResponse = { ...mockResponse, confidence: 0.5 };
      const result = await orchestrator.validateResponse(lowConfidenceResponse);

      expect(result.isValid).toBe(true); // Still valid but with issues
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('accuracy');
      expect(result.issues[0].description).toContain('confidence');
    });

    it('should flag slow responses', async () => {
      config.maxResponseTime = 1000;
      const slowResponse = { ...mockResponse, processingTime: 2000 };
      const result = await orchestrator.validateResponse(slowResponse);

      expect(result.issues.some(issue => issue.type === 'performance')).toBe(true);
    });

    it('should flag empty responses as invalid', async () => {
      const emptyResponse = { ...mockResponse, result: '' };
      const result = await orchestrator.validateResponse(emptyResponse);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.severity === 'critical')).toBe(true);
    });
  });

  describe('recordUserFeedback', () => {
    const mockFeedback: UserFeedback = {
      requestId: 'test-request-1',
      rating: 4,
      feedback: 'Good response',
      accepted: true,
      timestamp: new Date(),
      context: 'code completion'
    };

    it('should record user feedback successfully', () => {
      orchestrator.recordUserFeedback(mockFeedback);

      expect(mockLogger.info).toHaveBeenCalledWith('User feedback recorded', expect.any(Object));
    });

    it('should trigger retraining on high negative feedback', () => {
      // Record multiple negative feedback entries
      for (let i = 0; i < 60; i++) {
        const negativeFeedback = {
          ...mockFeedback,
          requestId: `request-${i}`,
          rating: 2,
          accepted: false
        };
        orchestrator.recordUserFeedback(negativeFeedback);
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'High negative feedback ratio detected, triggering model retraining',
        expect.any(Object)
      );
    });
  });

  describe('optimizeResourceAllocation', () => {
    it('should optimize resource allocation based on performance history', async () => {
      // Add performance history
      const metrics: PerformanceMetrics = {
        responseTime: 2500, // Above threshold
        throughput: 0.4,
        errorRate: 0.02,
        resourceUsage: {
          cpuUsage: 70,
          memoryUsage: 1024,
          networkBandwidth: 50,
          storageUsage: 2048
        },
        userSatisfaction: 0.8
      };

      // Simulate performance history
      for (let i = 0; i < 20; i++) {
        orchestrator.trackPerformanceMetrics(metrics);
      }

      await orchestrator.optimizeResourceAllocation();

      expect(mockLogger.info).toHaveBeenCalledWith('Optimizing resource allocation', expect.any(Object));
    });

    it('should not optimize with insufficient data', async () => {
      await orchestrator.optimizeResourceAllocation();

      // Should not log optimization with insufficient data
      expect(mockLogger.info).not.toHaveBeenCalledWith('Optimizing resource allocation', expect.any(Object));
    });
  });

  describe('Performance Targets', () => {
    it('should meet Cycle 4 performance target of <200ms response time', async () => {
      const fastResponse = {
        id: 'response-1',
        requestId: 'test-request-1',
        result: 'Fast result',
        confidence: 0.9,
        modelUsed: 'fast-model',
        processingTime: 150, // Under 200ms target
        tokens: { promptTokens: 30, completionTokens: 10, totalTokens: 40, cost: 0.001 }
      };

      mockModelRouter.selectModel.mockResolvedValue({
        modelId: 'fast-model',
        provider: 'openai',
        confidence: 0.9,
        estimatedCost: 0.001,
        estimatedLatency: 150,
        reasoning: 'Fast model for performance'
      });
      mockModelRouter.routeRequest.mockResolvedValue(fastResponse);

      const mockRequest: AIRequest = {
        id: 'test-request-1',
        type: AIRequestType.CODE_COMPLETION,
        context: {} as any,
        payload: {},
        priority: RequestPriority.HIGH,
        privacyLevel: PrivacyLevel.INTERNAL,
        timestamp: new Date()
      };

      const result = await orchestrator.processRequest(mockRequest);

      expect(result.processingTime).toBeLessThan(200);
      expect(result.confidence).toBeGreaterThan(0.9); // >90% accuracy target
    });
  });
});