import { EventEmitter } from 'events';
import { Observable, Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { map, filter, debounceTime, throttleTime } from 'rxjs/operators';

export interface ProcessingTask {
  id: string;
  type: 'code-generation' | 'analysis' | 'testing' | 'documentation' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  context?: any;
  timeout?: number;
  retries?: number;
  createdAt: Date;
  estimatedDuration?: number;
}

export interface ProcessingResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  completedAt: Date;
}

export interface WorkerPool {
  id: string;
  type: string;
  maxConcurrency: number;
  activeWorkers: number;
  queueSize: number;
  averageProcessingTime: number;
}

export interface StreamingResponse {
  taskId: string;
  chunk: string;
  isComplete: boolean;
  metadata?: any;
}

export class AsyncProcessingEngine extends EventEmitter {
  private taskQueue = new Map<string, ProcessingTask[]>();
  private activeTasks = new Map<string, ProcessingTask>();
  private workerPools = new Map<string, WorkerPool>();
  private results = new Map<string, ProcessingResult>();
  
  private taskSubject = new Subject<ProcessingTask>();
  private resultSubject = new Subject<ProcessingResult>();
  private streamingSubject = new Subject<StreamingResponse>();
  
  private isProcessing = false;
  private maxConcurrentTasks = 10;
  private defaultTimeout = 30000; // 30 seconds

  constructor() {
    super();
    this.initializeWorkerPools();
    this.startProcessing();
  }

  // Task Management
  async submitTask(task: Omit<ProcessingTask, 'id' | 'createdAt'>): Promise<string> {
    const fullTask: ProcessingTask = {
      ...task,
      id: this.generateTaskId(),
      createdAt: new Date(),
      timeout: task.timeout || this.defaultTimeout,
      retries: task.retries || 3
    };

    // Add to appropriate queue based on priority
    const queueKey = `${task.type}_${task.priority}`;
    if (!this.taskQueue.has(queueKey)) {
      this.taskQueue.set(queueKey, []);
    }
    
    const queue = this.taskQueue.get(queueKey)!;
    
    // Insert based on priority (critical first, then high, medium, low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = queue.findIndex(t => 
      priorityOrder[t.priority] > priorityOrder[task.priority]
    );
    
    if (insertIndex === -1) {
      queue.push(fullTask);
    } else {
      queue.splice(insertIndex, 0, fullTask);
    }

    this.taskSubject.next(fullTask);
    this.emit('task-queued', fullTask);

