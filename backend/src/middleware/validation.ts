import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from './errorHandler';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export class ValidationMiddleware {
  public static validate(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors: string[] = [];
      const data = { ...req.body, ...req.query, ...req.params };

      for (const rule of rules) {
        const value = data[rule.field];
        const fieldError = this.validateField(rule, value);
        
        if (fieldError) {
          errors.push(fieldError);
        }
      }

      if (errors.length > 0) {
        throw ErrorHandler.validationError('Validation failed', { errors });
      }

      next();
    };
  }

  private static validateField(rule: ValidationRule, value: any): string | null {
    const { field, required, type, minLength, maxLength, min, max, pattern, custom } = rule;

    // Check required
    if (required && (value === undefined || value === null || value === '')) {
      return `${field} is required`;
    }

    // Skip further validation if value is empty and not required
    if (!required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type validation
    if (type) {
      const typeError = this.validateType(field, value, type);
      if (typeError) return typeError;
    }

    // String validations
    if (typeof value === 'string') {
      if (minLength !== undefined && value.length < minLength) {
        return `${field} must be at least ${minLength} characters long`;
      }
      if (maxLength !== undefined && value.length > maxLength) {
        return `${field} must be no more than ${maxLength} characters long`;
      }
      if (pattern && !pattern.test(value)) {
        return `${field} format is invalid`;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        return `${field} must be at least ${min}`;
      }
      if (max !== undefined && value > max) {
        return `${field} must be no more than ${max}`;
      }
    }

    // Custom validation
    if (custom) {
      const customResult = custom(value);
      if (typeof customResult === 'string') {
        return customResult;
      }
      if (customResult === false) {
        return `${field} is invalid`;
      }
    }

    return null;
  }

  private static validateType(field: string, value: any, type: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} must be a valid number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field} must be a boolean`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return `${field} must be a valid email address`;
        }
        break;
      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return `${field} must be a valid URL`;
        }
        break;
    }
    return null;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Common validation rules
export const commonValidations = {
  email: {
    field: 'email',
    required: true,
    type: 'email' as const,
    maxLength: 255,
  },
  password: {
    field: 'password',
    required: true,
    type: 'string' as const,
    minLength: 8,
    maxLength: 128,
  },
  userId: {
    field: 'userId',
    required: true,
    type: 'string' as const,
    pattern: /^[a-zA-Z0-9-_]+$/,
  },
  creditAmount: {
    field: 'amount',
    required: true,
    type: 'number' as const,
    min: 1,
    max: 10000,
  },
  imageFile: {
    field: 'image',
    required: true,
    custom: (value: any) => {
      if (!value || !value.mimetype) {
        return 'Image file is required';
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];
      if (!allowedTypes.includes(value.mimetype)) {
        return 'Only JPEG, PNG, and HEIC images are supported';
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (value.size > maxSize) {
        return 'Image file must be smaller than 10MB';
      }
      return true;
    },
  },
};