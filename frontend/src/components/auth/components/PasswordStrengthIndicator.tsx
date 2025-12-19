/**
 * Password Strength Indicator Component
 * 
 * Visual feedback component showing password strength and requirements.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { PasswordRequirement, PasswordStrength } from '../types';

export interface PasswordStrengthIndicatorProps {
  /** Current password requirements with met status */
  requirements: PasswordRequirement[];
  /** Password strength information */
  strength: PasswordStrength;
  /** Whether to show the indicator */
  show: boolean;
}

/**
 * Displays password strength meter and requirement checklist
 * 
 * Features:
 * - Visual strength bar with 4 levels
 * - Color-coded feedback
 * - Requirement checklist with checkmarks
 * - Smooth animations
 * - Accessible markup
 * 
 * @example
 * ```tsx
 * <PasswordStrengthIndicator
 *   requirements={requirements}
 *   strength={strength}
 *   show={!!password}
 * />
 * ```
 */
export const PasswordStrengthIndicator = memo<PasswordStrengthIndicatorProps>(
  ({ requirements, strength, show }) => {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {/* Strength Bar */}
            <div>
              <div
                className="flex items-center gap-2 mb-1.5"
                role="meter"
                aria-label="Password strength"
                aria-valuenow={strength.level}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuetext={strength.label}
              >
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        level <= strength.level
                          ? strength.color
                          : 'rgba(255,255,255,0.1)',
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p
                className="text-xs font-medium"
                style={{ color: strength.color }}
              >
                Password strength: {strength.label}
              </p>
            </div>

            {/* Requirements Checklist */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-white/5 border border-white/10 rounded-lg"
              role="list"
              aria-label="Password requirements"
            >
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start gap-2 text-xs"
                  role="listitem"
                >
                  {req.met ? (
                    <Check
                      size={14}
                      className="text-green-400 flex-shrink-0 mt-0.5"
                      aria-label="Requirement met"
                    />
                  ) : (
                    <X
                      size={14}
                      className="text-gray-500 flex-shrink-0 mt-0.5"
                      aria-label="Requirement not met"
                    />
                  )}
                  <span
                    className={req.met ? 'text-green-400' : 'text-gray-400'}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';
