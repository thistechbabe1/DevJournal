const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '>> Starting DevJournal development environment...');
console.log('\x1b[90m%s\x1b[0m', '   - Backend API:  http://localhost:5000');
console.log('\x1b[90m%s\x1b[0m', '   - Frontend App: http://localhost:4200');
console.log('');

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit',
  shell: true,
});

const frontend = spawn(npmCmd, ['start'], {
  cwd: path.join(__dirname, '..', 'frontend'),
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', '>> Shutting down DevJournal servers...');
  if (isWin) {
    if (backend.pid) spawn('taskkill', ['/pid', backend.pid, '/f', '/t']);
    if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
  } else {
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
