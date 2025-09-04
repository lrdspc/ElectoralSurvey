import React, { createContext, useContext, useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react';

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showOfflineSync: (count: number) => void;
  isOnline: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada!', {
        icon: <Wifi className="w-5 h-5" />,
        duration: 3000,
      });
      
      // Trigger sync of offline data
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.active?.postMessage({ type: 'SYNC_OFFLINE_REQUESTS' });
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sem conexão - trabalhando offline', {
        icon: <WifiOff className="w-5 h-5" />,
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showSuccess = (message: string) => {
    toast.success(message, {
      icon: <CheckCircle className="w-5 h-5" />,
      duration: 4000,
      style: {
        background: '#10b981',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      icon: <AlertCircle className="w-5 h-5" />,
      duration: 5000,
      style: {
        background: '#ef4444',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const showInfo = (message: string) => {
    toast(message, {
      icon: <Info className="w-5 h-5" />,
      duration: 4000,
      style: {
        background: '#3b82f6',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const showOfflineSync = (count: number) => {
    setPendingSyncCount(count);
    if (count > 0) {
      toast(`${count} entrevista(s) pendente(s) de sincronização`, {
        icon: <WifiOff className="w-5 h-5" />,
        duration: 6000,
        style: {
          background: '#f59e0b',
          color: 'white',
          borderRadius: '12px',
          padding: '16px',
        },
      });
    }
  };

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showInfo,
      showOfflineSync,
      isOnline,
    }}>
      {children}
      <Toaster 
        position="top-right"
        gutter={8}
        containerClassName="z-50"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      
      {/* Online/Offline Status Indicator */}
      <div className={`fixed top-4 left-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
        {pendingSyncCount > 0 && !isOnline && (
          <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs">
            {pendingSyncCount}
          </span>
        )}
      </div>
    </NotificationContext.Provider>
  );
}
