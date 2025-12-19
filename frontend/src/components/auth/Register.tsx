/**
 * Register Component - Optimized
 * 
 * Modern, accessible, and performant user registration form.
 * 
 * Features:
 * - Real-time validation with debouncing
 * - Password strength indicator
 * - Comprehensive error handling
 * - WCAG 2.1 AA accessibility
 * - Performance optimizations
 * - Modular architecture
 * 
 * @version 2.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader, UserPlus, Sparkles, Check } from 'lucide-react';

// Hooks
import { useAuth } from '../../contexts/AuthContext';
import { usePasswordValidation, useFormValidation, useFormState } from './hooks';

// Components
import { FormInput, PasswordStrengthIndicator, AlertMessage } from './components';

// Utils & Constants
import { parseAPIError, isNetworkError, getNetworkErrorMessage } from './utils/errorHandling';
import { TIMING } from './constants/validation';
import type { RegisterFormData } from './types';

/**
 * User Registration Component
 * 
 * Provides a comprehensive registration form with:
 * - Real-time validation
 * - Password strength checking
 * - Accessible UI with ARIA labels
 * - Network error handling
 * - Auto-login after successful registration
 */
export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  // Form state management
  const { formData, updateField } = useFormState();
  
  // Validation hooks
  const passwordValidation = usePasswordValidation(formData.password);
  const validation = useFormValidation();

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Handle form field changes with real-time validation
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      updateField(name as keyof RegisterFormData, value);

      // Clear field-specific error when user types
      validation.clearFieldError(name as keyof RegisterFormData);

      // Real-time validation for specific fields
      if (name === 'username' && value) {
        const error = validation.validateField('username', value);
        if (error) {
          validation.setErrors([
            ...validation.errors.filter((e) => e.field !== 'username'),
            { field: 'username', message: error },
          ]);
        }
      }
    },
    [updateField, validation]
  );

  /**
   * Handle field blur to mark as touched
   */
  const handleBlur = useCallback(
    (field: keyof RegisterFormData) => {
      validation.handleBlur(field);

      // Validate on blur if field has value
      if (formData[field]) {
        const error = validation.validateField(field, formData[field], formData);
        if (error) {
          validation.setErrors([
            ...validation.errors.filter((e) => e.field !== field),
            { field, message: error },
          ]);
        }
      }
    },
    [validation, formData]
  );

  /**
   * Real-time password confirmation validation
   */
  useEffect(() => {
    if (
      validation.touched.password_confirm &&
      formData.password_confirm
    ) {
      const error = validation.validateField(
        'password_confirm',
        formData.password_confirm,
        formData
      );
      
      if (error) {
        validation.setErrors([
          ...validation.errors.filter((e) => e.field !== 'password_confirm'),
          { field: 'password_confirm', message: error },
        ]);
      } else {
        validation.clearFieldError('password_confirm');
      }
    }
  }, [
    formData.password,
    formData.password_confirm,
    validation.touched.password_confirm,
  ]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      validation.touchAll();

      // Validate form
      const { isValid, errors } = validation.validateForm(
        formData,
        passwordValidation.isValid
      );

      if (!isValid) {
        validation.setErrors(errors);
        return;
      }

      setLoading(true);

      try {
        await registerUser(formData);
        setSuccess(true);

        // Redirect to dashboard after delay
        setTimeout(() => {
          navigate('/dashboard');
        }, TIMING.SUCCESS_REDIRECT_DELAY);
      } catch (err: any) {
        // Check for network errors
        if (isNetworkError(err)) {
          validation.setErrors([
            {
              field: 'general',
              message: getNetworkErrorMessage(),
            },
          ]);
        } else {
          // Parse API errors
          const errors = parseAPIError(err);
          validation.setErrors(errors);
        }
      } finally {
        setLoading(false);
      }
    },
    [formData, validation, passwordValidation.isValid, registerUser, navigate]
  );

  // Get general error for display
  const generalError = useMemo(
    () => validation.errors.find((e) => e.field === 'general'),
    [validation.errors]
  );

  // Check if passwords match for visual indicator
  const passwordsMatch =
    formData.password_confirm &&
    formData.password === formData.password_confirm;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Glassmorphic Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#928dab] to-transparent opacity-50" />

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#928dab] to-[#6b668c] flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <UserPlus className="text-white" size={28} />
              </motion.div>

              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Create Account
              </h1>
              <p className="text-gray-400 text-sm">
                Join Quid and start managing your tasks
              </p>
            </div>

            {/* Success Message */}
            <AlertMessage
              type="success"
              message="Registration successful!"
              subtitle="Redirecting to your dashboard..."
              show={success}
              className="mb-6"
            />

            {/* General Error Message */}
            <AlertMessage
              type="error"
              message={generalError?.message || ""}
              show={!!generalError}
              className="mb-6"
            />

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Name Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  id="first_name"
                  name="first_name"
                  type="text"
                  label="First Name"
                  value={formData.first_name}
                  placeholder="John"
                  icon={User}
                  required
                  autoComplete="given-name"
                  onChange={handleChange}
                  onBlur={() => handleBlur("first_name")}
                  hasError={validation.hasFieldError("first_name")}
                  errorMessage={validation.getFieldError("first_name")}
                />

                <FormInput
                  id="last_name"
                  name="last_name"
                  type="text"
                  label="Last Name"
                  value={formData.last_name}
                  placeholder="Doe"
                  icon={User}
                  required
                  autoComplete="family-name"
                  onChange={handleChange}
                  onBlur={() => handleBlur("last_name")}
                  hasError={validation.hasFieldError("last_name")}
                  errorMessage={validation.getFieldError("last_name")}
                />
              </div>

              {/* Email Field */}
              <FormInput
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                placeholder="john@example.com"
                icon={Mail}
                required
                autoComplete="email"
                onChange={handleChange}
                onBlur={() => handleBlur("email")}
                hasError={validation.hasFieldError("email")}
                errorMessage={validation.getFieldError("email")}
              />

              {/* Username Field */}
              <FormInput
                id="username"
                name="username"
                type="text"
                label="Username"
                value={formData.username}
                placeholder="johndoe"
                icon={User}
                required
                autoComplete="username"
                onChange={handleChange}
                onBlur={() => handleBlur("username")}
                hasError={validation.hasFieldError("username")}
                errorMessage={validation.getFieldError("username")}
                helperText={
                  !validation.hasFieldError("username") && formData.username
                    ? "Use letters, numbers, underscores, or hyphens (no spaces)"
                    : undefined
                }
              />

              {/* Password Field */}
              <div>
                <FormInput
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  value={formData.password}
                  placeholder="••••••••"
                  icon={Lock}
                  required
                  autoComplete="new-password"
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  hasError={validation.hasFieldError("password")}
                  errorMessage={validation.getFieldError("password")}
                />

                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator
                  requirements={passwordValidation.requirements}
                  strength={passwordValidation.strength}
                  show={!!formData.password}
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="password_confirm"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm Password{" "}
                  <span className="text-red-400" aria-label="required">
                    *
                  </span>
                </label>
                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors w-5 h-5 ${
                      validation.hasFieldError("password_confirm")
                        ? "text-red-400"
                        : "text-gray-400 group-focus-within:text-[#928dab]"
                    }`}
                    aria-hidden="true"
                  />
                  <input
                    type="password"
                    id="password_confirm"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    onBlur={() => handleBlur("password_confirm")}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={validation.hasFieldError("password_confirm")}
                    aria-describedby={
                      validation.hasFieldError("password_confirm")
                        ? "password_confirm-error"
                        : undefined
                    }
                    className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl 
                             text-white placeholder-gray-500 focus:outline-none 
                             focus:ring-2 transition-all hover:bg-white/[0.07] ${
                               validation.hasFieldError("password_confirm")
                                 ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                                 : "border-white/10 focus:border-[#928dab]/50 focus:ring-[#928dab]/20"
                             }`}
                    placeholder="••••••••"
                  />
                  {passwordsMatch && (
                    <Check
                      size={18}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400"
                      aria-label="Passwords match"
                    />
                  )}
                </div>
                {validation.hasFieldError("password_confirm") && (
                  <p
                    id="password_confirm-error"
                    className="mt-1.5 text-xs text-red-400"
                    role="alert"
                    aria-live="polite"
                  >
                    {validation.getFieldError("password_confirm")}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || success}
                whileHover={{ scale: loading || success ? 1 : 1.02 }}
                whileTap={{ scale: loading || success ? 1 : 0.98 }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6b668c] to-[#928dab] 
                         text-white font-semibold rounded-xl shadow-lg hover:shadow-[#928dab]/30 
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-8"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader
                      className="w-5 h-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Creating account...</span>
                  </>
                ) : success ? (
                  <>
                    <Check className="w-5 h-5" aria-hidden="true" />
                    <span>Account created!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    <span>Create Account</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#928dab] hover:text-[#6b668c] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#928dab]/50 rounded"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Terms Notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-gray-400 text-xs px-4"
        >
          By creating an account, you agree to our{" "}
          <a
            href="/terms"
            className="text-[#928dab] hover:text-[#6b668c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#928dab]/50 rounded"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-[#928dab] hover:text-[#6b668c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#928dab]/50 rounded"
          >
            Privacy Policy
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
