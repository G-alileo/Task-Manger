/**
 * Password Validation Hook
 * 
 * Custom hook for password strength validation and requirement checking.
 * Provides real-time feedback on password requirements and strength.
 */

import { useState, useEffect, useMemo } from 'react';
import { PASSWORD_REQUIREMENTS, PASSWORD_STRENGTH } from '../constants/validation';
import type { PasswordRequirement, PasswordStrength } from '../types';

export interface UsePasswordValidationResult {
  /** Current password requirements with met status */
  requirements: PasswordRequirement[];
  /** Password strength information */
  strength: PasswordStrength;
  /** Whether all requirements are met */
  isValid: boolean;
  /** Number of requirements met */
  metCount: number;
}


export function usePasswordValidation(password: string): UsePasswordValidationResult {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([]);

  // Update requirements when password changes
  useEffect(() => {
    const updatedRequirements = PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      met: password ? req.validator(password) : false,
    }));
    setRequirements(updatedRequirements);
  }, [password]);

  // Calculate strength based on met requirements
  const metCount = useMemo(() => {
    return requirements.filter((req) => req.met).length;
  }, [requirements]);

  // Determine password strength
  const strength = useMemo((): PasswordStrength => {
    if (metCount === 0) return PASSWORD_STRENGTH.WEAK;
    if (metCount === 1) return PASSWORD_STRENGTH.FAIR;
    if (metCount === 2) return PASSWORD_STRENGTH.GOOD;
    if (metCount === 3) return PASSWORD_STRENGTH.STRONG;
    return PASSWORD_STRENGTH.VERY_STRONG;
  }, [metCount]);

  const isValid = useMemo(() => {
    return requirements.length > 0 && requirements.every((req) => req.met);
  }, [requirements]);

  return {
    requirements,
    strength,
    isValid,
    metCount,
  };
}
