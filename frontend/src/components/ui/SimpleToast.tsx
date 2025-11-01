import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export type ToastType = 'success' | 'error' | 'info';

export interface SimpleToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const SimpleToast = ({ message, type, duration = 3000, onClose }: SimpleToastProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle,
  };

  const Icon = icons[type];

  const colors = {
    success: {
      bg: isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/30',
      text: isLight ? 'text-green-800' : 'text-green-300',
      icon: isLight ? 'text-green-600' : 'text-green-400',
    },
    error: {
      bg: isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/30',
      text: isLight ? 'text-red-800' : 'text-red-300',
      icon: isLight ? 'text-red-600' : 'text-red-400',
    },
    info: {
      bg: isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/30',
      text: isLight ? 'text-blue-800' : 'text-blue-300',
      icon: isLight ? 'text-blue-600' : 'text-blue-400',
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className={cn(
          'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999]',
          'min-w-[320px] max-w-md',
          'rounded-xl border shadow-2xl backdrop-blur-sm',
          'flex items-center gap-3 px-4 py-3',
          colors[type].bg
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', colors[type].icon)} />
        <p className={cn('flex-1 text-sm font-medium', colors[type].text)}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={cn(
            'rounded-full p-1 transition-colors',
            isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
          )}
        >
          <X className={cn('h-4 w-4', colors[type].text)} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleToast;
