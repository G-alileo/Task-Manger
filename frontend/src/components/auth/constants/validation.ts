/**
 * Validation Constants
 * 
 * Centralized validation rules and configurations for authentication forms.
 * These constants ensure consistency across the application and make testing easier.
 */

/**
 * Password requirement configuration
 */
export interface PasswordRequirement {
  /** Unique identifier for the requirement */
  id: string;
  /** Whether the requirement is met */
  met: boolean;
  /** Short label for display */
  label: string;
  /** Detailed description of the requirement */
  description: string;
  /** Validation function to test password */
  validator: (password: string) => boolean;
}

/**
 * Password requirements definition
 */
export const PASSWORD_REQUIREMENTS: Omit<PasswordRequirement, 'met'>[] = [
  {
    id: 'length',
    label: '8+ characters',
    description: 'At least 8 characters long',
    validator: (password: string) => password.length >= 8,
  },
  {
    id: 'case',
    label: 'Uppercase & lowercase',
    description: 'Mix of upper and lowercase letters',
    validator: (password: string) => /[a-z]/.test(password) && /[A-Z]/.test(password),
  },
  {
    id: 'number',
    label: 'Numbers',
    description: 'At least one number',
    validator: (password: string) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'Special characters',
    description: 'At least one special character (!@#$%^&*)',
    validator: (password: string) => /[^a-zA-Z\d]/.test(password),
  },
];

/**
 * Username validation rules
 */
export const USERNAME_VALIDATION = {
  minLength: 3,
  maxLength: 150,
  pattern: /^[a-zA-Z0-9_-]+$/,
  errorMessages: {
    required: 'Username is required',
    minLength: 'Username must be at least 3 characters',
    maxLength: 'Username must be less than 150 characters',
    pattern: 'Username can only contain letters, numbers, underscores, and hyphens',
    spaces: 'Username cannot contain spaces',
  },
} as const;

/**
 * Email validation rules
 */
export const EMAIL_VALIDATION = {
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  errorMessages: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
    exists: 'This email is already registered. Try logging in or use a different email.',
  },
} as const;

/**
 * Password strength levels
 */
export const PASSWORD_STRENGTH = {
  WEAK: { level: 0, label: 'Too weak', color: '#ef4444' },
  FAIR: { level: 1, label: 'Weak', color: '#f59e0b' },
  GOOD: { level: 2, label: 'Fair', color: '#eab308' },
  STRONG: { level: 3, label: 'Good', color: '#22c55e' },
  VERY_STRONG: { level: 4, label: 'Strong', color: '#22c55e' },
} as const;

/**
 * Field validation configuration
 */
export const FIELD_VALIDATION = {
  firstName: {
    required: true,
    errorMessage: 'First name is required',
  },
  lastName: {
    required: true,
    errorMessage: 'Last name is required',
  },
  email: {
    required: true,
    errorMessage: 'Email is required',
  },
  username: {
    required: true,
    errorMessage: 'Username is required',
  },
  password: {
    required: true,
    errorMessage: 'Password is required',
  },
  passwordConfirm: {
    required: true,
    errorMessage: 'Please confirm your password',
  },
} as const;

/**
 * Form submission delays (in milliseconds)
 */
export const TIMING = {
  SUCCESS_REDIRECT_DELAY: 2000,
  DEBOUNCE_VALIDATION_DELAY: 300,
} as const;
