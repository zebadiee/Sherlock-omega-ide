/**
 * SHERLOCK Ω AI BOT BUILDER
 * 
 * Wizard for creating custom AI bots with specific capabilities
 */

export interface BotTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  capabilities: string[];
  model: string;
  examples: string[];
}

export const BOT_TEMPLATES: BotTemplate[] = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code for bugs, performance, and best practices',
    icon: '🔍',
    prompt: 'You are a senior code reviewer. Analyze code for bugs, performance issues, security vulnerabilities, and adherence to best practices. Provide specific, actionable feedback.',
    capabilities: ['code-analysis', 'security-scan', 'performance-review'],
    model: 'anthropic/claude-3-sonnet',
    examples: [
      'Review this React component for performance issues',
      'Check this API endpoint for security vulnerabilities',
      'Analyze this algorithm for optimization opportunities'
    ]
  },
  {
    id: 'test-generator',
    name: 'Test Generator',
    description: 'Automatically generates comprehensive test suites',
    icon: '🧪',
    prompt: 'You are a test automation expert. Generate comprehensive test suites including unit tests, integration tests, and edge cases. Use appropriate testing frameworks and follow testing best practices.',
    capabilities: ['test-generation', 'coverage-analysis', 'mock-creation'],
    model: 'anthropic/claude-3-sonnet',
    examples: [
      'Generate unit tests for this utility function',
      'Create integration tests for this API',
      'Write edge case tests for this validation logic'
    ]
  },
  {
    id: 'documentation-writer',
    name: 'Documentation Writer',
    description: 'Creates comprehensive documentation and README files',
    icon: '📚',
    prompt: 'You are a technical documentation specialist. Create clear, comprehensive documentation including API docs, README files, code comments, and user guides. Make complex topics accessible.',
    capabilities: ['doc-generation', 'api-docs', 'readme-creation'],
    model: 'anthropic/claude-3-haiku',
    examples: [
      'Write API documentation for these endpoints',
      'Create a README for this project',
      'Generate inline code comments'
    ]
  },
  {
    id: 'debugging-assistant',
    name: 'Debugging Assistant',
    description: 'Helps identify and fix bugs in your code',
    icon: '🐛',
    prompt: 'You are a debugging expert. Analyze error messages, stack traces, and code to identify root causes of bugs. Provide step-by-step debugging strategies and fixes.',
    capabilities: ['error-analysis', 'stack-trace-reading', 'fix-suggestions'],
    model: 'anthropic/claude-3-sonnet',
    examples: [
      'Help me debug this error message',
      'Analyze this stack trace',
      'Why is this function not working as expected?'
    ]
  },
  {
    id: 'architecture-advisor',
    name: 'Architecture Advisor',
    description: 'Provides guidance on software architecture and design patterns',
    icon: '🏗️',
    prompt: 'You are a software architecture expert. Provide guidance on system design, design patterns, scalability, and architectural best practices. Consider trade-offs and provide multiple options.',
    capabilities: ['architecture-design', 'pattern-suggestions', 'scalability-advice'],
    model: 'openai/gpt-4-turbo',
    examples: [
      'Design a microservices architecture for this system',
      'Suggest design patterns for this use case',
      'How can I make this system more scalable?'
    ]
  },
  {
    id: 'performance-optimizer',
    name: 'Performance Optimizer',
    description: 'Analyzes and optimizes code performance',
    icon: '⚡',
    prompt: 'You are a performance optimization expert. Analyze code for performance bottlenecks, memory usage, and optimization opportunities. Provide specific improvements with benchmarks when possible.',
    capabilities: ['performance-analysis', 'optimization-suggestions', 'benchmarking'],
    model: 'anthropic/claude-3-sonnet',
    examples: [
      'Optimize this database query',
      'Improve the performance of this algorithm',
      'Reduce memory usage in this component'
    ]
  }
];

export class BotBuilder {
  private container: HTMLElement;
  private onBotCreated: (bot: any) => void;

  constructor(container: HTMLElement, onBotCreated: (bot: any) => void) {
    this.container = container;
    this.onBotCreated = onBotCreated;
  }

  /**
   * Show the bot builder wizard
   */
  show(): void {
    this.container.innerHTML = this.createWizardHTML();
    this.attachEventListeners();
  }

