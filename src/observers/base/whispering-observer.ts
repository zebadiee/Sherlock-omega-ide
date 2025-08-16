/**
 * Base WhisperingObserver Implementation
 * Platform-agnostic foundation for all three observers with platform abstraction
 */

import {
  WhisperingObserver,
  Insight,
  WhisperSuggestion,
  DeveloperFeedback,
  ObservationContext,
  PlatformType,
  InsightType,
  ObserverType,
  WhisperTiming,
  RenderLocation,
  FeedbackAction
} from '../../core/whispering-interfaces';
import { SensorResult, SensorStatus } from '../../types/core';
import { 
  UnifiedObserverContext,
  ObserverCapabilities,
  EnvironmentType
} from '../../types/unified';
import {
  LearningData,
  PerformanceMetrics
} from '../../types/whispering';
import { SensitivityLevel } from '../../types/unified';
import { PlatformAdapter } from '../../core/platform-interfaces';

/**
 * Abstract base class for all whispering observers
 * Provides platform abstraction and common functionality
 */
export abstract class BaseWhisperingObserver<T> implements WhisperingObserver<T> {
  protected platform: PlatformType;
  protected adapter: PlatformAdapter;
  protected observerContext: UnifiedObserverContext;
  protected learningData: Map<PlatformType, LearningData>;
  protected isObserving: boolean = false;
  protected lastObservation: Date | null = null;
  protected performanceMetrics: PerformanceMetrics;
  
  // Abstract properties that must be implemented by concrete observers
  protected abstract observerType: ObserverType;
  protected abstract defaultInsightType: InsightType;
  
  constructor(
    adapter: PlatformAdapter,
    observerContext: UnifiedObserverContext
  ) {
    this.adapter = adapter;
    this.platform = adapter.type;
    this.observerContext = observerContext;
    this.learningData = new Map();
    this.performanceMetrics = this.initializePerformanceMetrics();
  }

  // SensorInterface implementation
  async monitor(): Promise<SensorResult> {
    const startTime = Date.now();
    
    try {
      // Platform-specific monitoring implementation
      const monitoringResult = await this.performPlatformSpecificMonitoring();
      
      const endTime = Date.now();
      this.updatePerformanceMetrics(endTime - startTime, true);
      
      return {
        sensorId: this.getId(),
        timestamp: new Date(),
        status: SensorStatus.ACTIVE,
        data: monitoringResult,
        issues: [], // Observers don't directly report issues, they generate insights
        confidence: this.calculateOverallConfidence()
      };
    } catch (error) {
      const endTime = Date.now();
      this.updatePerformanceMetrics(endTime - startTime, false);
      
      return {
        sensorId: this.getId(),
        timestamp: new Date(),
        status: SensorStatus.ERROR,
        data: { error: (error as Error).message },
        issues: [],
        confidence: 0
      };
    }
  }

  getType(): string {
    return this.observerType;
  }

  getId(): string {
    return `${this.observerType.toLowerCase()}-${this.platform.toLowerCase()}`;
  }

  isActive(): boolean {
    return this.isObserving;
  }