    return fullTask.id;
  }

  async getTaskResult(taskId: string): Promise<ProcessingResult | null> {
    return this.results.get(taskId) || null;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    // Remove from queue
    for (const [queueKey, queue] of this.taskQueue.entries()) {
      const index = queue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
        this.emit('task-cancelled', taskId);
        return true;
      }
    }

    // Cancel active task
    if (this.activeTasks.has(taskId)) {
      this.activeTasks.delete(taskId);
      this.emit('task-cancelled', taskId);
      return true;
    }

    return false;
  }

  // Streaming Support
  getStreamingResponse$(taskId: string): Observable<StreamingResponse> {
    return this.streamingSubject.pipe(
      filter(response => response.taskId === taskId)
    );
  }

  private emitStreamingChunk(taskId: string, chunk: string, isComplete = false, metadata?: any): void {
    const response: StreamingResponse = {
      taskId,
      chunk,
      isComplete,
      metadata
    };
    
    this.streamingSubject.next(response);
    this.emit('streaming-chunk', response);
  }

  // Worker Pool Management
  private initializeWorkerPools(): void {
    const poolConfigs = [
      { id: 'code-generation', type: 'code-generation', maxConcurrency: 3 },
      { id: 'analysis', type: 'analysis', maxConcurrency: 5 },
      { id: 'testing', type: 'testing', maxConcurrency: 4 },
      { id: 'documentation', type: 'documentation', maxConcurrency: 2 },
      { id: 'custom', type: 'custom', maxConcurrency: 2 }
    ];

    for (const config of poolConfigs) {
      this.workerPools.set(config.id, {
        ...config,
        activeWorkers: 0,
        queueSize: 0,
        averageProcessingTime: 0
      });
    }
  }

  private getAvailableWorkerPool(taskType: string): WorkerPool | null {
    const pool = this.workerPools.get(taskType);
    if (pool && pool.activeWorkers < pool.maxConcurrency) {
      return pool;
    }
    return null;
  }

  // Processing Engine
  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processNextTask();
  }

  private async processNextTask(): Promise<void> {
    if (!this.isProcessing) return;

    const task = this.getNextTask();
    if (!task) {
      // No tasks available, check again in 100ms
      setTimeout(() => this.processNextTask(), 100);
      return;
    }

    const pool = this.getAvailableWorkerPool(task.type);
    if (!pool) {
      // No available workers, check again in 50ms
      setTimeout(() => this.processNextTask(), 50);
      return;
    }

    // Process the task
    await this.executeTask(task, pool);
    
    // Continue processing
    setImmediate(() => this.processNextTask());
  }

  private getNextTask(): ProcessingTask | null {
    // Check queues in priority order
    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    const typeOrder = ['code-generation', 'analysis', 'testing', 'documentation', 'custom'];

    for (const priority of priorityOrder) {
      for (const type of typeOrder) {
        const queueKey = `${type}_${priority}`;
        const queue = this.taskQueue.get(queueKey);
        if (queue && queue.length > 0) {
          return queue.shift()!;
        }
      }
    }

    return null;
  }

  private async executeTask(task: ProcessingTask, pool: WorkerPool): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Mark task as active
      this.activeTasks.set(task.id, task);
      pool.activeWorkers++;
      
      this.emit('task-started', task);

      // Execute the task based on type
      const result = await this.processTaskByType(task);
      
      const duration = Date.now() - startTime;
      const processResult: ProcessingResult = {
        taskId: task.id,
        success: true,
        result,
        duration,
        completedAt: new Date()
      };

      this.results.set(task.id, processResult);
      this.resultSubject.next(processResult);
      this.emit('task-completed', processResult);

      // Update pool statistics
      this.updatePoolStats(pool, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      const processResult: ProcessingResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        completedAt: new Date()
      };

      // Retry logic
      if (task.retries && task.retries > 0) {
        task.retries--;
        // Re-queue the task
        const queueKey = `${task.type}_${task.priority}`;
        const queue = this.taskQueue.get(queueKey)!;
        queue.unshift(task);
        
        this.emit('task-retry', { task, error });
      } else {
        this.results.set(task.id, processResult);
        this.resultSubject.next(processResult);
        this.emit('task-failed', processResult);
      }

    } finally {
      // Clean up
      this.activeTasks.delete(task.id);
      pool.activeWorkers--;
    }
  }

  private async processTaskByType(task: ProcessingTask): Promise<any> {
    switch (task.type) {
      case 'code-generation':
        return await this.processCodeGeneration(task);
      case 'analysis':
        return await this.processAnalysis(task);
      case 'testing':
        return await this.processTesting(task);
      case 'documentation':
        return await this.processDocumentation(task);
      case 'custom':
        return await this.processCustomTask(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processCodeGeneration(task: ProcessingTask): Promise<any> {
    const { prompt, language, context } = task.payload;
    
    // Simulate streaming response
    this.emitStreamingChunk(task.id, '// Generating code...\n');
    
    // Simulate AI processing with streaming
    const chunks = [
      `function ${context?.functionName || 'generatedFunction'}(`,
      `${context?.parameters || 'param'}: ${language === 'typescript' ? 'string' : ''}`,
      `) {\n`,
      `  // Implementation based on: ${prompt}\n`,
      `  console.log('Generated function');\n`,
      `  return ${context?.returnValue || 'null'};\n`,
      `}`
    ];

    for (let i = 0; i < chunks.length; i++) {
      await this.delay(200); // Simulate processing time
      this.emitStreamingChunk(task.id, chunks[i], i === chunks.length - 1);
    }

    return {
      code: chunks.join(''),
      language,
      metadata: {
        linesOfCode: chunks.length,
        complexity: 'low',
        estimatedQuality: 0.85
      }
    };
  }

  private async processAnalysis(task: ProcessingTask): Promise<any> {
    const { code, analysisType } = task.payload;
    
    this.emitStreamingChunk(task.id, 'Analyzing code...\n');
    
    await this.delay(1000); // Simulate analysis time
    
    const result = {
      analysisType,
      issues: [
        { type: 'warning', message: 'Consider adding error handling', line: 5 },
        { type: 'info', message: 'Function could be optimized', line: 12 }
      ],
      metrics: {
        complexity: 3,
        maintainability: 0.8,
        testability: 0.9
      },
      suggestions: [
        'Add input validation',
        'Consider using async/await',
        'Add comprehensive error handling'
      ]
    };

    this.emitStreamingChunk(task.id, JSON.stringify(result, null, 2), true);
    return result;
  }

  private async processTesting(task: ProcessingTask): Promise<any> {
    const { code, testFramework } = task.payload;
    
    this.emitStreamingChunk(task.id, `// Generating ${testFramework} tests...\n`);
    
    await this.delay(1500);
    
    const testCode = `
describe('Generated Tests', () => {
  test('should handle valid input', () => {
    // Test implementation
    expect(true).toBe(true);
  });
  
  test('should handle edge cases', () => {
    // Edge case testing
    expect(true).toBe(true);
  });
});`;

    this.emitStreamingChunk(task.id, testCode, true);
    
    return {
      testCode,
      framework: testFramework,
      coverage: {
        statements: 95,
        branches: 90,
        functions: 100,
        lines: 95
      }
    };
  }

  private async processDocumentation(task: ProcessingTask): Promise<any> {
    const { code, format } = task.payload;
    
    this.emitStreamingChunk(task.id, `# Generated Documentation\n\n`);
    
    await this.delay(800);
    
    const docs = `
## Overview
This function provides...

## Parameters
- \`param\`: Description of parameter

## Returns
Returns a value that...

## Examples
\`\`\`javascript
const result = generatedFunction('example');
\`\`\`
`;

    this.emitStreamingChunk(task.id, docs, true);
    
    return {
      documentation: docs,
      format,
      wordCount: docs.split(' ').length
    };
  }

  private async processCustomTask(task: ProcessingTask): Promise<any> {
    const { handler, ...payload } = task.payload;
    
    if (typeof handler === 'function') {
      return await handler(payload, {
        emitChunk: (chunk: string, isComplete = false) => 
          this.emitStreamingChunk(task.id, chunk, isComplete)
      });
    }
    
    throw new Error('Custom task requires a handler function');
  }

  private updatePoolStats(pool: WorkerPool, duration: number): void {
    // Simple moving average for processing time
    pool.averageProcessingTime = pool.averageProcessingTime === 0 
      ? duration 
      : (pool.averageProcessingTime * 0.8) + (duration * 0.2);
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Observables for reactive UI
  getTasks$(): Observable<ProcessingTask> {
    return this.taskSubject.asObservable();
  }

  getResults$(): Observable<ProcessingResult> {
    return this.resultSubject.asObservable();
  }

  getStreaming$(): Observable<StreamingResponse> {
    return this.streamingSubject.asObservable();
  }

  // Performance Monitoring
  getPerformanceMetrics(): {
    totalTasksProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    activeTasksCount: number;
    queuedTasksCount: number;
    workerPools: WorkerPool[];
  } {
    const totalTasks = this.results.size;
    const successfulTasks = Array.from(this.results.values()).filter(r => r.success).length;
    const averageTime = Array.from(this.results.values())
      .reduce((sum, r) => sum + r.duration, 0) / totalTasks || 0;
    
    const queuedTasks = Array.from(this.taskQueue.values())
      .reduce((sum, queue) => sum + queue.length, 0);

    return {
      totalTasksProcessed: totalTasks,
      averageProcessingTime: averageTime,
      successRate: totalTasks > 0 ? successfulTasks / totalTasks : 0,
      activeTasksCount: this.activeTasks.size,
      queuedTasksCount: queuedTasks,
      workerPools: Array.from(this.workerPools.values())
    };
  }

  // Cleanup
  shutdown(): void {
    this.isProcessing = false;
    this.activeTasks.clear();
    this.taskQueue.clear();
    this.removeAllListeners();
  }
}