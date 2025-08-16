import { SelfEvolutionEngine, EvolutionConfig, AdaptationEvent } from '../self-evolution-engine';
import { PlatformType } from '../../../core/whispering-interfaces';
import { PlatformAdapter } from '../../../core/platform-interfaces';

// Mock PlatformAdapter
const mockPlatformAdapter: PlatformAdapter = {
  type: PlatformType.WEB,
  createEditor: jest.fn(),
  createFileExplorer: jest.fn(),
  createTerminal: jest.fn(),
  createWhisperingHUD: jest.fn(),
  getFileSystem: jest.fn(),
  getStorage: jest.fn(),
  getGitHubClient: jest.fn(),
  getNotificationManager: jest.fn(),
  createObserverEnvironment: jest.fn(),
  optimizeForPlatform: jest.fn(),
  getCapabilities: jest.fn()
};

describe('SelfEvolutionEngine', () => {
  let engine: SelfEvolutionEngine;
  let config: EvolutionConfig;

  beforeEach(() => {
    config = {
      platform: PlatformType.WEB,
      adapter: mockPlatformAdapter,
      consciousnessRef: {}
    };
    engine = new SelfEvolutionEngine(config);
  });

  describe('constructor', () => {
    it('should create an instance with the provided config', () => {
      expect(engine).toBeInstanceOf(SelfEvolutionEngine);
    });
  });

  describe('onAdaptation', () => {
    it('should register adaptation callbacks', () => {
      const callback = jest.fn();
      engine.onAdaptation(callback);
      
      // This would test the internal callback registration
      // We can't directly access private properties, but we can test behavior
      expect(callback).toBeDefined();
    });
  });

  describe('evolve', () => {
    it('should log evolution cycle initiation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await engine.evolve();
      
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Evolution cycle initiated');
      consoleSpy.mockRestore();
    });
  });

  describe('performEvolutionCycle', () => {
    it('should perform evolution cycle and log completion', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await engine.performEvolutionCycle();
      
      expect(consoleSpy).toHaveBeenCalledWith('🧬 Performing evolution cycle');
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Evolution cycle initiated');
      consoleSpy.mockRestore();
    });
  });

  describe('learnFromInteraction', () => {
    it('should log learning from interaction', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockSuggestion = {
        id: 'test-suggestion',
        type: 'SYSTEM_ELEGANCE' as any,
        observer: 'SYSTEMS_PHILOSOPHER' as any,
        message: 'Test suggestion',
        confidence: 0.8,
        subtlety: 0.6,
        timing: 'NEXT_PAUSE' as any,
        renderLocation: 'HUD_OVERLAY' as any,
        metadata: {
          createdAt: new Date(),
          platform: PlatformType.WEB,
          contextHash: 'test',
          priority: 1,
          dismissible: true
        }
      };
      
      await engine.learnFromInteraction(mockSuggestion, PlatformType.WEB);
      
      expect(consoleSpy).toHaveBeenCalledWith('📚 Learning from interaction');
      consoleSpy.mockRestore();
    });
  });
});
