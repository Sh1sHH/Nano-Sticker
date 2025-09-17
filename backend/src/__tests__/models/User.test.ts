import { UserModel } from '../../models/User';

describe('UserModel', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await UserModel.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await UserModel.hashPassword(password);
      const hash2 = await UserModel.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await UserModel.hashPassword(password);
      
      const isValid = await UserModel.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const hash = await UserModel.hashPassword(password);
      
      const isValid = await UserModel.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(UserModel.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(UserModel.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'password123',
        'MyPassword1',
        'Test123@#$'
      ];

      validPasswords.forEach(password => {
        expect(UserModel.isValidPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'short',
        'onlyletters',
        '12345678',
        'NoNumber',
        'nonumber'
      ];

      invalidPasswords.forEach(password => {
        expect(UserModel.isValidPassword(password)).toBe(false);
      });
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testPassword123'
      };

      const user = await UserModel.createUser(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.credits).toBe(10); // Initial free credits
      expect(user.subscriptionStatus).toBe('free');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('should normalize email to lowercase', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'testPassword123'
      };

      const user = await UserModel.createUser(userData);
      expect(user.email).toBe('test@example.com');
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'testPassword123'
      };

      await expect(UserModel.createUser(userData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak'
      };

      await expect(UserModel.createUser(userData)).rejects.toThrow('Password must be at least 8 characters');
    });
  });
});