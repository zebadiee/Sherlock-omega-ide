import { EventEmitter } from 'events';
import { Observable, Subject } from 'rxjs';
import { AIBotRegistry, BotMetadata, BotCapability } from './ai-bot-registry';

export interface BotDescription {
  rawDescription: string;
  parsedIntent: {
    purpose: string;
    domain: string;
    inputTypes: string[];
    outputTypes: string[];
    complexity: 'low' | 'medium' | 'high';
    capabilities: string[];
    requirements: string[];
  };
  confidence: number;
}

export interface BuilderSuggestion {
  type: 'capability' | 'configuration' | 'example' | 'improvement';
  title: string;
  description: string;
  code?: string;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface BuildStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  suggestions: BuilderSuggestion[];
  generatedCode?: string;
  userFeedback?: string;
}

export interface BotBuildSession {
  id: string;
  userId: string;
  description: BotDescription;
  steps: BuildStep[];
  currentStep: number;
  status: 'planning' | 'building' | 'testing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  generatedBot?: Partial<BotMetadata>;
}

/**
 * DescriptiveBotBuilder - Natural language to bot implementation with guided assistance
 */
export class DescriptiveBotBuilder extends EventEmitter {
  private registry: AIBotRegistry;
  private activeSessions = new Map<string, BotBuildSession>();
  private sessionSubject = new Subject<BotBuildSession>();

  // Knowledge base for bot building
  private readonly CAPABILITY_PATTERNS = {
    'code-generation': [
      /generat\w* code/i, /creat\w* function/i, /build\w* class/i, /implement/i,
      /scaffold/i, /boilerplate/i, /template/i, /stub/i
    ],
    'testing': [
      /test/i, /unit test/i, /integration test/i, /coverage/i, /assertion/i,
      /mock/i, /spec/i, /validate/i, /verify/i
    ],
    'debugging': [
      /debug/i, /fix/i, /error/i, /bug/i, /troubleshoot/i, /diagnose/i,
      /trace/i, /inspect/i, /analyze error/i
    ],
    'documentation': [
      /document/i, /readme/i, /comment/i, /explain/i, /describe/i,
      /api doc/i, /guide/i, /tutorial/i, /help/i
    ],
    'analysis': [
      /analyz\w*/i, /review/i, /audit/i, /inspect/i, /examine/i,
      /quality/i, /metrics/i, /performance/i, /security/i
    ],
    'deployment': [
      /deploy/i, /release/i, /publish/i, /build/i, /package/i,
      /docker/i, /kubernetes/i, /ci\/cd/i, /pipeline/i
    ],
    'monitoring': [
      /monitor/i, /track/i, /observe/i, /alert/i, /log/i,
      /metric/i, /health/i, /status/i, /uptime/i
    ]
  };

  private readonly COMPLEXITY_INDICATORS = {
    low: [
      /simple/i, /basic/i, /easy/i, /quick/i, /minimal/i,
      /straightforward/i, /single/i, /one/i
    ],
    medium: [
      /moderate/i, /standard/i, /typical/i, /regular/i, /normal/i,
      /multiple/i, /several/i, /few/i
    ],
    high: [
      /complex/i, /advanced/i, /sophisticated/i, /comprehensive/i,
      /enterprise/i, /scalable/i, /robust/i, /many/i, /extensive/i
    ]
  };

  private readonly BUILD_STEPS_TEMPLATE = [
    {
      id: 'analysis',
      title: 'Requirement Analysis',
      description: 'Analyze the description and identify key requirements'
    },
    {
      id: 'architecture',
      title: 'Bot Architecture Design',
      description: 'Design the bot structure and capabilities'
    },
    {
      id: 'capabilities',
      title: 'Capability Implementation',
      description: 'Implement core bot capabilities'
    },
    {
      id: 'configuration',
      title: 'Configuration Setup',
      description: 'Set up bot configuration and parameters'
    },
    {
      id: 'testing',
      title: 'Testing & Validation',
      description: 'Create tests and validate bot functionality'
    },
    {
      id: 'documentation',
      title: 'Documentation Generation',
      description: 'Generate comprehensive documentation'
    },
    {
      id: 'deployment',
      title: 'Deployment Preparation',
      description: 'Prepare bot for deployment and registration'
    }
  ];

