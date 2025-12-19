/**
 * Type Definitions for Authentication Components
 * 
 * Centralized type definitions for forms, validation, and authentication.
 */

/**
 * Field error structure
 */
export interface FieldError {
  /** The field name that has an error */
  field: string;
  /** The error message to display */
  message: string;
}

/**
 * Password requirement with validation state
 */
export interface PasswordRequirement {
  /** Unique identifier */
  id: string;
  /** Whether the requirement is met */
  met: boolean;
  /** Short label for display */
  label: string;
  /** Detailed description */
  description: string;
}

/**
 * Registration form data
 */
export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

/**
 * Form field touch state
 */
export type TouchedFields = Partial<Record<keyof RegisterFormData, boolean>>;

/**
 * Password strength information
 */
export interface PasswordStrength {
  /** Strength level (0-4) */
  level: number;
  /** Display label */
  label: string;
  /** Color for visual feedback */
  color: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** List of errors found */
  errors: FieldError[];
}

/**
 * Form field configuration
 */
export interface FormFieldConfig<T = string> {
  /** Field name */
  name: keyof RegisterFormData;
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'email' | 'password';
  /** Placeholder text */
  placeholder: string;
  /** Icon component */
  icon: React.ComponentType<any>;
  /** Whether field is required */
  required?: boolean;
  /** Auto-complete attribute */
  autoComplete?: string;
  /** Custom validation function */
  validate?: (value: T) => string | null;
}

/**
 * API error response structure
 */
export interface APIErrorResponse {
  errors?: Record<string, string | string[]>;
  message?: string;
  detail?: string;
}
