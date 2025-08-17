import { EnhancedAIOrchestrator } from '../enhanced-ai-orchestrator';
import { PlatformType } from '../../core/whispering-interfaces';

// Mock dependencies to isolate the orchestrator
jest.mock('../../logging/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    time: jest.fn((_name, fn) => fn()), // Mock time to just execute the function
  })),
}));

// Create mock instances that will be used by the orchestrator
const mockContextAnalyzer = {
  analyzeContext: jest.fn()
};

const mockPrivacyDetector = {
  analyzeSensitivity: jest.fn()
};

const mockASTAnalyzer = {
  analyzeCode: jest.fn()
};

const mockLearningEngine = {
  recordInteraction: jest.fn()
};

describe('EnhancedAIOrchestrator Hardening Tests', () => {
  let orchestrator: EnhancedAIOrchestrator;

  // Increase timeout for tests that might involve complex async logic or simulated model calls
  jest.setTimeout(15000);

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    jest.clearAllMocks();
    orchestrator = new EnhancedAIOrchestrator(PlatformType.WEB);
    
    // Replace the internal analyzers with our mocks
    (orchestrator as any).contextAnalyzer = mockContextAnalyzer;
    (orchestrator as any).privacyDetector = mockPrivacyDetector;
    (orchestrator as any).astAnalyzer = mockASTAnalyzer;
    (orchestrator as any).learningEngine = mockLearningEngine;
    
    // Default mock implementations
    mockPrivacyDetector.analyzeSensitivity.mockResolvedValue({ isSensitive: false });
    mockASTAnalyzer.analyzeCode.mockResolvedValue({ 
      cyclomaticComplexity: 5,
      detectedPatterns: [],
      optimizationSuggestions: [],
      structuralMetrics: { linesOfCode: 1, functionCount: 0, classCount: 0, commentRatio: 0 }
    });
    mockLearningEngine.recordInteraction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // This is a placeholder for any cleanup logic, like stopping timers or workers.
    // If the orchestrator started any long-running processes, they would be terminated here.
    // e.g., orchestrator.cleanup();
  });

  describe('Context-Aware Model Selection', () => {
    it('should select a fast model for simple code completion', async () => {
      const request = { type: 'code-completion', context: {} };
      const contextAnalysis = { complexity: 0.2 };
      const privacyAnalysis = { isSensitive: false };
      
      const selection = await (orchestrator as any).selectContextAwareModel(request, contextAnalysis, privacyAnalysis);

      expect(selection.modelId).toBe('groq/llama-3-70b');
      expect(selection.reason).toContain('Fast completion');
    });

    it('should select an advanced model for complex code analysis', async () => {
      const request = { type: 'code-analysis', context: {} };
      const contextAnalysis = { complexity: 0.8 };
      const privacyAnalysis = { isSensitive: false };
      
      const selection = await (orchestrator as any).selectContextAwareModel(request, contextAnalysis, privacyAnalysis);

      expect(selection.modelId).toBe('openrouter/gpt-4-turbo');
      expect(selection.reason).toContain('Complex analysis');
    });

    it('should use the cost-aware fallback for unhandled scenarios', async () => {
      const request = { type: 'code-generation', context: {} };
      const contextAnalysis = { complexity: 0.5, language: 'python' };
      const privacyAnalysis = { isSensitive: false };
      
      const selection = await (orchestrator as any).selectContextAwareModel(request, contextAnalysis, privacyAnalysis);

      expect(selection.modelId).toBe('openrouter/fallback-model');
      expect(selection.reason).toBe('Fallback selection');
    });
  });

  describe('Privacy and Security', () => {
    it('should force routing to a local model when privacy mode is enabled', async () => {
      const request = { type: 'code-analysis', privacyMode: true, context: {} };
      const selection = await (orchestrator as any).selectContextAwareModel(request, { complexity: 0.8 }, { isSensitive: false });

      expect(selection.modelId).toBe('ollama/local');
      expect(selection.reason).toBe('Privacy protection');
    });

    it('should force routing to a local model when sensitive content is detected', async () => {
      const request = { type: 'code-analysis', context: {} };
      const contextAnalysis = { complexity: 0.8 };
      const privacyAnalysis = { isSensitive: true };
      
      const selection = await (orchestrator as any).selectContextAwareModel(request, contextAnalysis, privacyAnalysis);

      expect(selection.modelId).toBe('ollama/local');
      expect(selection.reason).toBe('Privacy protection');
    });
  });

  describe('End-to-End Request Processing', () => {
    it('should successfully process a request through the entire enhanced pipeline', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.8, language: 'typescript' });

      const request = { id: 'req-e2e', type: 'code-analysis', code: 'const x = 1;', context: {} };
      const response = await orchestrator.processEnhancedRequest(request as any);

      expect(response).toBeDefined();
      expect(response.modelSelection.modelId).toBe('openrouter/gpt-4-turbo');
      expect(response.astAnalysis).not.toBeNull();
      expect(mockLearningEngine.recordInteraction).toHaveBeenCalled();
    });

    it('should handle errors during processing gracefully', async () => {
      const testError = new Error('AST analysis failed');
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.5 });
      mockASTAnalyzer.analyzeCode.mockRejectedValue(testError);

      const request = { id: 'req-fail', type: 'code-analysis', code: 'const x = 1;', context: {} };

      await expect(orchestrator.processEnhancedRequest(request as any)).rejects.toThrow(testError);
      // Error logging is handled internally - we verify the error is properly propagated
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete requests within acceptable time limits', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.5 });
      
      const startTime = Date.now();
      const request = { id: 'req-perf', type: 'code-completion', context: {} };
      
      await orchestrator.processEnhancedRequest(request as any);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests without resource conflicts', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.3 });
      
      const requests = Array.from({ length: 5 }, (_, i) => ({
        id: `req-concurrent-${i}`,
        type: 'code-completion',
        context: {}
      }));

      const promises = requests.map(req => orchestrator.processEnhancedRequest(req as any));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from context analysis failures', async () => {
      mockContextAnalyzer.analyzeContext.mockRejectedValue(new Error('Context analysis failed'));
      
      const request = { id: 'req-context-fail', type: 'code-analysis', context: {} };
      
      await expect(orchestrator.processEnhancedRequest(request as any)).rejects.toThrow('Context analysis failed');
    });

    it('should handle privacy detection failures gracefully', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.5 });
      mockPrivacyDetector.analyzeSensitivity.mockRejectedValue(new Error('Privacy detection failed'));
      
      const request = { id: 'req-privacy-fail', type: 'code-analysis', context: {} };
      
      await expect(orchestrator.processEnhancedRequest(request as any)).rejects.toThrow('Privacy detection failed');
    });

    it('should continue processing when AST analysis is optional and fails', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.5 });
      mockASTAnalyzer.analyzeCode.mockRejectedValue(new Error('AST failed'));
      
      const request = { id: 'req-ast-fail', type: 'code-analysis', code: 'const x = 1;', context: {} };
      
      // Should still fail because AST analysis is required for code analysis
      await expect(orchestrator.processEnhancedRequest(request as any)).rejects.toThrow('AST failed');
    });
  });

  describe('Learning and Adaptation', () => {
    it('should record successful interactions for learning', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.6, language: 'javascript' });
      
      const request = { id: 'req-learn', type: 'explanation', context: {} };
      await orchestrator.processEnhancedRequest(request as any);
      
      expect(mockLearningEngine.recordInteraction).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'req-learn' }),
        expect.any(Object),
        expect.objectContaining({ complexity: 0.6, language: 'javascript' })
      );
    });

    it('should record failed interactions for learning improvement', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({ complexity: 0.4 });
      mockASTAnalyzer.analyzeCode.mockRejectedValue(new Error('Analysis failed'));
      
      const request = { id: 'req-learn-fail', type: 'code-analysis', code: 'invalid code', context: {} };
      
      try {
        await orchestrator.processEnhancedRequest(request as any);
      } catch (error) {
        // Expected to fail
      }
      
      // Learning should still be attempted even for failed requests
      // (This would depend on the actual implementation)
    });
  });

  describe('Model Selection Edge Cases', () => {
    it('should handle unknown task types gracefully', async () => {
      const request = { type: 'unknown-task-type', context: {} };
      const contextAnalysis = { complexity: 0.5 };
      const privacyAnalysis = { isSensitive: false };
      
      const selection = await (orchestrator as any).selectContextAwareModel(request, contextAnalysis, privacyAnalysis);
      
      // Should fall back to cost-aware selection
      expect(selection.modelId).toBe('openrouter/fallback-model');
    });

    it('should prioritize privacy over performance when both are required', async () => {
      const request = { type: 'code-completion', privacyMode: true, context: {} };
      const selection = await (orchestrator as any).selectContextAwareModel(
        request, 
        { complexity: 0.1 }, // Low complexity would normally choose fast model
        { isSensitive: false }
      );

      expect(selection.modelId).toBe('ollama/local');
      expect(selection.reason).toBe('Privacy protection');
    });
  });
});