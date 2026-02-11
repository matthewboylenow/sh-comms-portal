'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<ToastVariant, { border: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: CheckCircleIcon,
  },
  error: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: ExclamationCircleIcon,
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: ExclamationTriangleIcon,
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: InformationCircleIcon,
  },
};

const iconColors: Record<ToastVariant, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = String(++toastId);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const config = variantConfig[t.variant];
            const Icon = config.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`
                  pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-sm
                  px-4 py-3 rounded-lg shadow-lg border-l-4
                  ${config.border} ${config.bg}
                  bg-white dark:bg-slate-800
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[t.variant]}`} />
                <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                  {t.message}
                </p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
