// test/quantum-stub.ts - Quantum circuit simulator stub for testing
export class QuantumStub {
  private qubits: number;
  private gates: Array<{ type: string; target: number; control?: number }> = [];

  constructor(qubits: number = 4) {
    this.qubits = qubits;
  }

  // Inefficient nested loop simulation (intentionally slow for testing)
  simulate(iterations: number = 1000): number {
    let result = 0;
    
    // Nested loops create O(n²) complexity for testing optimization
    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < iterations; j++) {
        // Simulate quantum gate operations
        result += this.simulateGateOperation(i, j);
        
        // Additional nested computation for complexity
        for (let k = 0; k < this.qubits; k++) {
          result += Math.sin(i * j * k) * Math.cos(i + j + k);
        }
      }
    }
    
    return result;
  }

  private simulateGateOperation(qubit1: number, qubit2: number): number {
    // Simulate quantum gate with complex calculations
    const phase = (qubit1 * qubit2) % (2 * Math.PI);
    return Math.cos(phase) + Math.sin(phase);
  }

  // Hadamard gate simulation
  hadamard(qubit: number): void {
    this.gates.push({ type: 'H', target: qubit });
  }

  // CNOT gate simulation  
  cnot(control: number, target: number): void {
    this.gates.push({ type: 'CNOT', control, target });
  }

  // Measure all qubits
  measure(): number[] {
    const results: number[] = [];
    for (let i = 0; i < this.qubits; i++) {
      results.push(Math.random() > 0.5 ? 1 : 0);
    }
    return results;
  }

  // Get circuit depth (for optimization analysis)
  getCircuitDepth(): number {
    return this.gates.length;
  }

  // Reset circuit
  reset(): void {
    this.gates = [];
  }
}

export default QuantumStub;