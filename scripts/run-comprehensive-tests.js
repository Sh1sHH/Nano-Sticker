#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running Comprehensive Test Suite for AI Sticker Generation');
console.log('=' .repeat(60));

const testSuites = [
  {
    name: 'End-to-End Tests',
    command: 'npm test -- --testPathPattern="e2e" --verbose',
    description: 'Complete user journey tests from photo selection to sticker export',
  },
  {
    name: 'Performance Tests',
    command: 'npm test -- --testPathPattern="performance" --verbose',
    description: 'Image processing performance and optimization tests',
  },
  {
    name: 'Security Tests',
    command: 'cd backend && npm test -- --testPathPattern="security" --verbose',
    description: 'Authentication and payment security validation',
  },
  {
    name: 'Load Tests',
    command: 'cd backend && npm test -- --testPathPattern="load" --verbose',
    description: 'API load testing and concurrent request handling',
  },
  {
    name: 'Cost Monitoring Tests',
    command: 'cd backend && npm test -- --testPathPattern="monitoring" --verbose',
    description: 'AI API usage tracking and cost optimization',
  },
  {
    name: 'Integration Tests',
    command: 'cd backend && npm test -- --testPathPattern="integration" --verbose',
    description: 'Backend API integration with external services',
  },
];

const results = [];

async function runTestSuite(suite) {
  console.log(`\n📋 Running ${suite.name}...`);
  console.log(`   ${suite.description}`);
  console.log('-'.repeat(50));

  try {
    const startTime = Date.now();
    
    execSync(suite.command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ ${suite.name} completed successfully in ${duration}s`);
    
    results.push({
      name: suite.name,
      status: 'PASSED',
      duration: `${duration}s`,
    });
    
  } catch (error) {
    console.log(`❌ ${suite.name} failed`);
    console.error(error.message);
    
    results.push({
      name: suite.name,
      status: 'FAILED',
      error: error.message,
    });
  }
}

async function runAllTests() {
  console.log('Starting comprehensive test execution...\n');
  
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration})` : '';
    console.log(`${icon} ${result.name}${duration}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error.split('\n')[0]}`);
    }
  });
  
  console.log('\n' + '-'.repeat(40));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All comprehensive tests passed successfully!');
    console.log('\nThe AI Sticker Generation system is ready for production deployment.');
  }
}

// Add performance monitoring
function measureTestPerformance() {
  const totalStartTime = Date.now();
  
  process.on('exit', () => {
    const totalEndTime = Date.now();
    const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total test execution time: ${totalDuration}s`);
  });
}

// Run the comprehensive test suite
measureTestPerformance();
runAllTests().catch(error => {
  console.error('Failed to run comprehensive tests:', error);
  process.exit(1);
});