  constructor(registry: AIBotRegistry) {
    this.registry = registry;
  }

  /**
   * Start a new bot building session from natural language description
   */
  async startBuildSession(userId: string, rawDescription: string): Promise<BotBuildSession> {
    const sessionId = `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse the description
    const description = await this.parseDescription(rawDescription);
    
    // Create build steps
    const steps = this.BUILD_STEPS_TEMPLATE.map(template => ({
      ...template,
      status: 'pending' as const,
      suggestions: []
    }));

    const session: BotBuildSession = {
      id: sessionId,
      userId,
      description,
      steps,
      currentStep: 0,
      status: 'planning',
      startTime: new Date()
    };

    this.activeSessions.set(sessionId, session);
    
    // Start the building process
    await this.processCurrentStep(session);
    
    this.sessionSubject.next(session);
    this.emit('session-started', session);
    
    console.log(`🏗️ Bot build session started: ${sessionId}`);
    return session;
  }

  /**
   * Continue to the next step in the build process
   */
  async nextStep(sessionId: string, userFeedback?: string): Promise<BotBuildSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Build session not found: ${sessionId}`);
    }

    // Record user feedback for current step
    if (userFeedback && session.currentStep < session.steps.length) {
      session.steps[session.currentStep].userFeedback = userFeedback;
    }

    // Mark current step as completed
    if (session.currentStep < session.steps.length) {
      session.steps[session.currentStep].status = 'completed';
    }

    // Move to next step
    session.currentStep++;
    
    if (session.currentStep >= session.steps.length) {
      // All steps completed
      session.status = 'completed';
      session.endTime = new Date();
      
      // Generate final bot
      await this.generateFinalBot(session);
    } else {
      // Process next step
      await this.processCurrentStep(session);
    }

    this.sessionSubject.next(session);
    this.emit('session-updated', session);
    
    return session;
  }

  /**
   * Get suggestions for improving the bot based on current progress
   */
  async getSuggestions(sessionId: string): Promise<BuilderSuggestion[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Build session not found: ${sessionId}`);
    }

    const suggestions: BuilderSuggestion[] = [];

    // Analyze similar bots in registry
    const similarBots = await this.findSimilarBots(session.description);
    
    for (const bot of similarBots.slice(0, 3)) {
      suggestions.push({
        type: 'improvement',
        title: `Learn from "${bot.name}"`,
        description: `This bot has similar capabilities and ${bot.usage.successfulInvocations} successful uses`,
        priority: 'medium',
        reasoning: `Similar bots can provide insights for better implementation`
      });
    }

    // Suggest missing capabilities
    const missingCapabilities = this.identifyMissingCapabilities(session.description);
    for (const capability of missingCapabilities) {
      suggestions.push({
        type: 'capability',
        title: `Add ${capability} capability`,
        description: `Based on your description, this capability might be useful`,
        priority: 'low',
        reasoning: `Enhances bot functionality for the described use case`
      });
    }

    // Configuration suggestions
    if (session.description.parsedIntent.complexity === 'high') {
      suggestions.push({
        type: 'configuration',
        title: 'Increase timeout and retries',
        description: 'Complex bots may need more time and retry attempts',
        priority: 'medium',
        reasoning: 'High complexity tasks often require more resources'
      });
    }

    return suggestions;
  }

  /**
   * Generate code for a specific capability
   */
  async generateCapabilityCode(
    sessionId: string, 
    capabilityType: string, 
    requirements: string[]
  ): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Build session not found: ${sessionId}`);
    }

    // Generate code based on capability type
    switch (capabilityType) {
      case 'code-generation':
        return this.generateCodeGenerationCapability(requirements);
      case 'testing':
        return this.generateTestingCapability(requirements);
      case 'debugging':
        return this.generateDebuggingCapability(requirements);
      case 'documentation':
        return this.generateDocumentationCapability(requirements);
      case 'analysis':
        return this.generateAnalysisCapability(requirements);
      default:
        return this.generateGenericCapability(capabilityType, requirements);
    }
  }

  /**
   * Get active build session
   */
  getBuildSession(sessionId: string): BotBuildSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): BotBuildSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }

  /**
   * Cancel a build session
   */
  cancelBuildSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'failed';
    session.endTime = new Date();
    
    this.activeSessions.delete(sessionId);
    this.emit('session-cancelled', sessionId);
    
    return true;
  }

  // Observable for session updates
  getSessions$(): Observable<BotBuildSession> {
    return this.sessionSubject.asObservable();
  }

  // Private methods

  private async parseDescription(rawDescription: string): Promise<BotDescription> {
    const description = rawDescription.toLowerCase();
    
    // Extract purpose and domain
    const purpose = this.extractPurpose(description);
    const domain = this.extractDomain(description);
    
    // Identify capabilities
    const capabilities: string[] = [];
    for (const [capability, patterns] of Object.entries(this.CAPABILITY_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(description))) {
        capabilities.push(capability);
      }
    }

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    for (const [level, patterns] of Object.entries(this.COMPLEXITY_INDICATORS)) {
      if (patterns.some(pattern => pattern.test(description))) {
        complexity = level as 'low' | 'medium' | 'high';
        break;
      }
    }

    // Extract input/output types
    const inputTypes = this.extractInputTypes(description);
    const outputTypes = this.extractOutputTypes(description);
    
    // Extract requirements
    const requirements = this.extractRequirements(description);

    // Calculate confidence based on how much we could parse
    const confidence = this.calculateParsingConfidence({
      purpose, domain, capabilities, inputTypes, outputTypes, requirements
    });

    return {
      rawDescription,
      parsedIntent: {
        purpose,
        domain,
        inputTypes,
        outputTypes,
        complexity,
        capabilities,
        requirements
      },
      confidence
    };
  }

  private extractPurpose(description: string): string {
    // Simple purpose extraction - in production, use NLP
    const purposeKeywords = [
      'help', 'assist', 'generate', 'create', 'build', 'analyze', 'test',
      'debug', 'document', 'monitor', 'deploy', 'manage'
    ];
    
    for (const keyword of purposeKeywords) {
      if (description.includes(keyword)) {
        return `${keyword} based on user requirements`;
      }
    }
    
    return 'assist users with their development tasks';
  }

  private extractDomain(description: string): string {
    const domains = {
      'web development': ['web', 'html', 'css', 'javascript', 'react', 'vue', 'angular'],
      'backend development': ['api', 'server', 'database', 'backend', 'microservice'],
      'mobile development': ['mobile', 'ios', 'android', 'react native', 'flutter'],
      'devops': ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline'],
      'data science': ['data', 'machine learning', 'ai', 'analytics', 'python'],
      'testing': ['test', 'qa', 'automation', 'selenium', 'jest'],
      'general': []
    };

    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return domain;
      }
    }

    return 'general';
  }

  private extractInputTypes(description: string): string[] {
    const inputTypes: string[] = [];
    
    if (/code|source|file/.test(description)) inputTypes.push('code');
    if (/text|string|message/.test(description)) inputTypes.push('text');
    if (/json|data|object/.test(description)) inputTypes.push('json');
    if (/url|link|endpoint/.test(description)) inputTypes.push('url');
    if (/config|settings|parameters/.test(description)) inputTypes.push('configuration');
    
    return inputTypes.length > 0 ? inputTypes : ['text'];
  }

  private extractOutputTypes(description: string): string[] {
    const outputTypes: string[] = [];
    
    if (/code|function|class/.test(description)) outputTypes.push('code');
    if (/report|summary|analysis/.test(description)) outputTypes.push('report');
    if (/test|spec/.test(description)) outputTypes.push('test');
    if (/documentation|readme|guide/.test(description)) outputTypes.push('documentation');
    if (/json|data/.test(description)) outputTypes.push('json');
    
    return outputTypes.length > 0 ? outputTypes : ['text'];
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    
    if (/fast|quick|speed/.test(description)) requirements.push('high-performance');
    if (/secure|safety|safe/.test(description)) requirements.push('security');
    if (/scale|large|enterprise/.test(description)) requirements.push('scalability');
    if (/reliable|stable|robust/.test(description)) requirements.push('reliability');
    if (/simple|easy|user-friendly/.test(description)) requirements.push('usability');
    
    return requirements;
  }

  private calculateParsingConfidence(parsed: any): number {
    let score = 0;
    let maxScore = 0;

    // Purpose (20%)
    maxScore += 20;
    if (parsed.purpose && parsed.purpose !== 'assist users with their development tasks') {
      score += 20;
    } else if (parsed.purpose) {
      score += 10;
    }

    // Capabilities (30%)
    maxScore += 30;
    score += Math.min(30, parsed.capabilities.length * 10);

    // Domain (15%)
    maxScore += 15;
    if (parsed.domain && parsed.domain !== 'general') {
      score += 15;
    } else if (parsed.domain) {
      score += 5;
    }

    // Input/Output types (20%)
    maxScore += 20;
    score += Math.min(10, parsed.inputTypes.length * 5);
    score += Math.min(10, parsed.outputTypes.length * 5);

    // Requirements (15%)
    maxScore += 15;
    score += Math.min(15, parsed.requirements.length * 5);

    return score / maxScore;
  }

  private async processCurrentStep(session: BotBuildSession): Promise<void> {
    const currentStep = session.steps[session.currentStep];
    if (!currentStep) return;

    currentStep.status = 'in-progress';
    session.status = 'building';

    // Generate suggestions for current step
    currentStep.suggestions = await this.generateStepSuggestions(session, currentStep);

    // Generate code if applicable
    if (currentStep.id === 'capabilities') {
      currentStep.generatedCode = await this.generateCapabilitiesCode(session);
    } else if (currentStep.id === 'configuration') {
      currentStep.generatedCode = await this.generateConfigurationCode(session);
    } else if (currentStep.id === 'testing') {
      currentStep.generatedCode = await this.generateTestingCode(session);
    }
  }

  private async generateStepSuggestions(
    session: BotBuildSession, 
    step: BuildStep
  ): Promise<BuilderSuggestion[]> {
    const suggestions: BuilderSuggestion[] = [];

    switch (step.id) {
      case 'analysis':
        suggestions.push({
          type: 'improvement',
          title: 'Refine requirements',
          description: 'Consider adding more specific requirements for better bot performance',
          priority: 'medium',
          reasoning: 'Clear requirements lead to better implementation'
        });
        break;

      case 'architecture':
        suggestions.push({
          type: 'capability',
          title: 'Add error handling',
          description: 'Include robust error handling in the bot architecture',
          priority: 'high',
          reasoning: 'Error handling is crucial for bot reliability'
        });
        break;

      case 'capabilities':
        for (const capability of session.description.parsedIntent.capabilities) {
          suggestions.push({
            type: 'capability',
            title: `Implement ${capability}`,
            description: `Add ${capability} capability based on your requirements`,
            priority: 'high',
            reasoning: 'Matches identified requirements from description'
          });
        }
        break;

      case 'testing':
        suggestions.push({
          type: 'example',
          title: 'Add comprehensive tests',
          description: 'Include unit tests, integration tests, and edge case testing',
          priority: 'high',
          reasoning: 'Testing ensures bot reliability and correctness'
        });
        break;
    }

    return suggestions;
  }

  private async findSimilarBots(description: BotDescription): Promise<BotMetadata[]> {
    const searchQuery = {
      query: description.parsedIntent.purpose,
      category: description.parsedIntent.capabilities[0],
      sortBy: 'popularity' as const,
      limit: 5
    };

    const results = this.registry.searchBots(searchQuery);
    return results.bots;
  }

  private identifyMissingCapabilities(description: BotDescription): string[] {
    const allCapabilities = ['code-generation', 'testing', 'debugging', 'documentation', 'analysis', 'deployment', 'monitoring'];
    const currentCapabilities = description.parsedIntent.capabilities;
    
    return allCapabilities.filter(cap => !currentCapabilities.includes(cap));
  }

  private async generateCapabilitiesCode(session: BotBuildSession): Promise<string> {
    const capabilities = session.description.parsedIntent.capabilities;
    
    let code = `// Generated Bot Capabilities\n\n`;
    code += `export class ${this.toPascalCase(session.description.parsedIntent.purpose)}Bot {\n`;
    code += `  private config: any;\n\n`;
    code += `  constructor(config: any) {\n`;
    code += `    this.config = config;\n`;
    code += `  }\n\n`;

    for (const capability of capabilities) {
      code += await this.generateCapabilityCode(session.id, capability, session.description.parsedIntent.requirements);
      code += '\n\n';
    }

    code += `}\n`;
    return code;
  }

  private async generateConfigurationCode(session: BotBuildSession): Promise<string> {
    const complexity = session.description.parsedIntent.complexity;
    
    const config = {
      model: complexity === 'high' ? 'gpt-4' : 'gpt-3.5-turbo',
      temperature: complexity === 'low' ? 0.3 : complexity === 'medium' ? 0.5 : 0.7,
      maxTokens: complexity === 'low' ? 1000 : complexity === 'medium' ? 2000 : 4000,
      timeout: complexity === 'low' ? 30000 : complexity === 'medium' ? 60000 : 120000,
      retries: complexity === 'high' ? 3 : 2
    };

    return `// Generated Bot Configuration\n\nexport const botConfig = ${JSON.stringify(config, null, 2)};`;
  }

  private async generateTestingCode(session: BotBuildSession): Promise<string> {
    const capabilities = session.description.parsedIntent.capabilities;
    
    let code = `// Generated Bot Tests\n\n`;
    code += `import { ${this.toPascalCase(session.description.parsedIntent.purpose)}Bot } from './bot';\n\n`;
    code += `describe('${this.toPascalCase(session.description.parsedIntent.purpose)}Bot', () => {\n`;
    code += `  let bot: ${this.toPascalCase(session.description.parsedIntent.purpose)}Bot;\n\n`;
    code += `  beforeEach(() => {\n`;
    code += `    bot = new ${this.toPascalCase(session.description.parsedIntent.purpose)}Bot({});\n`;
    code += `  });\n\n`;

    for (const capability of capabilities) {
      const methodName = this.toCamelCase(capability);
      code += `  describe('${methodName}', () => {\n`;
      code += `    it('should ${capability.replace('-', ' ')} successfully', async () => {\n`;
      code += `      const result = await bot.${methodName}('test input');\n`;
      code += `      expect(result).toBeDefined();\n`;
      code += `    });\n`;
      code += `  });\n\n`;
    }

    code += `});\n`;
    return code;
  }

  private generateCodeGenerationCapability(requirements: string[]): string {
    return `  async generateCode(prompt: string, language: string = 'typescript'): Promise<string> {
    // Code generation capability
    const context = {
      prompt,
      language,
      requirements: ${JSON.stringify(requirements)}
    };
    
    // Implementation would call AI service
    return 'Generated code based on prompt';
  }`;
  }

  private generateTestingCapability(requirements: string[]): string {
    return `  async generateTests(code: string, framework: string = 'jest'): Promise<string> {
    // Testing capability
    const context = {
      code,
      framework,
      requirements: ${JSON.stringify(requirements)}
    };
    
    // Implementation would generate comprehensive tests
    return 'Generated test suite';
  }`;
  }

  private generateDebuggingCapability(requirements: string[]): string {
    return `  async debugCode(code: string, error: string): Promise<string> {
    // Debugging capability
    const context = {
      code,
      error,
      requirements: ${JSON.stringify(requirements)}
    };
    
    // Implementation would analyze and fix issues
    return 'Debugging analysis and fixes';
  }`;
  }

  private generateDocumentationCapability(requirements: string[]): string {
    return `  async generateDocumentation(code: string, format: string = 'markdown'): Promise<string> {
    // Documentation capability
    const context = {
      code,
      format,
      requirements: ${JSON.stringify(requirements)}
    };
    
    // Implementation would generate comprehensive docs
    return 'Generated documentation';
  }`;
  }

  private generateAnalysisCapability(requirements: string[]): string {
    return `  async analyzeCode(code: string, analysisType: string = 'quality'): Promise<any> {
    // Analysis capability
    const context = {
      code,
      analysisType,
      requirements: ${JSON.stringify(requirements)}
    };
    
    // Implementation would perform code analysis
    return { analysis: 'Code analysis results' };
  }`;
  }

  private generateGenericCapability(capabilityType: string, requirements: string[]): string {
    const methodName = this.toCamelCase(capabilityType);
    return `  async ${methodName}(input: any): Promise<any> {
    // ${capabilityType} capability
    const context = {
      input,
      requirements: ${JSON.stringify(requirements)}
    };
    
    // Implementation for ${capabilityType}
    return 'Result from ${capabilityType}';
  }`;
  }

  private async generateFinalBot(session: BotBuildSession): Promise<void> {
    const description = session.description;
    
    // Create bot metadata
    const botMetadata: Partial<BotMetadata> = {
      name: this.generateBotName(description.parsedIntent.purpose),
      version: '1.0.0',
      description: description.rawDescription,
      author: session.userId,
      tags: [
        description.parsedIntent.domain,
        ...description.parsedIntent.capabilities,
        description.parsedIntent.complexity
      ],
      status: 'development',
      visibility: 'private',
      
      capabilities: description.parsedIntent.capabilities.map(cap => ({
        id: `${cap}-capability`,
        name: this.toTitleCase(cap),
        description: `${this.toTitleCase(cap)} capability for the bot`,
        category: cap as any,
        inputTypes: description.parsedIntent.inputTypes,
        outputTypes: description.parsedIntent.outputTypes,
        dependencies: [],
        complexity: description.parsedIntent.complexity,
        reliability: 0.8, // Initial estimate
        performance: {
          averageResponseTime: 2000,
          successRate: 0.9,
          resourceUsage: description.parsedIntent.complexity === 'high' ? 'high' : 'medium'
        },
        examples: [{
          input: 'Sample input',
          expectedOutput: 'Sample output',
          description: 'Example usage'
        }]
      })),
      
      requirements: {
        memory: description.parsedIntent.complexity === 'high' ? '1GB' : '512MB',
        cpu: description.parsedIntent.complexity === 'high' ? '2 cores' : '1 core',
        storage: '100MB',
        network: true
      },
      
      configuration: {
        model: description.parsedIntent.complexity === 'high' ? 'gpt-4' : 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 60000,
        retries: 2
      },
      
      documentation: {
        readme: `# ${this.generateBotName(description.parsedIntent.purpose)}\n\n${description.rawDescription}`,
        examples: 'See examples in the capabilities section',
        changelog: 'v1.0.0 - Initial version',
        troubleshooting: 'Common issues and solutions'
      }
    };

    session.generatedBot = botMetadata;
  }

  private generateBotName(purpose: string): string {
    const cleaned = purpose.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleaned.split(/\s+/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return words.join(' ') + ' Bot';
  }

  private toPascalCase(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toTitleCase(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}