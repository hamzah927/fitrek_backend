import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useUserStore } from '../store/userStore';

export function Toast() {
  const { showToast, toastMessage, hideToast } = useUserStore();

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast, hideToast]);

  if (!showToast) return null;

  return (
    <div className="fixed top-3 xs:top-4 right-3 xs:right-4 z-50 animate-slide-down duration-300 modal-content">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-large border border-white/30 dark:border-gray-700/50 p-3 xs:p-4 max-w-xs xs:max-w-sm success-glow">
        <div className="flex items-center gap-2 xs:gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 text-green-500 animate-bounce-gentle icon-crisp" />
          </div>
          <div className="flex-1">
            <p className="text-xs xs:text-sm font-medium text-gray-900 dark:text-white">
              {toastMessage}
            </p>
          </div>
          <button
            onClick={hideToast}
            className="flex-shrink-0 p-0.5 xs:p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-3 h-3 xs:w-4 xs:h-4 text-gray-500 dark:text-gray-400 icon-crisp" />
          </button>
        </div>
      </div>
    </div>
  );
}