  async start(): Promise<void> {
    if (this.isObserving) {
      return;
    }

    try {
      // Initialize platform-specific environment
      await this.initializePlatformEnvironment();
      
      // Start platform-specific observation
      await this.startPlatformSpecificObservation();
      
      this.isObserving = true;
      this.lastObservation = new Date();
      
      console.log(`🌙 ${this.observerType} awakened on ${this.platform} platform`);
    } catch (error) {
      console.error(`Failed to start ${this.observerType}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isObserving) {
      return;
    }

    try {
      // Stop platform-specific observation
      await this.stopPlatformSpecificObservation();
      
      // Cleanup platform-specific resources
      await this.cleanupPlatformResources();
      
      this.isObserving = false;
      
      console.log(`🌙 ${this.observerType} resting on ${this.platform} platform`);
    } catch (error) {
      console.error(`Failed to stop ${this.observerType}:`, error);
      throw error;
    }
  }

  // WhisperingObserver implementation
  async observe(context: T, platform: PlatformType): Promise<void> {
    if (!this.isObserving) {
      return;
    }

    try {
      const observationContext = await this.buildObservationContext(context, platform);
      
      // Perform platform-specific analysis
      const insights = await this.analyzeForInsights(context, observationContext);
      
      // Process insights through ethical gateway
      const validatedInsights = await this.validateInsights(insights, observationContext);
      
      // Generate whispers for valid insights
      for (const insight of validatedInsights) {
        const whisper = await this.whisper(insight, platform);
        await this.deliverWhisper(whisper, observationContext);
      }
      
      this.lastObservation = new Date();
    } catch (error) {
      console.error(`Observation error in ${this.observerType}:`, error);
      // Don't throw - observers should be resilient
    }
  }

  async whisper(insight: Insight, platform: PlatformType): Promise<WhisperSuggestion> {
    const baseWhisper = await this.generateBaseWhisper(insight);
    return this.formatWhisperForPlatform(baseWhisper, platform);
  }

  attune(feedback: DeveloperFeedback, platform: PlatformType): void {
    // Update learning data based on feedback
    const platformLearning = this.learningData.get(platform) || this.createEmptyLearningData(platform);
    
    // Process feedback to improve future suggestions
    this.processFeedback(feedback, platformLearning);
    
    // Update learning data
    this.learningData.set(platform, platformLearning);
    
    // Adjust sensitivity and patterns based on feedback
    this.adjustObserverSensitivity(feedback, platform);
  }

  isResonating(platform: PlatformType): boolean {
    // Check if observer is ready to provide suggestions
    if (!this.isObserving) {
      return false;
    }

    // Check platform-specific readiness
    const platformCapabilities = this.observerContext.capabilities;
    const environmentReady = this.isEnvironmentReady(platform);
    const resourcesAvailable = this.areResourcesAvailable();
    const recentActivity = this.hasRecentActivity();

    return environmentReady && resourcesAvailable && recentActivity;
  }

  async optimizeForPlatform(platform: PlatformType): Promise<void> {
    // Adjust observer configuration for optimal performance on the platform
    const platformOptimizations = await this.getPlatformOptimizations(platform);
    
    // Apply optimizations
    await this.applyOptimizations(platformOptimizations);
    
    // Update observer context
    this.observerContext.configuration = {
      ...this.observerContext.configuration,
      ...platformOptimizations.configuration
    };
  }

  // Abstract methods that must be implemented by concrete observers
  protected abstract analyzeForInsights(
    context: T, 
    observationContext: ObservationContext
  ): Promise<Insight[]>;

  protected abstract generateBaseWhisper(insight: Insight): Promise<WhisperSuggestion>;

  protected abstract getPlatformOptimizations(platform: PlatformType): Promise<PlatformOptimization>;

  // Platform abstraction methods
  protected async initializePlatformEnvironment(): Promise<void> {
    switch (this.platform) {
      case PlatformType.WEB:
        await this.initializeWebEnvironment();
        break;
      case PlatformType.DESKTOP:
        await this.initializeDesktopEnvironment();
        break;
      case PlatformType.HYBRID:
        await this.initializeHybridEnvironment();
        break;
    }
  }

  protected async performPlatformSpecificMonitoring(): Promise<any> {
    if (!this.isObserving) {
      throw new Error('Observer is not active');
    }
    
    switch (this.platform) {
      case PlatformType.WEB:
        return this.performWebMonitoring();
      case PlatformType.DESKTOP:
        return this.performDesktopMonitoring();
      case PlatformType.HYBRID:
        return this.performHybridMonitoring();
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  protected async startPlatformSpecificObservation(): Promise<void> {
    switch (this.platform) {
      case PlatformType.WEB:
        await this.startWebObservation();
        break;
      case PlatformType.DESKTOP:
        await this.startDesktopObservation();
        break;
      case PlatformType.HYBRID:
        await this.startHybridObservation();
        break;
    }
  }

  protected async stopPlatformSpecificObservation(): Promise<void> {
    switch (this.platform) {
      case PlatformType.WEB:
        await this.stopWebObservation();
        break;
      case PlatformType.DESKTOP:
        await this.stopDesktopObservation();
        break;
      case PlatformType.HYBRID:
        await this.stopHybridObservation();
        break;
    }
  }

  protected async cleanupPlatformResources(): Promise<void> {
    switch (this.platform) {
      case PlatformType.WEB:
        await this.cleanupWebResources();
        break;
      case PlatformType.DESKTOP:
        await this.cleanupDesktopResources();
        break;
      case PlatformType.HYBRID:
        await this.cleanupHybridResources();
        break;
    }
  }

  // Web platform methods (to be overridden by concrete observers)
  protected async initializeWebEnvironment(): Promise<void> {
    // Default web initialization
    if (this.observerContext.environment.type === EnvironmentType.WEB_WORKER) {
      await this.initializeWebWorker();
    }
  }

  protected async performWebMonitoring(): Promise<any> {
    // Default web monitoring
    return {
      platform: PlatformType.WEB,
      timestamp: new Date(),
      resources: await this.getWebResources()
    };
  }

  protected async startWebObservation(): Promise<void> {
    // Default web observation start
    console.log(`Starting web observation for ${this.observerType}`);
  }

  protected async stopWebObservation(): Promise<void> {
    // Default web observation stop
    console.log(`Stopping web observation for ${this.observerType}`);
  }

  protected async cleanupWebResources(): Promise<void> {
    // Default web cleanup
    if (this.observerContext.environment.type === EnvironmentType.WEB_WORKER) {
      await this.cleanupWebWorker();
    }
  }

  // Desktop platform methods (to be overridden by concrete observers)
  protected async initializeDesktopEnvironment(): Promise<void> {
    // Default desktop initialization
    if (this.observerContext.environment.type === EnvironmentType.CHILD_PROCESS) {
      await this.initializeChildProcess();
    }
  }

  protected async performDesktopMonitoring(): Promise<any> {
    // Default desktop monitoring
    return {
      platform: PlatformType.DESKTOP,
      timestamp: new Date(),
      resources: await this.getDesktopResources()
    };
  }

  protected async startDesktopObservation(): Promise<void> {
    // Default desktop observation start
    console.log(`Starting desktop observation for ${this.observerType}`);
  }

  protected async stopDesktopObservation(): Promise<void> {
    // Default desktop observation stop
    console.log(`Stopping desktop observation for ${this.observerType}`);
  }

  protected async cleanupDesktopResources(): Promise<void> {
    // Default desktop cleanup
    if (this.observerContext.environment.type === EnvironmentType.CHILD_PROCESS) {
      await this.cleanupChildProcess();
    }
  }

  // Hybrid platform methods (to be overridden by concrete observers)
  protected async initializeHybridEnvironment(): Promise<void> {
    // Initialize both web and desktop capabilities
    await this.initializeWebEnvironment();
    await this.initializeDesktopEnvironment();
  }

  protected async performHybridMonitoring(): Promise<any> {
    // Combine web and desktop monitoring
    const webData = await this.performWebMonitoring();
    const desktopData = await this.performDesktopMonitoring();
    
    return {
      platform: PlatformType.HYBRID,
      web: webData,
      desktop: desktopData,
      timestamp: new Date()
    };
  }

  protected async startHybridObservation(): Promise<void> {
    await this.startWebObservation();
    await this.startDesktopObservation();
  }

  protected async stopHybridObservation(): Promise<void> {
    await this.stopWebObservation();
    await this.stopDesktopObservation();
  }

  protected async cleanupHybridResources(): Promise<void> {
    await this.cleanupWebResources();
    await this.cleanupDesktopResources();
  }

  // Helper methods
  protected async buildObservationContext(context: T, platform: PlatformType): Promise<ObservationContext> {
    // Build comprehensive observation context
    return {
      timestamp: new Date(),
      platform,
      codeContext: await this.extractCodeContext(context),
      developerState: await this.assessDeveloperState(),
      systemState: await this.getSystemState(),
      environmentFactors: await this.gatherEnvironmentFactors()
    };
  }

  protected async validateInsights(
    insights: Insight[], 
    context: ObservationContext
  ): Promise<Insight[]> {
    // Apply ethical validation to insights
    const validatedInsights: Insight[] = [];
    
    for (const insight of insights) {
      const whisper = await this.generateBaseWhisper(insight);
      const isValid = await this.validateThroughEthicalGateway(whisper, context);
      
      if (isValid) {
        validatedInsights.push(insight);
      }
    }
    
    return validatedInsights;
  }

  protected async deliverWhisper(
    whisper: WhisperSuggestion, 
    context: ObservationContext
  ): Promise<void> {
    // Deliver whisper through appropriate platform channel
    switch (this.platform) {
      case PlatformType.WEB:
        await this.deliverWebWhisper(whisper, context);
        break;
      case PlatformType.DESKTOP:
        await this.deliverDesktopWhisper(whisper, context);
        break;
      case PlatformType.HYBRID:
        await this.deliverHybridWhisper(whisper, context);
        break;
    }
  }

  protected formatWhisperForPlatform(
    baseWhisper: WhisperSuggestion, 
    platform: PlatformType
  ): WhisperSuggestion {
    // Apply platform-specific formatting
    const platformWhisper = { ...baseWhisper };
    
    switch (platform) {
      case PlatformType.WEB:
        platformWhisper.renderLocation = this.getWebRenderLocation(baseWhisper);
        platformWhisper.timing = this.getWebTiming(baseWhisper);
        break;
      case PlatformType.DESKTOP:
        platformWhisper.renderLocation = this.getDesktopRenderLocation(baseWhisper);
        platformWhisper.timing = this.getDesktopTiming(baseWhisper);
        break;
      case PlatformType.HYBRID:
        // Use the most appropriate platform-specific formatting
        const preferredPlatform = this.getPreferredPlatformForWhisper(baseWhisper);
        return this.formatWhisperForPlatform(baseWhisper, preferredPlatform);
    }
    
    platformWhisper.metadata.platform = platform;
    return platformWhisper;
  }

  // Performance and metrics methods
  protected initializePerformanceMetrics(): PerformanceMetrics {
    return {
      analysisSpeed: 0,
      accuracy: 0,
      userSatisfaction: 0,
      resourceUsage: {
        cpuUsage: 0,
        memoryUsage: 0,
        networkUsage: 0,
        storageUsage: 0
      },
      improvementRate: 0
    };
  }

  protected updatePerformanceMetrics(duration: number, success: boolean): void {
    // Update analysis speed (moving average)
    this.performanceMetrics.analysisSpeed = 
      (this.performanceMetrics.analysisSpeed * 0.9) + (duration * 0.1);
    
    // Update accuracy based on success
    if (success) {
      this.performanceMetrics.accuracy = 
        Math.min(1.0, this.performanceMetrics.accuracy + 0.01);
    } else {
      this.performanceMetrics.accuracy = 
        Math.max(0.0, this.performanceMetrics.accuracy - 0.05);
    }
  }

  protected calculateOverallConfidence(): number {
    // Calculate confidence based on performance metrics and learning data
    const baseConfidence = this.performanceMetrics.accuracy;
    const platformLearning = this.learningData.get(this.platform);
    
    if (!platformLearning) {
      return baseConfidence * 0.5; // Lower confidence without learning data
    }
    
    const learningBonus = platformLearning.patterns.length * 0.01;
    return Math.min(1.0, baseConfidence + learningBonus);
  }

  // Learning and adaptation methods
  protected createEmptyLearningData(platform: PlatformType): LearningData {
    return {
      platform,
      patterns: [],
      preferences: [],
      adaptations: [],
      performance: this.performanceMetrics
    };
  }

  protected processFeedback(feedback: DeveloperFeedback, learningData: LearningData): void {
    // Process feedback to improve future suggestions
    switch (feedback.action) {
      case FeedbackAction.ACCEPTED:
        this.reinforcePositivePattern(feedback, learningData);
        break;
      case FeedbackAction.DISMISSED:
        this.adjustNegativePattern(feedback, learningData);
        break;
      case FeedbackAction.MODIFIED:
        this.learnFromModification(feedback, learningData);
        break;
      case FeedbackAction.REQUESTED_MORE:
        this.increaseDetailLevel(feedback, learningData);
        break;
    }
  }

  protected adjustObserverSensitivity(feedback: DeveloperFeedback, platform: PlatformType): void {
    // Adjust observer sensitivity based on feedback
    const currentSensitivity = this.observerContext.configuration.sensitivity;
    
    switch (feedback.action) {
      case FeedbackAction.DISMISSED:
        // Reduce sensitivity if suggestions are being dismissed
        if (currentSensitivity === SensitivityLevel.HIGH) {
          this.observerContext.configuration.sensitivity = SensitivityLevel.MEDIUM;
        } else if (currentSensitivity === SensitivityLevel.MEDIUM) {
          this.observerContext.configuration.sensitivity = SensitivityLevel.LOW;
        }
        break;
      case FeedbackAction.REQUESTED_MORE:
        // Increase sensitivity if more suggestions are requested
        if (currentSensitivity === SensitivityLevel.LOW) {
          this.observerContext.configuration.sensitivity = SensitivityLevel.MEDIUM;
        } else if (currentSensitivity === SensitivityLevel.MEDIUM) {
          this.observerContext.configuration.sensitivity = SensitivityLevel.HIGH;
        }
        break;
    }
  }

  // Abstract helper methods that concrete observers may override
  protected abstract extractCodeContext(context: T): Promise<any>;
  protected abstract assessDeveloperState(): Promise<any>;
  protected abstract getSystemState(): Promise<any>;
  protected abstract gatherEnvironmentFactors(): Promise<any[]>;
  protected abstract validateThroughEthicalGateway(
    whisper: WhisperSuggestion, 
    context: ObservationContext
  ): Promise<boolean>;

  // Platform-specific helper methods (with default implementations)
  protected async initializeWebWorker(): Promise<void> {
    // Default web worker initialization
  }

  protected async cleanupWebWorker(): Promise<void> {
    // Default web worker cleanup
  }

  protected async initializeChildProcess(): Promise<void> {
    // Default child process initialization
  }

  protected async cleanupChildProcess(): Promise<void> {
    // Default child process cleanup
  }

  protected async getWebResources(): Promise<any> {
    return {
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      timing: performance.now()
    };
  }

  protected async getDesktopResources(): Promise<any> {
    return {
      memory: process.memoryUsage?.() || { heapUsed: 0 },
      cpu: process.cpuUsage?.() || { user: 0, system: 0 }
    };
  }

  protected isEnvironmentReady(platform: PlatformType): boolean {
    return this.observerContext.environment.type !== undefined;
  }

  protected areResourcesAvailable(): boolean {
    const resources = this.observerContext.environment.resources;
    return resources.memory > 0 && resources.cpu > 0;
  }

  protected hasRecentActivity(): boolean {
    if (!this.lastObservation) {
      return true; // First observation
    }
    
    const timeSinceLastObservation = Date.now() - this.lastObservation.getTime();
    return timeSinceLastObservation < 300000; // 5 minutes
  }

  protected getWebRenderLocation(whisper: WhisperSuggestion): RenderLocation {
    // Default web render location
    return RenderLocation.MONACO_WIDGET;
  }

  protected getDesktopRenderLocation(whisper: WhisperSuggestion): RenderLocation {
    // Default desktop render location
    return RenderLocation.NOTIFICATION;
  }

  protected getWebTiming(whisper: WhisperSuggestion): WhisperTiming {
    // Default web timing
    return WhisperTiming.NEXT_PAUSE;
  }

  protected getDesktopTiming(whisper: WhisperSuggestion): WhisperTiming {
    // Default desktop timing
    return WhisperTiming.WHEN_CURIOUS;
  }

  protected getPreferredPlatformForWhisper(whisper: WhisperSuggestion): PlatformType {
    // Default to web for hybrid scenarios
    return PlatformType.WEB;
  }

  protected async deliverWebWhisper(whisper: WhisperSuggestion, context: ObservationContext): Promise<void> {
    // Default web whisper delivery
    console.log(`🌙 Web whisper: ${whisper.message}`);
  }

  protected async deliverDesktopWhisper(whisper: WhisperSuggestion, context: ObservationContext): Promise<void> {
    // Default desktop whisper delivery
    console.log(`🌙 Desktop whisper: ${whisper.message}`);
  }

  protected async deliverHybridWhisper(whisper: WhisperSuggestion, context: ObservationContext): Promise<void> {
    // Default hybrid whisper delivery
    await this.deliverWebWhisper(whisper, context);
    await this.deliverDesktopWhisper(whisper, context);
  }

  protected async applyOptimizations(optimizations: PlatformOptimization): Promise<void> {
    // Apply platform-specific optimizations
    console.log(`Applying optimizations for ${this.platform}:`, optimizations);
  }

  // Learning helper methods (with default implementations)
  protected reinforcePositivePattern(feedback: DeveloperFeedback, learningData: LearningData): void {
    // Reinforce patterns that led to accepted suggestions
  }

  protected adjustNegativePattern(feedback: DeveloperFeedback, learningData: LearningData): void {
    // Adjust patterns that led to dismissed suggestions
  }

  protected learnFromModification(feedback: DeveloperFeedback, learningData: LearningData): void {
    // Learn from how the developer modified the suggestion
  }

  protected increaseDetailLevel(feedback: DeveloperFeedback, learningData: LearningData): void {
    // Increase detail level for future suggestions
  }
}

// Platform optimization interface
export interface PlatformOptimization {
  configuration: any;
  resourceAllocation: any;
  performanceTuning: any;
  environmentSettings: any;
}