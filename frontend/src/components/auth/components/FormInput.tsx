/**
 * Form Input Component
 * 
 * Accessible, reusable form input with validation feedback and icons.
 * Supports text, email, and password input types.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, type LucideIcon } from 'lucide-react';

export interface FormInputProps {
  /** Input field ID */
  id: string;
  /** Input field name */
  name: string;
  /** Input type */
  type: 'text' | 'email' | 'password';
  /** Field label */
  label: string;
  /** Current value */
  value: string;
  /** Placeholder text */
  placeholder: string;
  /** Icon component */
  icon: LucideIcon;
  /** Whether field is required */
  required?: boolean;
  /** Auto-complete attribute */
  autoComplete?: string;
  /** Whether field has error */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string | null;
  /** Helper text (shown when no error) */
  helperText?: string;
  /** Whether to show success indicator */
  showSuccess?: boolean;
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur: () => void;
  /** Additional className */
  className?: string;
  /** Whether field is disabled */
  disabled?: boolean;
}

/**
 * Accessible form input component with validation feedback
 * 
 * Features:
 * - ARIA labels and error announcements
 * - Visual feedback for validation states
 * - Icon support with proper positioning
 * - Smooth animations for errors
 * - Focus management
 * 
 * @example
 * ```tsx
 * <FormInput
 *   id="email"
 *   name="email"
 *   type="email"
 *   label="Email Address"
 *   value={email}
 *   placeholder="you@example.com"
 *   icon={Mail}
 *   onChange={handleChange}
 *   onBlur={handleBlur}
 *   hasError={!!error}
 *   errorMessage={error}
 * />
 * ```
 */
export const FormInput = memo<FormInputProps>(({
  id,
  name,
  type,
  label,
  value,
  placeholder,
  icon: Icon,
  required = false,
  autoComplete,
  hasError = false,
  errorMessage,
  helperText,
  showSuccess = false,
  onChange,
  onBlur,
  className = '',
  disabled = false,
}) => {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        {label}
        {required && <span className="text-red-400 ml-1" aria-label="required">*</span>}
      </label>
      
      <div className="relative group">
        <Icon
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
            hasError
              ? 'text-red-400'
              : 'text-gray-400 group-focus-within:text-[#928dab]'
          }`}
          aria-hidden="true"
        />
        
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          aria-required={required}
          className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl 
                     text-white placeholder-gray-500 focus:outline-none 
                     focus:ring-2 transition-all hover:bg-white/[0.07]
                     disabled:opacity-50 disabled:cursor-not-allowed ${
                       hasError
                         ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                         : 'border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20'
                     }`}
          placeholder={placeholder}
        />

        {showSuccess && !hasError && value && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Helper text */}
      {!hasError && helperText && (
        <p id={helperId} className="mt-1.5 text-xs text-gray-400">
          {helperText}
        </p>
      )}

      {/* Error message with animation */}
      <AnimatePresence>
        {hasError && errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            aria-live="polite"
          >
            <p
              id={errorId}
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <AlertCircle size={12} aria-hidden="true" />
              {errorMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FormInput.displayName = 'FormInput';
