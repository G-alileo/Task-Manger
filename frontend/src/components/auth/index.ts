/**
 * Authentication Module Exports
 * 
 * Centralized exports for all authentication-related modules.
 * Import from this file for convenience.
 * 
 * @example
 * ```typescript
 * // Instead of multiple imports
 * import { FormInput } from './components/FormInput';
 * import { useFormValidation } from './hooks/useFormValidation';
 * 
 * // Use centralized import
 * import { FormInput, useFormValidation } from './auth';
 * ```
 */

// Components
export {
  FormInput,
  PasswordStrengthIndicator,
  AlertMessage,
} from './components';

export type {
  FormInputProps,
  PasswordStrengthIndicatorProps,
  AlertMessageProps,
  AlertType,
} from './components';

// Hooks
export {
  usePasswordValidation,
  useFormValidation,
  useFormState,
} from './hooks';

export type {
  UsePasswordValidationResult,
  UseFormValidationResult,
  UseFormValidationOptions,
  UseFormStateResult,
} from './hooks';

// Types
export type {
  FieldError,
  PasswordRequirement,
  RegisterFormData,
  TouchedFields,
  PasswordStrength,
  ValidationResult,
  FormFieldConfig,
  APIErrorResponse,
} from './types';

// Constants
export {
  PASSWORD_REQUIREMENTS,
  USERNAME_VALIDATION,
  EMAIL_VALIDATION,
  PASSWORD_STRENGTH,
  FIELD_VALIDATION,
  TIMING,
} from './constants/validation';

// Utils
export {
  parseAPIError,
  isNetworkError,
  getNetworkErrorMessage,
} from './utils/errorHandling';

// Main Components
export { default as Register } from './Register';
export { default as Login } from './Login';
export { default as Profile } from './Profile';
