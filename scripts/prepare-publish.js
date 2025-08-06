#!/usr/bin/env node

/**
 * Prepare for npm publish
 * This script performs final checks before publishing to npm
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, silent = false) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output;
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

async function checkPrerequisites() {
  log('\n📋 Checking Prerequisites...', colors.cyan);
  
  // Check Node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    throw new Error(`Node.js 18+ required. Current: ${nodeVersion}`);
  }
  log(`✓ Node.js ${nodeVersion}`, colors.green);
  
  // Check npm login
  try {
    const whoami = exec('npm whoami', true).trim();
    log(`✓ Logged in to npm as: ${whoami}`, colors.green);
  } catch {
    log('✗ Not logged in to npm. Run: npm login', colors.red);
    process.exit(1);
  }
  
  // Check git status
  try {
    const status = exec('git status --porcelain', true);
    if (status.trim()) {
      log('⚠ Uncommitted changes detected', colors.yellow);
      log('  Consider committing before publishing', colors.yellow);
    } else {
      log('✓ Git working directory clean', colors.green);
    }
  } catch (error) {
    log('⚠ Git check failed', colors.yellow);
  }
}

async function runTests() {
  log('\n🧪 Running Tests...', colors.cyan);
  
  try {
    exec('npm run test:unit', true);
    log('✓ Unit tests passed', colors.green);
  } catch {
    log('✗ Unit tests failed', colors.red);
    process.exit(1);
  }
  
  try {
    exec('npm run lint', true);
    log('✓ Linting passed', colors.green);
  } catch {
    log('✗ Linting failed', colors.red);
    process.exit(1);
  }
}

async function buildProject() {
  log('\n🔨 Building Project...', colors.cyan);
  
  try {
    exec('npm run clean', true);
    exec('npm run build', true);
    log('✓ Build successful', colors.green);
    
    // Verify dist exists
    const distPath = path.join(rootDir, 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('dist directory not created');
    }
    
    // Check main entry point
    const mainFile = path.join(distPath, 'index.js');
    if (!fs.existsSync(mainFile)) {
      throw new Error('Main entry point not found');
    }
    
    log('✓ Distribution files verified', colors.green);
  } catch (error) {
    log(`✗ Build failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

async function checkPackageJson() {
  log('\n📦 Checking package.json...', colors.cyan);
  
  const packagePath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check required fields
  const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'license', 'engines'];
  const missingFields = requiredFields.filter(field => !pkg[field]);
  
  if (missingFields.length > 0) {
    log(`✗ Missing required fields: ${missingFields.join(', ')}`, colors.red);
    process.exit(1);
  }
  
  log(`✓ Package name: ${pkg.name}`, colors.green);
  log(`✓ Version: ${pkg.version}`, colors.green);
  log(`✓ License: ${pkg.license}`, colors.green);
  
  // Check files field
  if (!pkg.files || pkg.files.length === 0) {
    log('⚠ No "files" field specified, all files will be published', colors.yellow);
  }
  
  // Check repository
  if (!pkg.repository) {
    log('⚠ No repository field specified', colors.yellow);
  }
}

async function checkFiles() {
  log('\n📄 Checking Required Files...', colors.cyan);
  
  const requiredFiles = [
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    'package.json',
    'dist/index.js'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      log(`✓ ${file}`, colors.green);
    } else {
      log(`✗ Missing: ${file}`, colors.red);
      process.exit(1);
    }
  }
}

async function performDryRun() {
  log('\n🎭 Performing Dry Run...', colors.cyan);
  
  try {
    const output = exec('npm publish --dry-run', true);
    const lines = output.split('\n');
    const tarballLine = lines.find(line => line.includes('npm notice filename:'));
    if (tarballLine) {
      log('✓ Dry run successful', colors.green);
    }
    
    // Extract package size
    const sizeLine = lines.find(line => line.includes('package size:'));
    if (sizeLine) {
      log(`  ${sizeLine.trim()}`, colors.blue);
    }
    
    // Extract unpacked size
    const unpackedLine = lines.find(line => line.includes('unpacked size:'));
    if (unpackedLine) {
      log(`  ${unpackedLine.trim()}`, colors.blue);
    }
    
    // File count
    const fileCountLine = lines.find(line => line.includes('total files:'));
    if (fileCountLine) {
      log(`  ${fileCountLine.trim()}`, colors.blue);
    }
  } catch (error) {
    log('✗ Dry run failed', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

async function main() {
  log('\n🚀 DevXP CLI - Pre-Publish Checks', colors.magenta);
  log('==================================', colors.magenta);
  
  try {
    await checkPrerequisites();
    await checkPackageJson();
    await runTests();
    await buildProject();
    await checkFiles();
    await performDryRun();
    
    log('\n✅ All checks passed!', colors.green);
    log('\nReady to publish. Run:', colors.cyan);
    log('  npm publish', colors.yellow);
    log('\nOr use release scripts:', colors.cyan);
    log('  npm run release       (patch)', colors.yellow);
    log('  npm run release:minor (minor)', colors.yellow);
    log('  npm run release:major (major)', colors.yellow);
    
  } catch (error) {
    log('\n❌ Pre-publish checks failed!', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as preparePublish };
