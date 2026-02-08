/**
 * Form State Management Hook
 * 
 * Custom hook for managing form state with type-safe updates and resets.
 */

import { useState, useCallback } from 'react';
import type { RegisterFormData } from '../types';

export interface UseFormStateResult {
  /** Current form data */
  formData: RegisterFormData;
  /** Update a single field */
  updateField: (field: keyof RegisterFormData, value: string) => void;
  /** Update multiple fields */
  updateFields: (updates: Partial<RegisterFormData>) => void;
  /** Reset form to initial state */
  resetForm: () => void;
  /** Check if form is empty */
  isEmpty: boolean;
}

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '',
  username: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
};

export function useFormState(
  initialData: Partial<RegisterFormData> = {}
): UseFormStateResult {
  const [formData, setFormData] = useState<RegisterFormData>({
    ...INITIAL_FORM_DATA,
    ...initialData,
  });

  /**
   * Update a single field
   */
  const updateField = useCallback((field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Update multiple fields at once
   */
  const updateFields = useCallback((updates: Partial<RegisterFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({ ...INITIAL_FORM_DATA, ...initialData });
  }, [initialData]);

  /**
   * Check if form is empty
   */
  const isEmpty = Object.values(formData).every((value) => !value.trim());

  return {
    formData,
    updateField,
    updateFields,
    resetForm,
    isEmpty,
  };
}