  /**
   * Create the wizard HTML
   */
  private createWizardHTML(): string {
    return `
      <div class="bot-builder-wizard bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
        <div class="wizard-header mb-6">
          <h2 class="text-2xl font-bold mb-2">🤖 AI Bot Builder</h2>
          <p class="text-gray-400">Create a specialized AI assistant for your development workflow</p>
        </div>

        <div class="wizard-steps mb-6">
          <div class="flex items-center space-x-4">
            <div class="step active flex items-center space-x-2">
              <div class="step-number bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</div>
              <span class="text-sm">Choose Template</span>
            </div>
            <div class="step-divider flex-1 h-px bg-gray-600"></div>
            <div class="step flex items-center space-x-2">
              <div class="step-number bg-gray-600 text-gray-400 rounded-full w-8 h-8 flex items-center justify-center text-sm">2</div>
              <span class="text-sm text-gray-400">Customize</span>
            </div>
            <div class="step-divider flex-1 h-px bg-gray-600"></div>
            <div class="step flex items-center space-x-2">
              <div class="step-number bg-gray-600 text-gray-400 rounded-full w-8 h-8 flex items-center justify-center text-sm">3</div>
              <span class="text-sm text-gray-400">Deploy</span>
            </div>
          </div>
        </div>

        <div id="step-1" class="wizard-step">
          <h3 class="text-lg font-semibold mb-4">Choose a Bot Template</h3>
          <div class="template-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${BOT_TEMPLATES.map(template => `
              <div class="template-card bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors" data-template="${template.id}">
                <div class="template-header flex items-center space-x-3 mb-3">
                  <span class="template-icon text-2xl">${template.icon}</span>
                  <div>
                    <h4 class="font-semibold">${template.name}</h4>
                    <p class="text-xs text-gray-400">${template.model}</p>
                  </div>
                </div>
                <p class="text-sm text-gray-300 mb-3">${template.description}</p>
                <div class="template-capabilities">
                  <div class="flex flex-wrap gap-1">
                    ${template.capabilities.slice(0, 2).map(cap => `
                      <span class="bg-blue-600 text-xs px-2 py-1 rounded">${cap}</span>
                    `).join('')}
                    ${template.capabilities.length > 2 ? `<span class="text-xs text-gray-400">+${template.capabilities.length - 2} more</span>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
            
            <div class="template-card bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-500" data-template="custom">
              <div class="template-header flex items-center space-x-3 mb-3">
                <span class="template-icon text-2xl">✨</span>
                <div>
                  <h4 class="font-semibold">Custom Bot</h4>
                  <p class="text-xs text-gray-400">Build from scratch</p>
                </div>
              </div>
              <p class="text-sm text-gray-300">Create a completely custom AI bot with your own prompt and capabilities</p>
            </div>
          </div>
        </div>

        <div id="step-2" class="wizard-step hidden">
          <h3 class="text-lg font-semibold mb-4">Customize Your Bot</h3>
          <div class="customization-form space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Bot Name</label>
              <input id="bot-name" type="text" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" placeholder="My Custom Bot">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Description</label>
              <input id="bot-description" type="text" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" placeholder="What does this bot do?">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">AI Model</label>
              <select id="bot-model" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast & Cheap)</option>
                <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet (Balanced)</option>
                <option value="openai/gpt-4-turbo">GPT-4 Turbo (Powerful)</option>
                <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">System Prompt</label>
              <textarea id="bot-prompt" rows="4" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" placeholder="You are a helpful AI assistant that..."></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Capabilities (comma-separated)</label>
              <input id="bot-capabilities" type="text" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" placeholder="code-analysis, debugging, optimization">
            </div>
          </div>
        </div>

        <div id="step-3" class="wizard-step hidden">
          <h3 class="text-lg font-semibold mb-4">Deploy Your Bot</h3>
          <div class="deployment-preview bg-gray-700 rounded-lg p-4 mb-4">
            <h4 class="font-semibold mb-2">Bot Preview</h4>
            <div id="bot-preview" class="space-y-2">
              <!-- Preview will be populated here -->
            </div>
          </div>
          
          <div class="deployment-options space-y-3">
            <label class="flex items-center space-x-2">
              <input type="checkbox" id="add-to-sidebar" checked class="rounded">
              <span class="text-sm">Add to sidebar</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="checkbox" id="create-shortcut" class="rounded">
              <span class="text-sm">Create keyboard shortcut</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="checkbox" id="auto-activate" checked class="rounded">
              <span class="text-sm">Auto-activate on startup</span>
            </label>
          </div>
        </div>

        <div class="wizard-actions flex justify-between mt-6">
          <button id="back-btn" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded hidden">Back</button>
          <div class="flex space-x-3">
            <button id="cancel-btn" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Cancel</button>
            <button id="next-btn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Next</button>
            <button id="create-btn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded hidden">Create Bot</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    let currentStep = 1;
    let selectedTemplate: BotTemplate | null = null;

    // Template selection
    this.container.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        // Remove previous selection
        this.container.querySelectorAll('.template-card').forEach(c => c.classList.remove('ring-2', 'ring-blue-500'));
        
        // Add selection to clicked card
        card.classList.add('ring-2', 'ring-blue-500');
        
        const templateId = card.getAttribute('data-template');
        selectedTemplate = BOT_TEMPLATES.find(t => t.id === templateId) || null;
      });
    });

    // Navigation buttons
    const nextBtn = this.container.querySelector('#next-btn') as HTMLButtonElement;
    const backBtn = this.container.querySelector('#back-btn') as HTMLButtonElement;
    const createBtn = this.container.querySelector('#create-btn') as HTMLButtonElement;
    const cancelBtn = this.container.querySelector('#cancel-btn') as HTMLButtonElement;

    nextBtn.addEventListener('click', () => {
      if (currentStep === 1) {
        if (!selectedTemplate && !this.container.querySelector('.template-card.ring-2')) {
          alert('Please select a template');
          return;
        }
        
        // Populate form with template data
        if (selectedTemplate) {
          (this.container.querySelector('#bot-name') as HTMLInputElement).value = selectedTemplate.name;
          (this.container.querySelector('#bot-description') as HTMLInputElement).value = selectedTemplate.description;
          (this.container.querySelector('#bot-model') as HTMLSelectElement).value = selectedTemplate.model;
          (this.container.querySelector('#bot-prompt') as HTMLTextAreaElement).value = selectedTemplate.prompt;
          (this.container.querySelector('#bot-capabilities') as HTMLInputElement).value = selectedTemplate.capabilities.join(', ');
        }
        
        this.showStep(2);
        currentStep = 2;
      } else if (currentStep === 2) {
        this.updatePreview();
        this.showStep(3);
        currentStep = 3;
      }
    });

    backBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        this.showStep(currentStep);
      }
    });

    createBtn.addEventListener('click', () => {
      this.createBot();
    });

    cancelBtn.addEventListener('click', () => {
      this.container.innerHTML = '';
    });
  }

  /**
   * Show specific wizard step
   */
  private showStep(step: number): void {
    // Hide all steps
    this.container.querySelectorAll('.wizard-step').forEach(s => s.classList.add('hidden'));
    
    // Show current step
    this.container.querySelector(`#step-${step}`)?.classList.remove('hidden');
    
    // Update step indicators
    this.container.querySelectorAll('.step').forEach((s, i) => {
      if (i + 1 <= step) {
        s.classList.add('active');
        s.querySelector('.step-number')?.classList.remove('bg-gray-600', 'text-gray-400');
        s.querySelector('.step-number')?.classList.add('bg-blue-600', 'text-white');
        s.querySelector('span')?.classList.remove('text-gray-400');
      }
    });
    
    // Update buttons
    const backBtn = this.container.querySelector('#back-btn') as HTMLButtonElement;
    const nextBtn = this.container.querySelector('#next-btn') as HTMLButtonElement;
    const createBtn = this.container.querySelector('#create-btn') as HTMLButtonElement;
    
    backBtn.classList.toggle('hidden', step === 1);
    nextBtn.classList.toggle('hidden', step === 3);
    createBtn.classList.toggle('hidden', step !== 3);
  }

  /**
   * Update bot preview
   */
  private updatePreview(): void {
    const name = (this.container.querySelector('#bot-name') as HTMLInputElement).value;
    const description = (this.container.querySelector('#bot-description') as HTMLInputElement).value;
    const model = (this.container.querySelector('#bot-model') as HTMLSelectElement).value;
    const capabilities = (this.container.querySelector('#bot-capabilities') as HTMLInputElement).value;

    const preview = this.container.querySelector('#bot-preview');
    if (preview) {
      preview.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-lg">🤖</span>
          <span class="font-semibold">${name}</span>
        </div>
        <p class="text-sm text-gray-300">${description}</p>
        <p class="text-xs text-gray-400">Model: ${model}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          ${capabilities.split(',').map(cap => `
            <span class="bg-blue-600 text-xs px-2 py-1 rounded">${cap.trim()}</span>
          `).join('')}
        </div>
      `;
    }
  }

  /**
   * Create the bot
   */
  private createBot(): void {
    const name = (this.container.querySelector('#bot-name') as HTMLInputElement).value;
    const description = (this.container.querySelector('#bot-description') as HTMLInputElement).value;
    const model = (this.container.querySelector('#bot-model') as HTMLSelectElement).value;
    const prompt = (this.container.querySelector('#bot-prompt') as HTMLTextAreaElement).value;
    const capabilities = (this.container.querySelector('#bot-capabilities') as HTMLInputElement).value.split(',').map(c => c.trim());

    const bot = {
      id: `bot-${Date.now()}`,
      name,
      description,
      model,
      prompt,
      capabilities,
      type: 'ai-bot',
      created: new Date().toISOString()
    };

    this.onBotCreated(bot);
    this.container.innerHTML = `
      <div class="text-center py-8">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-xl font-semibold mb-2">Bot Created Successfully!</h3>
        <p class="text-gray-400 mb-4">${name} is now available in your IDE</p>
        <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded" onclick="this.parentElement.parentElement.innerHTML=''">Close</button>
      </div>
    `;
  }
}