import { PlatformType } from '../../core/whispering-interfaces';
import { StorageManager } from '../../core/platform-interfaces';

export interface Improvement {
  id: string;
  type: 'performance' | 'usability' | 'code_quality' | 'learning';
  description: string;
  confidence: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface ImprovementConfig {
  platform: PlatformType;
  storageManager: StorageManager;
}

export class ImprovementTracker {
  private config: ImprovementConfig;
  private improvements: Improvement[] = [];

  constructor(config: ImprovementConfig) {
    this.config = config;
  }

  async trackImprovement(improvement: Improvement): Promise<void> {
    this.improvements.push(improvement);
    console.log('📈 Tracking improvement:', improvement);
  }

  async getImprovements(): Promise<Improvement[]> {
    return this.improvements;
  }

  async getRecentImprovements(): Promise<Improvement[]> {
    // Return recent improvements (last 10)
    return this.improvements.slice(-10);
  }
}
