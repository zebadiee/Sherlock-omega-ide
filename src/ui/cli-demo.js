/**
 * CLI Demo Script - Automated demonstration of Sherlock Ω CLI
 */

const { spawn } = require('child_process');

async function runCLIDemo() {
  console.log('🎬 SHERLOCK Ω CLI DEMO');
  console.log('='.repeat(50));
  console.log();

  // Simulate CLI commands
  const commands = [
    'help',
    'status', 
    'start',
    'status',
    'evolve Add user authentication with comprehensive tests',
    'evolve Add payment processing without tests',
    'evolve Implement complex machine learning algorithm',
    'evolve Add simple utility function with tests',
    'list',
    'validate',
    'monitor',
    'safe-mode',
    'evolve Test evolution in safe mode',
    'safe-mode',
    'stop',
    'exit'
  ];

  console.log('📝 Demo Commands:');
  commands.forEach((cmd, i) => {
    console.log(`  ${i + 1}. ${cmd}`);
  });
  
  console.log();
  console.log('🚀 To run the interactive CLI:');
  console.log('   node src/ui/sherlock-cli.js');
  console.log();
  console.log('💡 Try these commands in the interactive CLI:');
  console.log('   - start (to start the system)');
  console.log('   - evolve Add safe feature with tests');
  console.log('   - evolve Add risky feature without tests');
  console.log('   - list (to see evolution history)');
  console.log('   - safe-mode (to toggle safe mode)');
  console.log('   - status (to see system status)');
  console.log('   - help (to see all commands)');
  console.log();
}

runCLIDemo().catch(console.error);