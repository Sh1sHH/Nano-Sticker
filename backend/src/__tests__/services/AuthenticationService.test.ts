import { AuthenticationService } from '../../services/AuthenticationService';

describe('AuthenticationService', () => {
  describe('registerUser', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testPassword123'
      };

      const result = await AuthenticationService.registerUser(userData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('test@example.com');
        expect(result.data.user.credits).toBe(10);
        expect(result.data.user.subscriptionStatus).toBe('free');
        expect(result.data.token).toBeDefined();
        expect(result.data.user).not.toHaveProperty('passwordHash');
      }
    });

    it('should normalize email to lowercase', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'testPassword123'
      };

      const result = await AuthenticationService.registerUser(userData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('test@example.com');
      }
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testPassword123'
      };

      // Register first user
      await AuthenticationService.registerUser(userData);

      // Try to register same email again
      const result = await AuthenticationService.registerUser(userData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_EXISTS');
        expect(result.error.message).toBe('User with this email already exists');
      }
    });

    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'testPassword123'
      };

      const result = await AuthenticationService.registerUser(userData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('REGISTRATION_FAILED');
        expect(result.error.message).toBe('Invalid email format');
      }
    });

    it('should reject weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak'
      };

      const result = await AuthenticationService.registerUser(userData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('REGISTRATION_FAILED');
        expect(result.error.message).toContain('Password must be at least 8 characters');
      }
    });
  });

  describe('authenticateUser', () => {
    beforeEach(async () => {
      // Register a test user
      await AuthenticationService.registerUser({
        email: 'test@example.com',
        password: 'testPassword123'
      });
    });

    it('should authenticate user with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'testPassword123'
      };

      const result = await AuthenticationService.authenticateUser(credentials);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('test@example.com');
        expect(result.data.token).toBeDefined();
        expect(result.data.user).not.toHaveProperty('passwordHash');
      }
    });

    it('should handle case insensitive email login', async () => {
      const credentials = {
        email: 'TEST@EXAMPLE.COM',
        password: 'testPassword123'
      };

      const result = await AuthenticationService.authenticateUser(credentials);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('test@example.com');
      }
    });

    it('should reject incorrect email', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'testPassword123'
      };

      const result = await AuthenticationService.authenticateUser(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
        expect(result.error.message).toBe('Invalid email or password');
      }
    });

    it('should reject incorrect password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongPassword123'
      };

      const result = await AuthenticationService.authenticateUser(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
        expect(result.error.message).toBe('Invalid email or password');
      }
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const registerResult = await AuthenticationService.registerUser({
        email: 'test@example.com',
        password: 'testPassword123'
      });

      if (registerResult.success) {
        const userId = registerResult.data.user.id;
        const user = await AuthenticationService.getUserById(userId);

        expect(user).toBeDefined();
        expect(user?.id).toBe(userId);
        expect(user?.email).toBe('test@example.com');
        expect(user).not.toHaveProperty('passwordHash');
      }
    });

    it('should return null for non-existent user', async () => {
      const user = await AuthenticationService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('updateUserCredits', () => {
    it('should update user credits successfully', async () => {
      const registerResult = await AuthenticationService.registerUser({
        email: 'test@example.com',
        password: 'testPassword123'
      });

      if (registerResult.success) {
        const userId = registerResult.data.user.id;
        const success = await AuthenticationService.updateUserCredits(userId, 25);

        expect(success).toBe(true);

        const user = await AuthenticationService.getUserById(userId);
        expect(user?.credits).toBe(25);
      }
    });

    it('should return false for non-existent user', async () => {
      const success = await AuthenticationService.updateUserCredits('non-existent-id', 25);
      expect(success).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without password hashes', async () => {
      await AuthenticationService.registerUser({
        email: 'user1@example.com',
        password: 'password123'
      });
      await AuthenticationService.registerUser({
        email: 'user2@example.com',
        password: 'password123'
      });

      const users = AuthenticationService.getAllUsers();

      expect(users).toHaveLength(2);
      users.forEach(user => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user.email).toBeDefined();
        expect(user.id).toBeDefined();
      });
    });
  });
});