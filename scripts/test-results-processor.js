// Test results processor for comprehensive test suite
const fs = require('fs').promises;
const path = require('path');

module.exports = async (results) => {
  console.log('\n📋 Processing comprehensive test results...');
  
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.numTotalTests,
    passedTests: results.numPassedTests,
    failedTests: results.numFailedTests,
    skippedTests: results.numPendingTests,
    testSuites: results.numTotalTestSuites,
    passedTestSuites: results.numPassedTestSuites,
    failedTestSuites: results.numFailedTestSuites,
    executionTime: `${(results.testResults.reduce((sum, result) => sum + result.perfStats.end - result.perfStats.start, 0) / 1000).toFixed(2)}s`,
    coverage: results.coverageMap ? {
      statements: results.coverageMap.getCoverageSummary().statements.pct,
      branches: results.coverageMap.getCoverageSummary().branches.pct,
      functions: results.coverageMap.getCoverageSummary().functions.pct,
      lines: results.coverageMap.getCoverageSummary().lines.pct,
    } : null,
  };
  
  // Categorize test results by type
  const testCategories = {
    'End-to-End Tests': [],
    'Performance Tests': [],
    'Security Tests': [],
    'Load Tests': [],
    'Cost Monitoring Tests': [],
    'Integration Tests': [],
  };
  
  results.testResults.forEach(testResult => {
    const testPath = testResult.testFilePath;
    let category = 'Other';
    
    if (testPath.includes('/e2e/')) category = 'End-to-End Tests';
    else if (testPath.includes('/performance/')) category = 'Performance Tests';
    else if (testPath.includes('/security/')) category = 'Security Tests';
    else if (testPath.includes('/load/')) category = 'Load Tests';
    else if (testPath.includes('/monitoring/')) category = 'Cost Monitoring Tests';
    else if (testPath.includes('/integration/')) category = 'Integration Tests';
    
    if (!testCategories[category]) testCategories[category] = [];
    
    testCategories[category].push({
      testFile: path.basename(testPath),
      passed: testResult.numPassingTests,
      failed: testResult.numFailingTests,
      skipped: testResult.numPendingTests,
      duration: `${((testResult.perfStats.end - testResult.perfStats.start) / 1000).toFixed(2)}s`,
      failureMessages: testResult.testResults
        .filter(test => test.status === 'failed')
        .map(test => ({
          testName: test.fullName,
          message: test.failureMessages[0]?.split('\n')[0] || 'Unknown error',
        })),
    });
  });
  
  // Generate detailed report
  const detailedReport = {
    summary,
    categoryBreakdown: testCategories,
    failedTests: results.testResults
      .filter(result => result.numFailingTests > 0)
      .map(result => ({
        file: path.basename(result.testFilePath),
        failures: result.testResults
          .filter(test => test.status === 'failed')
          .map(test => ({
            name: test.fullName,
            error: test.failureMessages[0]?.split('\n')[0] || 'Unknown error',
          })),
      })),
    performanceMetrics: {
      slowestTests: results.testResults
        .map(result => ({
          file: path.basename(result.testFilePath),
          duration: result.perfStats.end - result.perfStats.start,
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(test => ({
          ...test,
          duration: `${(test.duration / 1000).toFixed(2)}s`,
        })),
    },
  };
  
  // Save detailed report
  try {
    const reportDir = path.join(process.cwd(), 'coverage', 'comprehensive');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'test-results-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2));
    
    console.log(`📊 Detailed test report saved to: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️  Failed to save detailed test report:', error.message);
  }
  
  // Print summary to console
  console.log('\n' + '='.repeat(60));
  console.log('📈 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`✅ Passed: ${summary.passedTests}`);
  console.log(`❌ Failed: ${summary.failedTests}`);
  console.log(`⏭️  Skipped: ${summary.skippedTests}`);
  console.log(`⏱️  Execution Time: ${summary.executionTime}`);
  
  if (summary.coverage) {
    console.log('\n📊 Code Coverage:');
    console.log(`   Statements: ${summary.coverage.statements.toFixed(1)}%`);
    console.log(`   Branches: ${summary.coverage.branches.toFixed(1)}%`);
    console.log(`   Functions: ${summary.coverage.functions.toFixed(1)}%`);
    console.log(`   Lines: ${summary.coverage.lines.toFixed(1)}%`);
  }
  
  console.log('\n📋 Test Categories:');
  Object.entries(testCategories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const totalPassed = tests.reduce((sum, test) => sum + test.passed, 0);
      const totalFailed = tests.reduce((sum, test) => sum + test.failed, 0);
      console.log(`   ${category}: ${totalPassed} passed, ${totalFailed} failed`);
    }
  });
  
  if (detailedReport.failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    detailedReport.failedTests.forEach(failedTest => {
      console.log(`   ${failedTest.file}:`);
      failedTest.failures.forEach(failure => {
        console.log(`     - ${failure.name}: ${failure.error}`);
      });
    });
  }
  
  console.log('\n🐌 Slowest Tests:');
  detailedReport.performanceMetrics.slowestTests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.file}: ${test.duration}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Return the original results for Jest
  return results;
};