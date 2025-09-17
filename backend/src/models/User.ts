import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  credits: number;
  subscriptionStatus: 'free' | 'premium';
  subscriptionExpiry?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class UserModel {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a plain text password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a plain text password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): boolean {
    // At least 8 characters, contains letter and number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Create a new user object with hashed password
   */
  static async createUser(userData: CreateUserData): Promise<Omit<User, 'passwordHash'>> {
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isValidPassword(userData.password)) {
      throw new Error('Password must be at least 8 characters with letters and numbers');
    }

    const passwordHash = await this.hashPassword(userData.password);
    const user: User = {
      id: this.generateUserId(),
      email: userData.email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
      credits: 10, // Initial free credits as per requirement 7.1
      subscriptionStatus: 'free',
    };

    // Return user without password hash for security
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Generate a unique user ID
   */
  private static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}