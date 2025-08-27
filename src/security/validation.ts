
/**
 * Input Validation and Sanitization
 */
import { z } from 'zod';

export const ValidationSchemas = {
  quantumCircuit: z.object({
    gates: z.array(z.object({
      type: z.enum(['H', 'X', 'Y', 'Z', 'CNOT', 'RX', 'RY', 'RZ']),
      qubits: z.array(z.number().int().min(0).max(100)),
      params: z.array(z.number()).optional()
    })),
    qubits: z.number().int().min(1).max(100)
  }),
  
  userInput: z.object({
    query: z.string().min(1).max(1000).regex(/^[a-zA-Z0-9s-_.,:;!?()]+$/),
    code: z.string().max(10000)
  })
};

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, input: any): T {
  const sanitized = typeof input === 'string' ? sanitizeInput(input) : input;
  return schema.parse(sanitized);
}
