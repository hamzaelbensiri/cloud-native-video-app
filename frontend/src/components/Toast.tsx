import React, { createContext, useContext, useState } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error' };

const ToastContext = createContext<{ notify: (msg: string, type?: 'success' | 'error') => void }>({
  notify: () => {},
});

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {/* SR-friendly live region */}
      <div
        className="fixed bottom-4 right-4 space-y-2"
        role="region"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`rounded-md px-4 py-2 text-sm shadow ${
              t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
