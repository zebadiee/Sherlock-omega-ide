#!/usr/bin/env npx ts-node
/**
 * Zero-Friction Metrics Collection for Sherlock Ω
 * Measures and reports on friction elimination effectiveness
 */

import { IntegratedFrictionProtocol } from '../src/friction/IntegratedFrictionProtocol';

interface FrictionMetrics {
  totalFrictionDetected: number;
  totalFrictionEliminated: number;
  eliminationRate: number;
  averageDetectionTime: number;
  averageEliminationTime: number;
  flowStatePreservation: number;
  zeroFrictionScore: number;
}

class ZeroFrictionMetricsCollector {
  private protocol: IntegratedFrictionProtocol;

  constructor() {
    this.protocol = new IntegratedFrictionProtocol();
  }

  /**
   * Collect comprehensive zero-friction metrics
   */
  async collectMetrics(): Promise<FrictionMetrics> {
    console.log('📊 Collecting Zero-Friction Metrics...');
    console.log('=' .repeat(45));

    const testScenarios = this.generateTestScenarios();
    let totalDetected = 0;
    let totalEliminated = 0;
    let totalDetectionTime = 0;
    let totalEliminationTime = 0;
    let flowStateInterruptions = 0;

    for (const scenario of testScenarios) {
      console.log(`\n🧪 Testing: ${scenario.name}`);
      
      // Detection phase
      const detectionStart = Date.now();
      const result = await this.protocol.runIntegratedDetection(scenario.context);
      const detectionTime = Date.now() - detectionStart;
      
      totalDetected += result.actionableItems.length;
      totalDetectionTime += detectionTime;

      console.log(`   🔍 Detected ${result.actionableItems.length} friction points in ${detectionTime}ms`);

      // Elimination phase
      const eliminationStart = Date.now();
      let eliminated = 0;
      
      for (const action of result.actionableItems.slice(0, 3)) { // Limit for demo
        const executionResult = await this.protocol.executeAction(action.id);
        if (executionResult.success) {
          eliminated++;
        }
      }
      
      const eliminationTime = Date.now() - eliminationStart;
      totalEliminated += eliminated;
      totalEliminationTime += eliminationTime;

      // Flow state analysis
      const flowInterruption = this.calculateFlowInterruption(detectionTime, eliminationTime);
      flowStateInterruptions += flowInterruption;

      console.log(`   ✅ Eliminated ${eliminated} friction points in ${eliminationTime}ms`);
      console.log(`   🌊 Flow interruption: ${flowInterruption.toFixed(2)}ms`);
    }

    const metrics: FrictionMetrics = {
      totalFrictionDetected: totalDetected,
      totalFrictionEliminated: totalEliminated,
      eliminationRate: totalDetected > 0 ? totalEliminated / totalDetected : 0,
      averageDetectionTime: totalDetectionTime / testScenarios.length,
      averageEliminationTime: totalEliminationTime / testScenarios.length,
      flowStatePreservation: this.calculateFlowStatePreservation(flowStateInterruptions, testScenarios.length),
      zeroFrictionScore: this.calculateZeroFrictionScore(totalDetected, totalEliminated, totalDetectionTime, totalEliminationTime)
    };

    return metrics;
  }

  /**
   * Generate test scenarios for metrics collection
   */
  private generateTestScenarios() {
    return [
      {
        name: 'React Component with Missing Dependencies',
        context: {
          filePath: 'src/components/UserProfile.tsx',
          content: `
import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { Button } from '@mui/material';

export const UserProfile = ({ user }) => {
  const formattedDate = moment(user.createdAt).format('YYYY-MM-DD');
  const processedData = _.omit(user, ['password', 'secret']);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Member since: {formattedDate}</p>
      <Button variant="contained">Edit Profile</Button>
    </div>
  );
};
          `,
          checkPackageJson: true
        }
      },
      {
        name: 'Node.js API with Express Dependencies',
        context: {
          filePath: 'src/api/server.ts',
          content: `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

export default app;
          `,
          checkPackageJson: true
        }
      },
      {
        name: 'Utility Functions with Multiple Libraries',
        context: {
          filePath: 'src/utils/helpers.ts',
          content: `
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';

export const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 5000
});

export const generateId = () => uuidv4();
export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyToken = (token: string) => jwt.verify(token, process.env.JWT_SECRET);
export const isValidEmail = (email: string) => validator.isEmail(email);
          `,
          checkPackageJson: true
        }
      },
      {
        name: 'Data Processing with Scientific Libraries',
        context: {
          filePath: 'src/analysis/processor.ts',
          content: `
import * as d3 from 'd3';
import * as math from 'mathjs';
import Chart from 'chart.js';
import Papa from 'papaparse';

export class DataProcessor {
  processCSV(csvData: string) {
    return Papa.parse(csvData, { header: true });
  }
  
  calculateStatistics(data: number[]) {
    return {
      mean: math.mean(data),
      median: math.median(data),
      std: math.std(data)
    };
  }
  
  createVisualization(data: any[]) {
    const svg = d3.select('body').append('svg');
    // D3 visualization code
    return svg;
  }
}
          `,
          checkPackageJson: true
        }
      }
    ];
  }

