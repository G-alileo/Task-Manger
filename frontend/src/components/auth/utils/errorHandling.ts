/**
 * API Error Handling Utility
 * 
 * Utilities for parsing and transforming API errors into user-friendly messages.
 */

import type { FieldError, APIErrorResponse } from '../types';

/**
 * Enhanced error messages for common backend validation errors
 */
const ERROR_MESSAGE_ENHANCEMENTS: Record<string, Record<string, string>> = {
  password: {
    numeric: 'Password cannot be entirely numeric. Please include letters and special characters.',
    common: 'This password is too common. Please choose a more unique password.',
    short: 'Password is too short. Please use at least 8 characters.',
    similar: 'Password is too similar to your other information.',
  },
  email: {
    'already exists': 'This email is already registered. Try logging in or use a different email.',
    invalid: 'Please enter a valid email address.',
  },
  username: {
    'already exists': 'This username is taken. Please choose a different username.',
    valid: 'Username can only contain letters, numbers, underscores, and hyphens (no spaces).',
    alphanumeric: 'Username can only contain letters, numbers, underscores, and hyphens (no spaces).',
  },
};

/**
 * Enhance error message with more context
 */
function enhanceErrorMessage(field: string, message: string): string {
  const enhancements = ERROR_MESSAGE_ENHANCEMENTS[field];
  if (!enhancements) return message;

  // Check if message contains any of the enhancement keywords
  for (const [keyword, enhancedMessage] of Object.entries(enhancements)) {
    if (message.toLowerCase().includes(keyword)) {
      return enhancedMessage;
    }
  }

  return message;
}

/**
 * Parse API error response into field errors
 * 
 * @param error - Axios error object or APIErrorResponse
 * @returns Array of field errors
 * 
 * @example
 * ```ts
 * try {
 *   await register(data);
 * } catch (err) {
 *   const errors = parseAPIError(err);
 *   setFieldErrors(errors);
 * }
 * ```
 */
export function parseAPIError(error: any): FieldError[] {
  const newErrors: FieldError[] = [];
  const response: APIErrorResponse = error.response?.data || {};

  // Handle field-specific errors
  if (response.errors && typeof response.errors === 'object') {
    Object.entries(response.errors).forEach(([field, messages]) => {
      const message = Array.isArray(messages) ? messages[0] : messages;
      const enhancedMessage = enhanceErrorMessage(field, message);
      newErrors.push({ field, message: enhancedMessage });
    });
  }
  // Handle general error message
  else if (response.message) {
    newErrors.push({
      field: 'general',
      message: response.message,
    });
  }
  // Handle detail field (common in DRF)
  else if (response.detail) {
    newErrors.push({
      field: 'general',
      message: response.detail,
    });
  }
  // Fallback error message
  else {
    newErrors.push({
      field: 'general',
      message: 'An unexpected error occurred. Please try again.',
    });
  }

  return newErrors;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    !error.response &&
    (error.code === 'ERR_NETWORK' ||
      error.message?.toLowerCase().includes('network'))
  );
}

/**
 * Get user-friendly error message for network errors
 */
export function getNetworkErrorMessage(): string {
  return 'Unable to connect to the server. Please check your internet connection and try again.';
}
