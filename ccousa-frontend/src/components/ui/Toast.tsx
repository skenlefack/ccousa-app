import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Toast Provider Component
export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{
        top: 80,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  );
};

// Custom toast render function
interface ToastContentProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
}

const ToastContent: React.FC<ToastContentProps> = ({
  type,
  title,
  message,
  onClose,
}) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-500',
      title: 'text-emerald-800 dark:text-emerald-200',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500',
      title: 'text-red-800 dark:text-red-200',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-500',
      title: 'text-amber-800 dark:text-amber-200',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-800 dark:text-blue-200',
    },
  };

  const colorConfig = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={cn(
        'flex items-start gap-3 w-80 p-4 rounded-xl',
        'border shadow-lg shadow-dark-900/5 dark:shadow-black/20',
        'backdrop-blur-xl',
        colorConfig.bg,
        colorConfig.border
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', colorConfig.icon)}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', colorConfig.title)}>
          {title}
        </p>
        {message && (
          <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">
            {message}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// Toast functions
export const toast = {
  success: (title: string, message?: string) => {
    return hotToast.custom(
      (t) => (
        <ToastContent
          type="success"
          title={title}
          message={message}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      { duration: 4000 }
    );
  },

  error: (title: string, message?: string) => {
    return hotToast.custom(
      (t) => (
        <ToastContent
          type="error"
          title={title}
          message={message}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      { duration: 5000 }
    );
  },

  warning: (title: string, message?: string) => {
    return hotToast.custom(
      (t) => (
        <ToastContent
          type="warning"
          title={title}
          message={message}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      { duration: 4000 }
    );
  },

  info: (title: string, message?: string) => {
    return hotToast.custom(
      (t) => (
        <ToastContent
          type="info"
          title={title}
          message={message}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      { duration: 4000 }
    );
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => {
    return hotToast.promise(
      promise,
      {
        loading: loading,
        success: typeof success === 'function' ? success : () => success,
        error: typeof error === 'function' ? error : () => error,
      },
      {
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
        },
      }
    );
  },

  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    hotToast.remove(toastId);
  },
};

export default toast;
