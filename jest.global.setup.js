// Global setup for comprehensive test suite
const { performance } = require('perf_hooks');

module.exports = async () => {
  console.log('🚀 Setting up comprehensive test environment...');
  
  // Record test suite start time
  global.__TEST_SUITE_START_TIME__ = performance.now();
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
  process.env.VERTEX_AI_LOCATION = 'us-central1';
  
  // Mock external service endpoints
  process.env.VERTEX_AI_ENDPOINT = 'https://mock-vertex-ai.googleapis.com';
  process.env.GOOGLE_CLOUD_STORAGE_BUCKET = 'test-sticker-storage';
  
  // Database configuration for testing
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  
  // Payment service configuration
  process.env.APPLE_SHARED_SECRET = 'test-apple-secret';
  process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = 'test-google-service-account.json';
  
  // Rate limiting configuration
  process.env.RATE_LIMIT_WINDOW_MS = '60000'; // 1 minute
  process.env.RATE_LIMIT_MAX_REQUESTS = '100';
  
  // Cost monitoring thresholds
  process.env.DAILY_COST_ALERT_THRESHOLD = '10.00';
  process.env.MONTHLY_COST_ALERT_THRESHOLD = '200.00';
  
  // Initialize test database (if needed)
  try {
    // This would typically initialize a test database
    console.log('📊 Initializing test database...');
    // await initializeTestDatabase();
  } catch (error) {
    console.warn('⚠️  Test database initialization skipped:', error.message);
  }
  
  // Initialize mock services
  console.log('🔧 Initializing mock services...');
  
  // Mock Google Cloud services
  global.__MOCK_VERTEX_AI_CALLS__ = [];
  global.__MOCK_STORAGE_OPERATIONS__ = [];
  global.__MOCK_MONITORING_METRICS__ = [];
  
  // Mock payment service calls
  global.__MOCK_PAYMENT_VALIDATIONS__ = [];
  global.__MOCK_SUBSCRIPTION_CHECKS__ = [];
  
  // Performance tracking
  global.__PERFORMANCE_METRICS__ = {
    apiCalls: [],
    imageProcessing: [],
    databaseQueries: [],
  };
  
  // Test data cleanup registry
  global.__TEST_CLEANUP_REGISTRY__ = [];
  
  console.log('✅ Comprehensive test environment setup completed');
};