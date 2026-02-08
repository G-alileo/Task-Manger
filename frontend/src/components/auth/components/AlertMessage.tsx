import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertMessageProps {
  /** Alert type determines icon and colors */
  type: AlertType;
  /** Main message to display */
  message: string;
  /** Optional subtitle or additional context */
  subtitle?: string;
  /** Whether to show the alert */
  show: boolean;
  /** Optional dismiss handler */
  onDismiss?: () => void;
  /** Additional className */
  className?: string;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
    textClass: 'text-green-400',
    subtitleClass: 'text-green-300/70',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    textClass: 'text-red-300',
    subtitleClass: 'text-red-300/70',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/20',
    textClass: 'text-yellow-400',
    subtitleClass: 'text-yellow-300/70',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    textClass: 'text-blue-400',
    subtitleClass: 'text-blue-300/70',
  },
};


export const AlertMessage = memo<AlertMessageProps>(
  ({ type, message, subtitle, show, onDismiss, className = '' }) => {
    const config = alertConfig[type];
    const Icon = config.icon;

    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="alert"
            aria-live={type === 'error' ? 'assertive' : 'polite'}
            className={`p-4 ${config.bgClass} border ${config.borderClass} rounded-xl flex items-start gap-3 ${className}`}
          >
            <Icon
              className={`w-5 h-5 ${config.textClass} flex-shrink-0 mt-0.5`}
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className={`${config.textClass} font-medium`}>{message}</p>
              {subtitle && (
                <p className={`${config.subtitleClass} text-sm mt-1`}>
                  {subtitle}
                </p>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`${config.textClass} hover:opacity-70 transition-opacity`}
                aria-label="Dismiss alert"
              >
                <X size={18} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

AlertMessage.displayName = 'AlertMessage';
