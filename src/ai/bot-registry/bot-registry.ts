/**
 * AI Bot Registry Implementation
 * Manages bot catalog, versioning, and lifecycle
 */

import { EventEmitter } from 'events';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import {
  IBotRegistry,
  BotDefinition,
  BotMetadata,
  BotSearchQuery,
  ValidationResult,
  SecurityReport,
  BotCategory,
  Permission,
  RiskLevel
} from './interfaces';

export class BotRegistry extends EventEmitter implements IBotRegistry {
  private bots = new Map<string, BotDefinition>();
  private versions = new Map<string, Map<string, BotDefinition>>();
  private installedBots = new Set<string>();
  private enabledBots = new Set<string>();
  
  constructor(
    private logger: Logger,
    private performanceMonitor: PerformanceMonitor
  ) {
    super();
    this.logger.info('BotRegistry initialized');
  }

  async registerBot(bot: BotDefinition): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.register', async () => {
      const validation = await this.validateBot(bot);
      if (!validation.valid) {
        throw new Error(`Bot validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const botId = bot.metadata.id;
      const version = bot.metadata.version;

      // Store main bot definition
      this.bots.set(botId, bot);

      // Store version
      if (!this.versions.has(botId)) {
        this.versions.set(botId, new Map());
      }
      this.versions.get(botId)!.set(version, bot);

      this.logger.info(`Bot registered: ${botId}@${version}`);
      this.emit('bot-registered', { botId, version, bot });
    });
  }

  async unregisterBot(botId: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.unregister', async () => {
      if (!this.bots.has(botId)) {
        throw new Error(`Bot not found: ${botId}`);
      }

      // Remove from all collections
      this.bots.delete(botId);
      this.versions.delete(botId);
      this.installedBots.delete(botId);
      this.enabledBots.delete(botId);

      this.logger.info(`Bot unregistered: ${botId}`);
      this.emit('bot-unregistered', { botId });
    });
  }

  async updateBot(botId: string, updates: Partial<BotDefinition>): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.update', async () => {
      const existingBot = this.bots.get(botId);
      if (!existingBot) {
        throw new Error(`Bot not found: ${botId}`);
      }

      const updatedBot: BotDefinition = {
        ...existingBot,
        ...updates,
        metadata: {
          ...existingBot.metadata,
          ...updates.metadata,
          updated: new Date()
        }
      };

      const validation = await this.validateBot(updatedBot);
      if (!validation.valid) {
        throw new Error(`Bot update validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      this.bots.set(botId, updatedBot);
      
      this.logger.info(`Bot updated: ${botId}`);
      this.emit('bot-updated', { botId, updates });
    });
  }

  async searchBots(query: BotSearchQuery): Promise<BotMetadata[]> {
    return this.performanceMonitor.timeAsync('bot-registry.search', async () => {
      let results = Array.from(this.bots.values()).map(bot => bot.metadata);

      // Apply filters
      if (query.query) {
        const searchTerm = query.query.toLowerCase();
        results = results.filter(bot => 
          bot.name.toLowerCase().includes(searchTerm) ||
          bot.description.toLowerCase().includes(searchTerm) ||
          bot.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (query.category) {
        results = results.filter(bot => bot.category === query.category);
      }

      if (query.tags && query.tags.length > 0) {
        results = results.filter(bot => 
          query.tags!.some(tag => bot.tags.includes(tag))
        );
      }

      if (query.author) {
        results = results.filter(bot => bot.author === query.author);
      }

      if (query.verified !== undefined) {
        results = results.filter(bot => bot.verified === query.verified);
      }

      if (query.minRating !== undefined) {
        results = results.filter(bot => bot.rating >= query.minRating!);
      }

      // Sort by relevance (rating * downloads)
      results.sort((a, b) => (b.rating * b.downloads) - (a.rating * a.downloads));

      this.logger.debug(`Bot search completed: ${results.length} results`);
      return results;
    });
  }

  async getBotById(botId: string): Promise<BotDefinition | null> {
    return this.performanceMonitor.timeAsync('bot-registry.get-by-id', async () => {
      return this.bots.get(botId) || null;
    });
  }

  async listBots(category?: BotCategory): Promise<BotMetadata[]> {
    return this.performanceMonitor.timeAsync('bot-registry.list', async () => {
      let bots = Array.from(this.bots.values()).map(bot => bot.metadata);
      
      if (category) {
        bots = bots.filter(bot => bot.category === category);
      }

      return bots.sort((a, b) => b.rating - a.rating);
    });
  }

  async getBotVersions(botId: string): Promise<string[]> {
    return this.performanceMonitor.timeAsync('bot-registry.get-versions', async () => {
      const versions = this.versions.get(botId);
      if (!versions) {
        return [];
      }
      return Array.from(versions.keys()).sort();
    });
  }

  async getBotVersion(botId: string, version: string): Promise<BotDefinition | null> {
    return this.performanceMonitor.timeAsync('bot-registry.get-version', async () => {
      const versions = this.versions.get(botId);
      if (!versions) {
        return null;
      }
      return versions.get(version) || null;
    });
  }

  async installBot(botId: string, version?: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.install', async () => {
      let bot: BotDefinition | null;
      
      if (version) {
        bot = await this.getBotVersion(botId, version);
      } else {
        bot = await this.getBotById(botId);
      }

      if (!bot) {
        throw new Error(`Bot not found: ${botId}${version ? `@${version}` : ''}`);
      }

      // Security check
      const securityReport = await this.verifyBotSecurity(botId);
      if (!securityReport.safe) {
        const criticalRisks = securityReport.risks.filter(r => r.level === RiskLevel.CRITICAL);
        if (criticalRisks.length > 0) {
          throw new Error(`Bot installation blocked due to critical security risks: ${criticalRisks.map(r => r.description).join(', ')}`);
        }
      }

      this.installedBots.add(botId);
      
      this.logger.info(`Bot installed: ${botId}${version ? `@${version}` : ''}`);
      this.emit('bot-installed', { botId, version, bot });
    });
  }

  async uninstallBot(botId: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.uninstall', async () => {
      if (!this.installedBots.has(botId)) {
        throw new Error(`Bot not installed: ${botId}`);
      }

      this.installedBots.delete(botId);
      this.enabledBots.delete(botId);

      this.logger.info(`Bot uninstalled: ${botId}`);
      this.emit('bot-uninstalled', { botId });
    });
  }

  async enableBot(botId: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.enable', async () => {
      if (!this.installedBots.has(botId)) {
        throw new Error(`Bot not installed: ${botId}`);
      }

      this.enabledBots.add(botId);

      this.logger.info(`Bot enabled: ${botId}`);
      this.emit('bot-enabled', { botId });
    });
  }

  async disableBot(botId: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.disable', async () => {
      this.enabledBots.delete(botId);

      this.logger.info(`Bot disabled: ${botId}`);
      this.emit('bot-disabled', { botId });
    });
  }

  async validateBot(bot: BotDefinition): Promise<ValidationResult> {
    return this.performanceMonitor.timeAsync('bot-registry.validate', async () => {
      const errors: any[] = [];
      const warnings: any[] = [];

      // Validate metadata
      if (!bot.metadata.id) {
        errors.push({ code: 'MISSING_ID', message: 'Bot ID is required', field: 'metadata.id' });
      }

      if (!bot.metadata.name) {
        errors.push({ code: 'MISSING_NAME', message: 'Bot name is required', field: 'metadata.name' });
      }

      if (!bot.metadata.version) {
        errors.push({ code: 'MISSING_VERSION', message: 'Bot version is required', field: 'metadata.version' });
      }

      // Validate implementation
      if (!bot.implementation.entryPoint) {
        errors.push({ code: 'MISSING_ENTRY_POINT', message: 'Entry point is required', field: 'implementation.entryPoint' });
      }

      // Validate capabilities
      if (!bot.metadata.capabilities || bot.metadata.capabilities.length === 0) {
        warnings.push({ code: 'NO_CAPABILITIES', message: 'Bot has no defined capabilities', field: 'metadata.capabilities' });
      }

      // Validate permissions
      const dangerousPermissions = bot.configuration.permissions.filter(p => 
        p === Permission.SYSTEM_EXEC || p === Permission.FILE_WRITE
      );
      
      if (dangerousPermissions.length > 0) {
        warnings.push({ 
          code: 'DANGEROUS_PERMISSIONS', 
          message: `Bot requests dangerous permissions: ${dangerousPermissions.join(', ')}`,
          field: 'configuration.permissions'
        });
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    });
  }

  async verifyBotSecurity(botId: string): Promise<SecurityReport> {
    return this.performanceMonitor.timeAsync('bot-registry.security-check', async () => {
      const bot = this.bots.get(botId);
      if (!bot) {
        throw new Error(`Bot not found: ${botId}`);
      }

      const risks: any[] = [];
      const permissions = bot.configuration.permissions;

      // Check for high-risk permissions
      if (permissions.includes(Permission.SYSTEM_EXEC)) {
        risks.push({
          level: RiskLevel.HIGH,
          description: 'Bot can execute system commands',
          mitigation: 'Run in sandboxed environment'
        });
      }

      if (permissions.includes(Permission.FILE_WRITE)) {
        risks.push({
          level: RiskLevel.MEDIUM,
          description: 'Bot can modify files',
          mitigation: 'Restrict to specific directories'
        });
      }

      if (permissions.includes(Permission.NETWORK_ACCESS)) {
        risks.push({
          level: RiskLevel.MEDIUM,
          description: 'Bot can access network resources',
          mitigation: 'Monitor network traffic'
        });
      }

      // Check source code for suspicious patterns
      const sourceCode = Object.values(bot.implementation.sourceFiles).join('\n');
      if (sourceCode.includes('eval(') || sourceCode.includes('Function(')) {
        risks.push({
          level: RiskLevel.CRITICAL,
          description: 'Bot uses dynamic code execution',
          mitigation: 'Manual code review required'
        });
      }

      const criticalRisks = risks.filter(r => r.level === RiskLevel.CRITICAL);
      const safe = criticalRisks.length === 0;

      return {
        safe,
        risks,
        permissions,
        sandboxed: true // Always run in sandbox
      };
    });
  }

  // Utility methods
  getInstalledBots(): string[] {
    return Array.from(this.installedBots);
  }

  getEnabledBots(): string[] {
    return Array.from(this.enabledBots);
  }

  isInstalled(botId: string): boolean {
    return this.installedBots.has(botId);
  }

  isEnabled(botId: string): boolean {
    return this.enabledBots.has(botId);
  }
}