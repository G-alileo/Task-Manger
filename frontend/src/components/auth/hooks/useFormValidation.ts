/**
 * Form Validation Hook
 * 
 * Custom hook for comprehensive form validation with real-time feedback.
 * Handles field-level validation, touched state, and error management.
 */

import { useState, useCallback } from 'react';
import { USERNAME_VALIDATION, EMAIL_VALIDATION, FIELD_VALIDATION } from '../constants/validation';
import type { FieldError, RegisterFormData, TouchedFields, ValidationResult } from '../types';

export interface UseFormValidationOptions {
  /** Real-time validation delay in ms */
  debounceMs?: number;
}

export interface UseFormValidationResult {
  /** Current field errors */
  errors: FieldError[];
  /** Touched fields state */
  touched: TouchedFields;
  /** Get error for specific field */
  getFieldError: (field: keyof RegisterFormData) => string | null;
  /** Check if field has error */
  hasFieldError: (field: keyof RegisterFormData) => boolean;
  /** Mark field as touched */
  handleBlur: (field: keyof RegisterFormData) => void;
  /** Clear error for specific field */
  clearFieldError: (field: keyof RegisterFormData) => void;
  /** Set errors from external source (e.g., API) */
  setErrors: (errors: FieldError[]) => void;
  /** Validate single field */
  validateField: (field: keyof RegisterFormData, value: any, formData?: Partial<RegisterFormData>) => string | null;
  /** Validate entire form */
  validateForm: (formData: RegisterFormData, passwordIsValid: boolean) => ValidationResult;
  /** Mark all fields as touched */
  touchAll: () => void;
  /** Reset validation state */
  reset: () => void;
}

/**
 * Provides comprehensive form validation with error management
 * 
 * @param options - Configuration options
 * @returns Validation state and helper functions
 * 
 * @example
 * ```tsx
 * const { errors, validateField, validateForm } = useFormValidation();
 * ```
 */
export function useFormValidation(
  _options: UseFormValidationOptions = {}
): UseFormValidationResult {
  const [errors, setErrorsState] = useState<FieldError[]>([]);
  const [touched, setTouched] = useState<TouchedFields>({});

  /**
   * Validate username field
   */
  const validateUsername = useCallback((value: string): string | null => {
    if (!value.trim()) {
      return FIELD_VALIDATION.username.errorMessage;
    }
    if (value.includes(' ')) {
      return USERNAME_VALIDATION.errorMessages.spaces;
    }
    if (!USERNAME_VALIDATION.pattern.test(value)) {
      return USERNAME_VALIDATION.errorMessages.pattern;
    }
    if (value.length < USERNAME_VALIDATION.minLength) {
      return USERNAME_VALIDATION.errorMessages.minLength;
    }
    if (value.length > USERNAME_VALIDATION.maxLength) {
      return USERNAME_VALIDATION.errorMessages.maxLength;
    }
    return null;
  }, []);

  /**
   * Validate email field
   */
  const validateEmail = useCallback((value: string): string | null => {
    if (!value.trim()) {
      return FIELD_VALIDATION.email.errorMessage;
    }
    if (!EMAIL_VALIDATION.pattern.test(value)) {
      return EMAIL_VALIDATION.errorMessages.invalid;
    }
    return null;
  }, []);

  /**
   * Validate password confirmation
   */
  const validatePasswordConfirm = useCallback(
    (confirmValue: string, password: string): string | null => {
      if (!confirmValue) {
        return FIELD_VALIDATION.passwordConfirm.errorMessage;
      }
      if (password !== confirmValue) {
        return 'Passwords do not match';
      }
      return null;
    },
    []
  );

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof RegisterFormData, value: any, formData?: Partial<RegisterFormData>): string | null => {
      switch (field) {
        case 'first_name':
          return !value.trim() ? FIELD_VALIDATION.firstName.errorMessage : null;
        case 'last_name':
          return !value.trim() ? FIELD_VALIDATION.lastName.errorMessage : null;
        case 'email':
          return validateEmail(value);
        case 'username':
          return validateUsername(value);
        case 'password':
          return !value ? FIELD_VALIDATION.password.errorMessage : null;
        case 'password_confirm':
          return validatePasswordConfirm(value, formData?.password || '');
        default:
          return null;
      }
    },
    [validateEmail, validateUsername, validatePasswordConfirm]
  );

  /**
   * Validate entire form
   */
  const validateForm = useCallback(
    (formData: RegisterFormData, passwordIsValid: boolean): ValidationResult => {
      const newErrors: FieldError[] = [];

      // Validate all fields
      (Object.keys(formData) as Array<keyof RegisterFormData>).forEach((field) => {
        const error = validateField(field, formData[field], formData);
        if (error) {
          newErrors.push({ field, message: error });
        }
      });

      // Check password strength
      if (formData.password && !passwordIsValid) {
        const existingPasswordError = newErrors.find((e) => e.field === 'password');
        if (!existingPasswordError) {
          newErrors.push({
            field: 'password',
            message: 'Password must meet all requirements',
          });
        }
      }

      return {
        isValid: newErrors.length === 0,
        errors: newErrors,
      };
    },
    [validateField]
  );

  /**
   * Get error message for a field
   */
  const getFieldError = useCallback(
    (field: keyof RegisterFormData): string | null => {
      const error = errors.find((e) => e.field === field);
      return error ? error.message : null;
    },
    [errors]
  );

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback(
    (field: keyof RegisterFormData): boolean => {
      return errors.some((e) => e.field === field);
    },
    [errors]
  );

  /**
   * Mark field as touched
   */
  const handleBlur = useCallback((field: keyof RegisterFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  /**
   * Clear error for specific field
   */
  const clearFieldError = useCallback((field: keyof RegisterFormData) => {
    setErrorsState((prev) => prev.filter((e) => e.field !== field));
  }, []);

  /**
   * Set errors from external source
   */
  const setErrors = useCallback((newErrors: FieldError[]) => {
    setErrorsState(newErrors);
  }, []);

  /**
   * Mark all fields as touched
   */
  const touchAll = useCallback(() => {
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      username: true,
      password: true,
      password_confirm: true,
    });
  }, []);

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    setErrorsState([]);
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    getFieldError,
    hasFieldError,
    handleBlur,
    clearFieldError,
    setErrors,
    validateField,
    validateForm,
    touchAll,
    reset,
  };
}
