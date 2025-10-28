// Simple script to test if server starts
const { execSync } = require('child_process');
const path = require('path');

console.log('Testing backend server startup...');

try {
  execSync('node server.js', {
    cwd: path.join(__dirname, 'backend'),
    timeout: 5000,
    stdio: 'pipe'
  });
  console.log('Server started successfully!');
} catch (error) {
  console.error('Server failed to start:', error.message);
  if (error.stdout) {
    console.log('STDOUT:', error.stdout.toString());
  }
  if (error.stderr) {
    console.log('STDERR:', error.stderr.toString());
  }
}