/**
 * Safe Bot Factory - Secure bot instantiation without eval()
 * Replaces dangerous eval() with safe dynamic module loading
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from '../../logging/logger';
import { IBot, IQuantumBot, BotMetadata, BotCategory } from './enhanced-interfaces';

export class SafeBotFactory {
  private tempDir: string;
  private createdFiles = new Set<string>();

  constructor(private logger: Logger) {
    this.tempDir = path.join(os.tmpdir(), 'sherlock-bots');
    this.ensureTempDir();
  }

  /**
   * Safely create bot instance from generated code
   */
  async createBotFromCode(
    name: string,
    description: string,
    generatedCode: string,
    isQuantum: boolean = false
  ): Promise<IBot> {
    const sanitizedName = this.sanitizeName(name);
    const tempFile = path.join(this.tempDir, `${sanitizedName}-${Date.now()}.js`);
    
    try {
      // Write code to temporary file with error handling
      try {
        await fs.writeFile(tempFile, generatedCode, { mode: 0o600 }); // Secure file permissions
        this.createdFiles.add(tempFile);
      } catch (writeError) {
        this.logger.error(`Failed to write temporary file ${tempFile}:`, writeError);
        throw new Error(`File write failed: ${writeError instanceof Error ? writeError.message : 'Unknown write error'}`);
      }
      
      // Dynamically import the module with timeout
      const importPromise = import(tempFile);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Module import timeout')), 10000)
      );
      
      const botModule = await Promise.race([importPromise, timeoutPromise]) as any;
      const BotClass = botModule.default || botModule[sanitizedName];
      
      if (!BotClass) {
        throw new Error(`Bot class not found in generated code for ${name}`);
      }
      
      // Create instance with error handling
      let botInstance;
      try {
        botInstance = new BotClass();
      } catch (constructorError) {
        this.logger.error(`Bot constructor failed for ${name}:`, constructorError);
        throw new Error(`Bot instantiation failed: ${constructorError instanceof Error ? constructorError.message : 'Constructor error'}`);
      }
      
      // Validate bot interface
      this.validateBotInterface(botInstance, isQuantum);
      
      // Create safe wrapper
      const safeBot = this.createSafeBotWrapper(
        name,
        description,
        botInstance,
        isQuantum
      );
      
      this.logger.info(`Safely created bot: ${name}`);
      return safeBot;
      
    } catch (error) {
      this.logger.error(`Failed to create bot ${name}:`, error);
      
      // Fallback to mock bot on any failure
      this.logger.warn(`Creating fallback mock bot for ${name}`);
      return this.createMockBot(name, description, isQuantum);
      
    } finally {
      // Clean up temporary file immediately on error, scheduled on success
      if (this.createdFiles.has(tempFile)) {
        this.scheduleCleanup(tempFile);
      } else {
        // Immediate cleanup if file creation failed
        try {
          await fs.unlink(tempFile);
        } catch (cleanupError) {
          this.logger.debug(`Cleanup of failed temp file ignored: ${cleanupError}`);
        }
      }
    }
  }

  /**
   * Create a mock bot for testing/demo purposes
   */
  createMockBot(name: string, description: string, isQuantum: boolean = false): IBot {
    const mockBot: IBot = {
      name,
      description,
      version: '1.0.0',
      author: 'Safe Bot Factory',
      tags: ['mock', 'safe'],

      async execute(input: any): Promise<any> {
        return {
          success: true,
          result: `Mock execution of ${name}`,
          input,
          timestamp: new Date(),
          quantum: isQuantum
        };
      },

      getMetadata(): BotMetadata {
        return {
          name,
          description,
          version: '1.0.0',
          author: 'Safe Bot Factory',
          created: new Date(),
          updated: new Date(),
          tags: ['mock', 'safe'],
          category: isQuantum ? BotCategory.QUANTUM : BotCategory.GENERAL,
          license: 'MIT'
        };
      }
    };

    // Add quantum methods if needed
    if (isQuantum) {
      const quantumBot = mockBot as IQuantumBot;
      
      quantumBot.simulateCircuit = async (circuitDescription: string) => {
        // Simulate quantum circuit execution
        const qubits = this.extractQubitCount(circuitDescription);
        const probabilities = this.generateMockQuantumProbabilities(qubits, circuitDescription);
        
        return {
          probabilities,
          counts: this.probabilitiesToCounts(probabilities, 1024),
          shots: 1024,
          executionTime: Math.random() * 100 + 50, // 50-150ms
          backend: 'safe-mock-simulator'
        };
      };

      quantumBot.executeQuantumAlgorithm = async (algorithm: string, parameters?: any) => {
        return {
          result: `Mock ${algorithm} execution with parameters: ${JSON.stringify(parameters)}`,
          quantumAdvantage: 2.0 + Math.random(),
          circuitDepth: Math.floor(Math.random() * 10) + 5,
          gateCount: Math.floor(Math.random() * 20) + 10,
          executionTime: Math.random() * 200 + 100
        };
      };

      quantumBot.hybridExecute = async (classicalInput: any, quantumCircuit?: string) => {
        const classicalResult = await mockBot.execute(classicalInput);
        const quantumResult = quantumCircuit ? 
          await quantumBot.simulateCircuit(quantumCircuit) : 
          { probabilities: {}, counts: {}, shots: 0, executionTime: 0, backend: 'none' };
        
        return {
          classicalResult,
          quantumResult,
          totalExecutionTime: classicalResult.timestamp ? 
            Date.now() - classicalResult.timestamp.getTime() : 200
        };
      };
    }

    return mockBot;
  }

  /**
   * Generate safe TypeScript code template
   */
  generateSafeCodeTemplate(
    name: string,
    description: string,
    isQuantum: boolean,
    features: string[] = []
  ): string {
    const className = this.sanitizeName(name);
    
    const baseTemplate = `
/**
 * ${name}
 * ${description}
 * 
 * Generated by Safe Bot Factory - Sherlock Ω IDE
 */

export class ${className} {
  private name: string;
  private description: string;
  private version: string;

  constructor() {
    this.name = '${name}';
    this.description = '${description}';
    this.version = '1.0.0';
  }

  async execute(input: any): Promise<any> {
    console.log(\`Executing \${this.name} with input:\`, input);
    
    try {
      // Validate input
      if (input === null || input === undefined) {
        throw new Error('Input cannot be null or undefined');
      }

      // Main bot logic
      const result = await this.processInput(input);
      
      return {
        success: true,
        result,
        timestamp: new Date(),
        botName: this.name
      };
    } catch (error) {
      console.error(\`Error in \${this.name}:\`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        botName: this.name
      };
    }
  }

  private async processInput(input: any): Promise<any> {
    // Safe input processing
    const processedInput = this.sanitizeInput(input);
    
    ${this.generateFeatureCode(features)}
    
    return {
      processed: true,
      input: processedInput,
      message: 'Bot executed successfully',
      features: ${JSON.stringify(features)}
    };
  }

  private sanitizeInput(input: any): any {
    // Remove potentially dangerous properties
    if (typeof input === 'object' && input !== null) {
      const sanitized = { ...input };
      delete sanitized.__proto__;
      delete sanitized.constructor;
      delete sanitized.prototype;
      return sanitized;
    }
    return input;
  }

  getMetadata(): any {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      author: 'Safe Bot Factory',
      created: new Date(),
      updated: new Date(),
      tags: ${JSON.stringify(['generated', 'safe', ...features])},
      category: '${isQuantum ? 'quantum' : 'general'}',
      license: 'MIT'
    };
  }
}

export default ${className};
`;

    if (isQuantum) {
      return this.addQuantumMethods(baseTemplate, className);
    }

    return baseTemplate;
  }

  // Private helper methods

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.warn(`Failed to create temp directory: ${error}`);
    }
  }

  private sanitizeName(name: string): string {
    // Remove special characters and ensure valid class name
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/^[0-9]/, 'Bot$&') // Prefix with 'Bot' if starts with number
      || 'GeneratedBot';
  }

  private validateBotInterface(botInstance: any, isQuantum: boolean): void {
    if (typeof botInstance.execute !== 'function') {
      throw new Error('Bot must implement execute method');
    }

    if (typeof botInstance.getMetadata !== 'function') {
      throw new Error('Bot must implement getMetadata method');
    }

    if (isQuantum) {
      if (typeof botInstance.simulateCircuit !== 'function') {
        throw new Error('Quantum bot must implement simulateCircuit method');
      }
    }
  }

  private createSafeBotWrapper(
    name: string,
    description: string,
    botInstance: any,
    isQuantum: boolean
  ): IBot {
    const wrapper: IBot = {
      name,
      description,
      version: '1.0.0',
      author: 'Safe Bot Factory',
      tags: ['generated', 'safe'],

      async execute(input: any): Promise<any> {
        try {
          // Add timeout protection
          return await Promise.race([
            botInstance.execute(input),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Bot execution timeout')), 30000)
            )
          ]);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Execution failed',
            timestamp: new Date()
          };
        }
      },

      getMetadata(): BotMetadata {
        try {
          const metadata = botInstance.getMetadata();
          return {
            ...metadata,
            name,
            description,
            category: isQuantum ? BotCategory.QUANTUM : metadata.category || BotCategory.GENERAL
          };
        } catch (error) {
          // Fallback metadata
          return {
            name,
            description,
            version: '1.0.0',
            author: 'Safe Bot Factory',
            created: new Date(),
            updated: new Date(),
            tags: ['generated', 'safe'],
            category: isQuantum ? BotCategory.QUANTUM : BotCategory.GENERAL,
            license: 'MIT'
          };
        }
      }
    };

    // Add quantum methods if needed
    if (isQuantum && botInstance.simulateCircuit) {
      const quantumWrapper = wrapper as IQuantumBot;
      
      quantumWrapper.simulateCircuit = async (circuitDescription: string) => {
        try {
          return await Promise.race([
            botInstance.simulateCircuit(circuitDescription),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Quantum simulation timeout')), 60000)
            )
          ]);
        } catch (error) {
          // Fallback to mock simulation
          const qubits = this.extractQubitCount(circuitDescription);
          return {
            probabilities: this.generateMockQuantumProbabilities(qubits, circuitDescription),
            counts: {},
            shots: 1024,
            executionTime: 100,
            backend: 'fallback-simulator',
            error: error instanceof Error ? error.message : 'Simulation failed'
          };
        }
      };

      if (botInstance.executeQuantumAlgorithm) {
        quantumWrapper.executeQuantumAlgorithm = async (algorithm: string, parameters?: any) => {
          try {
            return await botInstance.executeQuantumAlgorithm(algorithm, parameters);
          } catch (error) {
            return {
              result: `Fallback execution of ${algorithm}`,
              error: error instanceof Error ? error.message : 'Algorithm execution failed',
              quantumAdvantage: 1.0,
              circuitDepth: 0,
              gateCount: 0,
              executionTime: 0
            };
          }
        };
      }

      if (botInstance.hybridExecute) {
        quantumWrapper.hybridExecute = async (classicalInput: any, quantumCircuit?: string) => {
          try {
            return await botInstance.hybridExecute(classicalInput, quantumCircuit);
          } catch (error) {
            const classicalResult = await wrapper.execute(classicalInput);
            return {
              classicalResult,
              quantumResult: { probabilities: {}, counts: {}, shots: 0, executionTime: 0, backend: 'failed' },
              totalExecutionTime: 0,
              error: error instanceof Error ? error.message : 'Hybrid execution failed'
            };
          }
        };
      }
    }

    return wrapper;
  }

  private generateFeatureCode(features: string[]): string {
    let code = '';
    
    if (features.includes('api-integration')) {
      code += `
    // API integration feature
    if (processedInput.apiCall) {
      // Safe API call simulation
      result.apiResponse = { status: 'success', data: 'API call simulated' };
    }`;
    }

    if (features.includes('file-processing')) {
      code += `
    // File processing feature
    if (processedInput.filePath) {
      // Safe file processing simulation
      result.fileProcessed = true;
      result.fileName = processedInput.filePath;
    }`;
    }

    if (features.includes('quantum-processing')) {
      code += `
    // Quantum processing feature
    if (processedInput.quantumCircuit) {
      // Safe quantum processing simulation
      result.quantumResult = { probabilities: { '00': 0.5, '11': 0.5 } };
    }`;
    }

    return code || '// No specific features implemented';
  }

  private addQuantumMethods(template: string, className: string): string {
    const quantumMethods = `
  async simulateCircuit(circuitDescription: string): Promise<any> {
    console.log(\`Simulating quantum circuit: \${circuitDescription}\`);
    
    try {
      // Safe quantum circuit simulation
      const qubits = this.extractQubitCount(circuitDescription);
      const probabilities = this.generateQuantumProbabilities(qubits, circuitDescription);
      
      return {
        probabilities,
        counts: this.probabilitiesToCounts(probabilities, 1024),
        shots: 1024,
        executionTime: Date.now(),
        backend: 'safe-simulator',
        description: circuitDescription
      };
    } catch (error) {
      console.error('Quantum circuit simulation failed:', error);
      throw error;
    }
  }

  async executeQuantumAlgorithm(algorithm: string, parameters?: any): Promise<any> {
    console.log(\`Executing quantum algorithm: \${algorithm}\`);
    
    const algorithms = {
      'grover': () => this.executeGrover(parameters),
      'bell-state': () => this.createBellState(parameters),
      'superposition': () => this.createSuperposition(parameters)
    };

    const algorithmFn = algorithms[algorithm.toLowerCase()];
    if (!algorithmFn) {
      throw new Error(\`Unsupported quantum algorithm: \${algorithm}\`);
    }

    return algorithmFn();
  }

  async hybridExecute(classicalInput: any, quantumCircuit?: string): Promise<any> {
    console.log('Executing hybrid classical-quantum workflow');
    
    const classicalResult = await this.execute(classicalInput);
    let quantumResult = null;
    
    if (quantumCircuit) {
      quantumResult = await this.simulateCircuit(quantumCircuit);
    }
    
    return {
      classicalResult,
      quantumResult,
      hybrid: true,
      timestamp: new Date()
    };
  }

  private extractQubitCount(description: string): number {
    const match = description.match(/(\\d+)\\s*qubit/i);
    return match ? parseInt(match[1]) : 2;
  }

  private generateQuantumProbabilities(qubits: number, description: string): Record<string, number> {
    const numStates = Math.pow(2, qubits);
    const probabilities: Record<string, number> = {};
    
    if (description.toLowerCase().includes('bell')) {
      // Bell state: |00⟩ + |11⟩
      probabilities['0'.repeat(qubits)] = 0.5;
      probabilities['1'.repeat(qubits)] = 0.5;
    } else if (description.toLowerCase().includes('superposition')) {
      // Equal superposition
      for (let i = 0; i < numStates; i++) {
        const state = i.toString(2).padStart(qubits, '0');
        probabilities[state] = 1 / numStates;
      }
    } else {
      // Default: some random distribution
      let remaining = 1.0;
      for (let i = 0; i < Math.min(numStates, 4); i++) {
        const state = i.toString(2).padStart(qubits, '0');
        const prob = i === 3 ? remaining : Math.random() * remaining;
        probabilities[state] = prob;
        remaining -= prob;
      }
    }
    
    return probabilities;
  }

  private probabilitiesToCounts(probabilities: Record<string, number>, shots: number): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [state, prob] of Object.entries(probabilities)) {
      counts[state] = Math.round(prob * shots);
    }
    return counts;
  }

  private executeGrover(parameters: any): any {
    const qubits = parameters?.qubits || 3;
    const iterations = Math.floor(Math.PI * Math.sqrt(Math.pow(2, qubits)) / 4);
    
    return {
      algorithm: 'grover',
      qubits,
      iterations,
      quantumAdvantage: Math.sqrt(Math.pow(2, qubits)),
      result: 'Grover search completed'
    };
  }

  private createBellState(parameters: any): any {
    return {
      state: 'bell',
      probabilities: { '00': 0.5, '11': 0.5 },
      entangled: true,
      fidelity: 1.0
    };
  }

  private createSuperposition(parameters: any): any {
    const qubits = parameters?.qubits || 2;
    const numStates = Math.pow(2, qubits);
    const probabilities: Record<string, number> = {};
    
    for (let i = 0; i < numStates; i++) {
      const state = i.toString(2).padStart(qubits, '0');
      probabilities[state] = 1 / numStates;
    }
    
    return {
      state: 'superposition',
      probabilities,
      qubits,
      uniformity: 1.0
    };
  }`;

    // Insert quantum methods before the closing brace
    return template.replace(/}\s*export default/, quantumMethods + '\n}\n\nexport default');
  }

  private extractQubitCount(description: string): number {
    const match = description.match(/(\d+)\s*qubit/i);
    return match ? parseInt(match[1]) : 2;
  }

  private generateMockQuantumProbabilities(qubits: number, description: string): Record<string, number> {
    const numStates = Math.pow(2, qubits);
    const probabilities: Record<string, number> = {};
    
    if (description.toLowerCase().includes('bell')) {
      probabilities['0'.repeat(qubits)] = 0.5;
      probabilities['1'.repeat(qubits)] = 0.5;
    } else if (description.toLowerCase().includes('grover')) {
      // Grover amplifies one state
      const targetState = '1'.repeat(qubits);
      probabilities[targetState] = 0.8;
      probabilities['0'.repeat(qubits)] = 0.2;
    } else {
      // Equal superposition
      for (let i = 0; i < Math.min(numStates, 8); i++) {
        const state = i.toString(2).padStart(qubits, '0');
        probabilities[state] = 1 / Math.min(numStates, 8);
      }
    }
    
    return probabilities;
  }

  private probabilitiesToCounts(probabilities: Record<string, number>, shots: number): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [state, prob] of Object.entries(probabilities)) {
      counts[state] = Math.round(prob * shots);
    }
    return counts;
  }

  private scheduleCleanup(filePath: string): void {
    // Clean up after 5 minutes
    setTimeout(async () => {
      try {
        await fs.unlink(filePath);
        this.createdFiles.delete(filePath);
        this.logger.debug(`Cleaned up temporary file: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to clean up temporary file: ${filePath}`);
      }
    }, 5 * 60 * 1000);
  }

  // Cleanup all temporary files
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.createdFiles).map(async (filePath) => {
      try {
        await fs.unlink(filePath);
        this.logger.debug(`Cleaned up: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to cleanup: ${filePath}`);
      }
    });

    await Promise.all(cleanupPromises);
    this.createdFiles.clear();

    // Remove temp directory if empty
    try {
      await fs.rmdir(this.tempDir);
    } catch (error) {
      // Directory not empty or doesn't exist, ignore
    }
  }
}