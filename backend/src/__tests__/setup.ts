// Test setup file
import { AuthenticationService } from '../services/AuthenticationService';

// Clear users before each test
beforeEach(() => {
  AuthenticationService.clearAllUsers();
});

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';