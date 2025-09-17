import { User, UserModel, CreateUserData, LoginCredentials } from '../models/User';
import { AuthMiddleware } from '../middleware/auth';

export interface AuthResponse {
  success: true;
  data: {
    user: Omit<User, 'passwordHash'>;
    token: string;
  };
}

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
  timestamp: Date;
}

export class AuthenticationService {
  // In-memory storage for demo - replace with database in production
  private static users: User[] = [];

  /**
   * Register a new user
   */
  static async registerUser(userData: CreateUserData): Promise<AuthResponse | AuthError> {
    try {
      // Check if user already exists
      const existingUser = this.users.find(u => u.email === userData.email.toLowerCase());
      if (existingUser) {
        return {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
            retryable: false
          },
          timestamp: new Date()
        };
      }

      // Create new user
      const newUserData = await UserModel.createUser(userData);
      const passwordHash = await UserModel.hashPassword(userData.password);
      
      const fullUser: User = {
        ...newUserData,
        passwordHash
      };

      // Store user (in production, save to database)
      this.users.push(fullUser);

      // Generate token
      const token = AuthMiddleware.generateToken(fullUser.id, fullUser.email);

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = fullUser;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message,
          retryable: false
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Authenticate user login
   */
  static async authenticateUser(credentials: LoginCredentials): Promise<AuthResponse | AuthError> {
    try {
      // Find user by email
      const user = this.users.find(u => u.email === credentials.email.toLowerCase());
      if (!user) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            retryable: false
          },
          timestamp: new Date()
        };
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(credentials.password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            retryable: false
          },
          timestamp: new Date()
        };
      }

      // Generate token
      const token = AuthMiddleware.generateToken(user.id, user.email);

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message,
          retryable: true
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get user by ID (for authenticated requests)
   */
  static async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user credits (used by credit management system)
   */
  static async updateUserCredits(userId: string, newCredits: number): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    this.users[userIndex].credits = newCredits;
    return true;
  }

  /**
   * Get all users (for testing purposes)
   */
  static getAllUsers(): Omit<User, 'passwordHash'>[] {
    return this.users.map(user => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Clear all users (for testing purposes)
   */
  static clearAllUsers(): void {
    this.users = [];
  }
}