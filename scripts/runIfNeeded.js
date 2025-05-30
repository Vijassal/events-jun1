const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const tsPath = path.resolve(require('os').homedir(), 'last_exchange_update.txt');
const logPath = path.resolve(require('os').homedir(), 'exchange_rate_cron.log');
const scriptPath = path.resolve(__dirname, 'scripts', 'updateExchangeRates.js');

function log(msg) {
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
}

function needsUpdate() {
  if (!fs.existsSync(tsPath)) return true;
  const last = new Date(fs.readFileSync(tsPath, 'utf8').trim());
  if (isNaN(last.getTime())) return true;
  const now = new Date();
  return (now - last) > 24 * 60 * 60 * 1000;
}

if (needsUpdate()) {
  log('Exchange rate update needed. Running updateExchangeRates.js...');
  const result = spawnSync('node', [scriptPath], { stdio: 'inherit' });
  log(`Update script exited with code ${result.status}`);
} else {
  log('Exchange rate update not needed. Last update was within 24 hours.');
} 