  /**
   * Calculate flow state interruption time
   */
  private calculateFlowInterruption(detectionTime: number, eliminationTime: number): number {
    // Flow interruption is minimized when detection and elimination are fast
    // Perfect zero-friction would be 0ms interruption
    const baseInterruption = Math.max(0, detectionTime - 100); // Sub-100ms is considered non-disruptive
    const eliminationPenalty = eliminationTime > 1000 ? eliminationTime - 1000 : 0; // Over 1s is disruptive
    
    return baseInterruption + eliminationPenalty;
  }

  /**
   * Calculate flow state preservation score (0-1, higher is better)
   */
  private calculateFlowStatePreservation(totalInterruption: number, scenarioCount: number): number {
    const averageInterruption = totalInterruption / scenarioCount;
    // Perfect score (1.0) for 0ms interruption, decreasing as interruption increases
    return Math.max(0, 1 - (averageInterruption / 5000)); // 5s interruption = 0 score
  }

  /**
   * Calculate overall zero-friction score (0-100)
   */
  private calculateZeroFrictionScore(
    detected: number, 
    eliminated: number, 
    detectionTime: number, 
    eliminationTime: number
  ): number {
    const eliminationRate = detected > 0 ? eliminated / detected : 0;
    const speedScore = Math.max(0, 1 - (detectionTime + eliminationTime) / 10000); // 10s = 0 score
    const effectivenessScore = eliminationRate;
    
    return Math.round((speedScore * 0.4 + effectivenessScore * 0.6) * 100);
  }

  /**
   * Print comprehensive metrics report
   */
  printMetricsReport(metrics: FrictionMetrics): void {
    console.log('\n🎯 Zero-Friction Metrics Report');
    console.log('=' .repeat(45));
    
    console.log(`\n📊 Detection & Elimination:`);
    console.log(`   🔍 Total Friction Detected: ${metrics.totalFrictionDetected}`);
    console.log(`   ✅ Total Friction Eliminated: ${metrics.totalFrictionEliminated}`);
    console.log(`   📈 Elimination Rate: ${(metrics.eliminationRate * 100).toFixed(1)}%`);
    
    console.log(`\n⚡ Performance Metrics:`);
    console.log(`   🕐 Average Detection Time: ${metrics.averageDetectionTime.toFixed(2)}ms`);
    console.log(`   🕑 Average Elimination Time: ${metrics.averageEliminationTime.toFixed(2)}ms`);
    
    console.log(`\n🌊 Flow State Analysis:`);
    console.log(`   💫 Flow State Preservation: ${(metrics.flowStatePreservation * 100).toFixed(1)}%`);
    
    console.log(`\n🏆 Zero-Friction Score: ${metrics.zeroFrictionScore}/100`);
    
    // Provide assessment
    if (metrics.zeroFrictionScore >= 90) {
      console.log('   🎉 EXCELLENT: True zero-friction achieved!');
    } else if (metrics.zeroFrictionScore >= 75) {
      console.log('   ✅ GOOD: Near zero-friction performance');
    } else if (metrics.zeroFrictionScore >= 60) {
      console.log('   ⚠️  FAIR: Some friction remains');
    } else {
      console.log('   ❌ NEEDS IMPROVEMENT: Significant friction detected');
    }

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (metrics.averageDetectionTime > 200) {
      console.log('   • Optimize detection algorithms for sub-200ms performance');
    }
    if (metrics.eliminationRate < 0.9) {
      console.log('   • Improve auto-elimination capabilities');
    }
    if (metrics.flowStatePreservation < 0.8) {
      console.log('   • Reduce flow state interruptions');
    }
    
    console.log('\n🧠 Sherlock Ω: Computational Consciousness Active ✨');
  }
}

// Run metrics collection if this file is executed directly
if (require.main === module) {
  const collector = new ZeroFrictionMetricsCollector();
  collector.collectMetrics()
    .then(metrics => collector.printMetricsReport(metrics))
    .catch(console.error);
}