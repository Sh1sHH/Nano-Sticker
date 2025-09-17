// Global teardown for comprehensive test suite
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up comprehensive test environment...');
  
  // Calculate total test execution time
  const endTime = performance.now();
  const startTime = global.__TEST_SUITE_START_TIME__ || endTime;
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`⏱️  Total test suite execution time: ${totalDuration}s`);
  
  // Generate performance report
  if (global.__PERFORMANCE_METRICS__) {
    const performanceReport = {
      totalDuration: `${totalDuration}s`,
      apiCalls: global.__PERFORMANCE_METRICS__.apiCalls.length,
      imageProcessing: global.__PERFORMANCE_METRICS__.imageProcessing.length,
      databaseQueries: global.__PERFORMANCE_METRICS__.databaseQueries.length,
      averageApiResponseTime: calculateAverageResponseTime(global.__PERFORMANCE_METRICS__.apiCalls),
      slowestApiCall: findSlowestCall(global.__PERFORMANCE_METRICS__.apiCalls),
      memoryUsage: process.memoryUsage(),
    };
    
    try {
      const reportPath = path.join(process.cwd(), 'coverage', 'comprehensive', 'performance-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(performanceReport, null, 2));
      console.log('📊 Performance report saved to coverage/comprehensive/performance-report.json');
    } catch (error) {
      console.warn('⚠️  Failed to save performance report:', error.message);
    }
  }
  
  // Generate mock service usage report
  if (global.__MOCK_VERTEX_AI_CALLS__) {
    const mockServiceReport = {
      vertexAICalls: global.__MOCK_VERTEX_AI_CALLS__.length,
      storageOperations: global.__MOCK_STORAGE_OPERATIONS__.length,
      monitoringMetrics: global.__MOCK_MONITORING_METRICS__.length,
      paymentValidations: global.__MOCK_PAYMENT_VALIDATIONS__.length,
      subscriptionChecks: global.__MOCK_SUBSCRIPTION_CHECKS__.length,
    };
    
    console.log('🔧 Mock service usage summary:');
    console.log(`   Vertex AI calls: ${mockServiceReport.vertexAICalls}`);
    console.log(`   Storage operations: ${mockServiceReport.storageOperations}`);
    console.log(`   Monitoring metrics: ${mockServiceReport.monitoringMetrics}`);
    console.log(`   Payment validations: ${mockServiceReport.paymentValidations}`);
    console.log(`   Subscription checks: ${mockServiceReport.subscriptionChecks}`);
  }
  
  // Clean up test data
  if (global.__TEST_CLEANUP_REGISTRY__) {
    console.log('🗑️  Cleaning up test data...');
    
    for (const cleanupFn of global.__TEST_CLEANUP_REGISTRY__) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn('⚠️  Cleanup function failed:', error.message);
      }
    }
    
    console.log(`✅ Cleaned up ${global.__TEST_CLEANUP_REGISTRY__.length} test resources`);
  }
  
  // Clean up temporary files
  try {
    const tempDir = path.join(process.cwd(), 'temp', 'test-files');
    await fs.rmdir(tempDir, { recursive: true });
    console.log('🗂️  Temporary test files cleaned up');
  } catch (error) {
    // Ignore if temp directory doesn't exist
  }
  
  // Memory usage report
  const memoryUsage = process.memoryUsage();
  console.log('💾 Final memory usage:');
  console.log(`   RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
  
  // Final cleanup
  delete global.__TEST_SUITE_START_TIME__;
  delete global.__PERFORMANCE_METRICS__;
  delete global.__MOCK_VERTEX_AI_CALLS__;
  delete global.__MOCK_STORAGE_OPERATIONS__;
  delete global.__MOCK_MONITORING_METRICS__;
  delete global.__MOCK_PAYMENT_VALIDATIONS__;
  delete global.__MOCK_SUBSCRIPTION_CHECKS__;
  delete global.__TEST_CLEANUP_REGISTRY__;
  
  console.log('✅ Comprehensive test environment cleanup completed');
};

function calculateAverageResponseTime(apiCalls) {
  if (!apiCalls || apiCalls.length === 0) return 0;
  
  const totalTime = apiCalls.reduce((sum, call) => sum + (call.responseTime || 0), 0);
  return (totalTime / apiCalls.length).toFixed(2);
}

function findSlowestCall(apiCalls) {
  if (!apiCalls || apiCalls.length === 0) return null;
  
  return apiCalls.reduce((slowest, call) => {
    if (!slowest || (call.responseTime || 0) > (slowest.responseTime || 0)) {
      return call;
    }
    return slowest;
  }, null);
}