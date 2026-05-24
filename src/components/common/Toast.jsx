import { useState, useEffect } from 'react';

let toastId = 0;
let setToastsExternal = null;

export const toast = {
  success: (message) => {
    if (setToastsExternal) {
      setToastsExternal(prev => [...prev, { id: ++toastId, message, type: 'success' }]);
    }
  },
  error: (message) => {
    if (setToastsExternal) {
      setToastsExternal(prev => [...prev, { id: ++toastId, message, type: 'error' }]);
    }
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastsExternal = setToasts;
    return () => {
      setToastsExternal = null;
    };
  }, []);

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`px-6 py-3 rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 ${
            t.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
