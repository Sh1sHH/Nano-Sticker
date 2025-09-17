import { Request, Response, NextFunction } from 'express';
import { ValidationMiddleware, commonValidations } from '../../middleware/validation';
import { ErrorHandler } from '../../middleware/errorHandler';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { fail } from 'assert';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { fail } from 'assert';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock ErrorHandler
jest.mock('../../middleware/errorHandler', () => ({
  ErrorHandler: {
    validationError: jest.fn((message, details) => {
      const error = new Error(message);
      (error as any).details = details;
      return error;
    }),
  },
}));

describe('ValidationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('passes validation when all rules are satisfied', () => {
      mockRequest.body = { name: 'John Doe', age: 25 };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'name', required: true, type: 'string', minLength: 2 },
        { field: 'age', required: true, type: 'number', min: 18 },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });

    it('throws validation error when required field is missing', () => {
      mockRequest.body = { age: 25 };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'name', required: true, type: 'string' },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('throws validation error when type is incorrect', () => {
      mockRequest.body = { age: 'twenty-five' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'age', required: true, type: 'number' },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('throws validation error when string is too short', () => {
      mockRequest.body = { name: 'A' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'name', required: true, type: 'string', minLength: 2 },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('throws validation error when string is too long', () => {
      mockRequest.body = { name: 'A'.repeat(101) };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'name', required: true, type: 'string', maxLength: 100 },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('throws validation error when number is too small', () => {
      mockRequest.body = { age: 15 };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'age', required: true, type: 'number', min: 18 },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('throws validation error when number is too large', () => {
      mockRequest.body = { age: 150 };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'age', required: true, type: 'number', max: 120 },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('throws validation error when pattern does not match', () => {
      mockRequest.body = { code: 'invalid-code!' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'code', required: true, type: 'string', pattern: /^[a-zA-Z0-9-]+$/ },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('throws validation error when custom validation fails', () => {
      mockRequest.body = { password: 'weak' };
      
      const middleware = ValidationMiddleware.validate([
        { 
          field: 'password', 
          required: true, 
          type: 'string',
          custom: (value) => value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value)
        },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('returns custom error message from custom validation', () => {
      mockRequest.body = { password: 'weak' };
      
      const middleware = ValidationMiddleware.validate([
        { 
          field: 'password', 
          required: true, 
          type: 'string',
          custom: (value) => value.length >= 8 ? true : 'Password must be at least 8 characters'
        },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('validates email format', () => {
      mockRequest.body = { email: 'invalid-email' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'email', required: true, type: 'email' },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('validates URL format', () => {
      mockRequest.body = { website: 'not-a-url' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'website', required: true, type: 'url' },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('validates boolean type', () => {
      mockRequest.body = { active: 'true' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'active', required: true, type: 'boolean' },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).toThrow();
    });

    it('skips validation for optional empty fields', () => {
      mockRequest.body = { name: 'John' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'name', required: true, type: 'string' },
        { field: 'nickname', required: false, type: 'string', minLength: 2 },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });

    it('validates data from query and params', () => {
      mockRequest.query = { limit: '10' };
      mockRequest.params = { id: 'user123' };
      
      const middleware = ValidationMiddleware.validate([
        { field: 'limit', required: true, type: 'string' },
        { field: 'id', required: true, type: 'string', pattern: /^user\d+$/ },
      ]);

      expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('email validation', () => {
    it('accepts valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        mockRequest.body = { email };
        const middleware = ValidationMiddleware.validate([commonValidations.email]);
        
        expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).not.toThrow();
      });
    });

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
      ];

      invalidEmails.forEach(email => {
        mockRequest.body = { email };
        const middleware = ValidationMiddleware.validate([commonValidations.email]);
        
        try {
          middleware(mockRequest as Request, mockResponse as Response, mockNext);
          fail(`Expected validation to fail for email: ${email}`);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('URL validation', () => {
    it('accepts valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://api.example.com/v1/users',
      ];

      validUrls.forEach(url => {
        mockRequest.body = { website: url };
        const middleware = ValidationMiddleware.validate([
          { field: 'website', required: true, type: 'url' }
        ]);
        
        expect(() => middleware(mockRequest as Request, mockResponse as Response, mockNext)).not.toThrow();
      });
    });

    it('rejects invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'http://',
        'invalid-url-format',
      ];

      invalidUrls.forEach(url => {
        mockRequest.body = { website: url };
        const middleware = ValidationMiddleware.validate([
          { field: 'website', required: true, type: 'url' }
        ]);
        
        try {
          middleware(mockRequest as Request, mockResponse as Response, mockNext);
          fail(`Expected validation to fail for URL: ${url}`);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });
});

describe('commonValidations', () => {
  it('defines email validation rule', () => {
    expect(commonValidations.email).toEqual({
      field: 'email',
      required: true,
      type: 'email',
      maxLength: 255,
    });
  });

  it('defines password validation rule', () => {
    expect(commonValidations.password).toEqual({
      field: 'password',
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
    });
  });

  it('defines userId validation rule', () => {
    expect(commonValidations.userId).toEqual({
      field: 'userId',
      required: true,
      type: 'string',
      pattern: /^[a-zA-Z0-9-_]+$/,
    });
  });

  it('defines creditAmount validation rule', () => {
    expect(commonValidations.creditAmount).toEqual({
      field: 'amount',
      required: true,
      type: 'number',
      min: 1,
      max: 10000,
    });
  });

  it('defines imageFile validation rule with custom validation', () => {
    expect(commonValidations.imageFile.field).toBe('image');
    expect(commonValidations.imageFile.required).toBe(true);
    expect(typeof commonValidations.imageFile.custom).toBe('function');
  });
});