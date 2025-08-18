#!/usr/bin/env ts-node

/**
 * Grover's Search Algorithm Demo
 * Demonstrates quantum speedup for database search
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 */

import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PlatformType } from '../types/core';
import { EnhancedBotBuilder } from '../ai/core/enhanced-bot-builder';
import { EnhancedBotRegistry } from '../ai/core/enhanced-bot-registry';

// Import quantum-circuit for real quantum simulation
let QuantumCircuit: any;
try {
  QuantumCircuit = require('quantum-circuit');
} catch (error) {
  console.warn('⚠️  quantum-circuit not available. Install with: npm install quantum-circuit');
}

class GroverSearchDemo {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private builder: EnhancedBotBuilder;
  private registry: EnhancedBotRegistry;

  constructor() {
    this.logger = new Logger(PlatformType.NODE);
    this.performanceMonitor = new PerformanceMonitor(PlatformType.NODE);
    this.builder = new EnhancedBotBuilder(this.logger, this.performanceMonitor);
    this.registry = new EnhancedBotRegistry(this.logger, this.performanceMonitor);
  }

  async runGroverDemo(): Promise<void> {
    console.log('🔍 Grover\'s Search Algorithm Demo');
    console.log('=' .repeat(50));
    console.log('Demonstrating quantum speedup for database search\n');

    try {
      // Step 1: Create Grover search bot
      console.log('📝 Step 1: Creating Grover search bot...');
      const groverBot = await this.builder.buildQuantumBot(
        'Create a Grover search quantum bot for 3-qubit database search with quadratic speedup'
      );
      
      await this.registry.register(groverBot);
      console.log(`✅ Created: ${groverBot.name}\n`);

      // Step 2: Demonstrate different search sizes
      const searchSizes = [
        { qubits: 2, items: 4, description: '2-qubit search (4 items)' },
        { qubits: 3, items: 8, description: '3-qubit search (8 items)' },
        { qubits: 4, items: 16, description: '4-qubit search (16 items)' }
      ];

      for (const { qubits, items, description } of searchSizes) {
        console.log(`🎯 ${description}`);
        await this.demonstrateGroverSearch(groverBot, qubits, items);
        console.log();
      }

      // Step 3: Compare with classical search
      console.log('📊 Classical vs Quantum Comparison:');
      this.compareSearchAlgorithms();
      console.log();

      // Step 4: Real quantum circuit simulation (if available)
      if (QuantumCircuit) {
        console.log('⚛️  Real Quantum Circuit Simulation:');
        await this.runRealQuantumGrover();
      }

      // Step 5: Educational explanation
      console.log('🎓 How Grover\'s Algorithm Works:');
      this.explainGroverAlgorithm();

    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async demonstrateGroverSearch(groverBot: any, qubits: number, items: number): Promise<void> {
    // Execute Grover's algorithm
    const result = await groverBot.executeQuantumAlgorithm('grover', { 
      qubits,
      target: '1'.repeat(qubits), // Target state (all 1s)
      iterations: Math.floor(Math.PI * Math.sqrt(items) / 4) // Optimal iterations
    });

    // Simulate circuit to get probabilities
    const circuitResult = await groverBot.simulateCircuit(
      `Grover search circuit for ${qubits} qubits with ${items} items`
    );

    console.log(`   🔢 Search space: ${items} items`);
    console.log(`   🔄 Optimal iterations: ${Math.floor(Math.PI * Math.sqrt(items) / 4)}`);
    console.log(`   ⚡ Quantum advantage: ${Math.sqrt(items).toFixed(1)}x speedup`);
    console.log(`   📈 Success probability: ${this.calculateSuccessProbability(circuitResult.probabilities, qubits)}%`);
    
    // Show probability distribution
    console.log('   📊 Probability distribution:');
    Object.entries(circuitResult.probabilities)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 4)
      .forEach(([state, prob]) => {
        const percentage = ((prob as number) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor((prob as number) * 20));
        console.log(`      |${state}⟩: ${percentage}% ${bar}`);
      });
  }

  private calculateSuccessProbability(probabilities: Record<string, number>, qubits: number): string {
    const targetState = '1'.repeat(qubits);
    const targetProb = probabilities[targetState] || 0;
    return (targetProb * 100).toFixed(1);
  }

  private compareSearchAlgorithms(): void {
    const sizes = [4, 8, 16, 32, 64, 128, 256];
    
    console.log('   Database Size | Classical Queries | Quantum Queries | Speedup');
    console.log('   ' + '-'.repeat(65));
    
    sizes.forEach(size => {
      const classicalQueries = Math.floor(size / 2); // Average case
      const quantumQueries = Math.floor(Math.PI * Math.sqrt(size) / 4);
      const speedup = (classicalQueries / quantumQueries).toFixed(1);
      
      console.log(`   ${size.toString().padStart(12)} | ${classicalQueries.toString().padStart(16)} | ${quantumQueries.toString().padStart(14)} | ${speedup}x`);
    });
  }

  private async runRealQuantumGrover(): Promise<void> {
    try {
      // Create a real 3-qubit Grover circuit
      const circuit = new QuantumCircuit(3);
      
      // Initialize superposition
      circuit.addGate('h', 0);
      circuit.addGate('h', 1);
      circuit.addGate('h', 2);
      
      // Oracle: mark state |111⟩
      circuit.addGate('ccx', [0, 1, 2]); // Toffoli gate
      circuit.addGate('z', 2);
      circuit.addGate('ccx', [0, 1, 2]); // Undo Toffoli
      
      // Diffusion operator
      circuit.addGate('h', 0);
      circuit.addGate('h', 1);
      circuit.addGate('h', 2);
      circuit.addGate('x', 0);
      circuit.addGate('x', 1);
      circuit.addGate('x', 2);
      circuit.addGate('ccx', [0, 1, 2]);
      circuit.addGate('z', 2);
      circuit.addGate('ccx', [0, 1, 2]);
      circuit.addGate('x', 0);
      circuit.addGate('x', 1);
      circuit.addGate('x', 2);
      circuit.addGate('h', 0);
      circuit.addGate('h', 1);
      circuit.addGate('h', 2);
      
      // Run simulation
      circuit.run();
      const probabilities = circuit.probabilities();
      
      console.log('   🔬 Real quantum simulation results:');
      Object.entries(probabilities)
        .sort(([,a], [,b]) => b - a)
        .forEach(([state, prob]) => {
          const percentage = (prob * 100).toFixed(1);
          if (prob > 0.01) { // Only show significant probabilities
            console.log(`      |${state}⟩: ${percentage}%`);
          }
        });
      
      const targetProb = probabilities['111'] || 0;
      console.log(`   🎯 Target state |111⟩ probability: ${(targetProb * 100).toFixed(1)}%`);
      console.log(`   ✅ Expected ~85% for optimal Grover iteration`);
      
    } catch (error) {
      console.log('   ❌ Real quantum simulation failed:', error.message);
    }
  }

  private explainGroverAlgorithm(): void {
    console.log(`
   Grover's algorithm provides a quadratic speedup for searching unsorted databases:
   
   🔍 Classical Search:
   • Linear search through N items
   • Average case: N/2 queries
   • Worst case: N queries
   • Time complexity: O(N)
   
   ⚛️  Quantum Search (Grover):
   • Quantum superposition of all states
   • Amplitude amplification of target state
   • Optimal iterations: π√N/4
   • Time complexity: O(√N)
   
   🚀 Algorithm Steps:
   1. Initialize uniform superposition with Hadamard gates
   2. Apply oracle to mark target state (phase flip)
   3. Apply diffusion operator (amplitude amplification)
   4. Repeat steps 2-3 for π√N/4 iterations
   5. Measure to find target with high probability
   
   📈 Quantum Advantage:
   • For 1 million items: Classical ~500,000 vs Quantum ~785 queries
   • Speedup increases with database size: √N advantage
   • Proven optimal for unstructured search problems
   
   🎯 Applications:
   • Database search and lookup
   • Satisfiability problems (SAT)
   • Graph coloring and optimization
   • Cryptographic key search
   `);
  }

  private async cleanup(): Promise<void> {
    await this.builder.shutdown();
    await this.registry.shutdown();
  }
}

// CLI interface
async function runGroverSearchDemo(): Promise<void> {
  const demo = new GroverSearchDemo();
  await demo.runGroverDemo();
}

// Export for use in other modules
export { GroverSearchDemo, runGroverSearchDemo };

// Run demo if this file is executed directly
if (require.main === module) {
  runGroverSearchDemo().catch(console.error);
}