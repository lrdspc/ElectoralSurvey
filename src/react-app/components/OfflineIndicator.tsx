import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useOfflineStorage } from '@/react-app/utils/offlineStorage';

interface OfflineIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  showDetails?: boolean;
  autoHide?: boolean;
}

export default function OfflineIndicator({ 
  position = 'top-right',
  showDetails = true,
  autoHide = true
}: OfflineIndicatorProps) {
  const { syncStatus, forcSync } = useOfflineStorage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const handleSync = async () => {
    try {
      await forcSync();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  // Auto-hide when everything is synced and online
  useEffect(() => {
    if (autoHide && syncStatus.isOnline && syncStatus.pending === 0 && syncStatus.errors === 0) {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [syncStatus, autoHide]);

  if (!isVisible) return null;

  const hasIssues = !syncStatus.isOnline || syncStatus.pending > 0 || syncStatus.errors > 0;

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-50`}
      role="status"
      aria-live="polite"
    >
      <div 
        className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
          hasIssues ? 'border-orange-200' : 'border-green-200'
        } ${isExpanded ? 'w-80' : 'w-auto'}`}
      >
        {/* Main Indicator */}
        <div 
          className={`flex items-center space-x-3 p-4 ${showDetails && hasIssues ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={() => showDetails && hasIssues && setIsExpanded(!isExpanded)}
          role={showDetails && hasIssues ? 'button' : undefined}
          tabIndex={showDetails && hasIssues ? 0 : undefined}
          aria-expanded={isExpanded}
          aria-label={`Status de sincronização: ${!syncStatus.isOnline ? 'Offline' :
            syncStatus.isSyncing ? 'Sincronizando' :
            syncStatus.pending > 0 ? `${syncStatus.pending} pendentes` :
            syncStatus.errors > 0 ? `${syncStatus.errors} erros` :
            'Sincronizado'}`}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              showDetails && hasIssues && setIsExpanded(!isExpanded);
            }
          }}
        >
          <div 
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              !syncStatus.isOnline ? 'bg-red-100 text-red-600' :
              syncStatus.pending > 0 || syncStatus.errors > 0 ? 'bg-orange-100 text-orange-600' :
              'bg-green-100 text-green-600'
            }`}
            aria-hidden="true"
          >
            {!syncStatus.isOnline ? <WifiOff className="w-4 h-4" /> :
             syncStatus.isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> :
             syncStatus.pending > 0 || syncStatus.errors > 0 ? <AlertTriangle className="w-4 h-4" /> :
             <CheckCircle className="w-4 h-4" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div 
              className={`font-medium text-sm ${
                !syncStatus.isOnline ? 'text-red-900' :
                syncStatus.pending > 0 || syncStatus.errors > 0 ? 'text-orange-900' :
                'text-green-900'
              }`}
            >
              {!syncStatus.isOnline ? 'Offline' :
               syncStatus.isSyncing ? 'Sincronizando...' :
               syncStatus.pending > 0 ? `${syncStatus.pending} pendentes` :
               syncStatus.errors > 0 ? `${syncStatus.errors} erros` :
               'Sincronizado'}
            </div>
            
            {!isExpanded && hasIssues && (
              <div className="text-xs text-gray-600">
                {!syncStatus.isOnline ? 'Dados salvos localmente' :
                 syncStatus.pending > 0 ? 'Aguardando envio' :
                 'Toque para detalhes'}
              </div>
            )}
          </div>
          
          {showDetails && hasIssues && !isExpanded && (
            <div className="text-gray-400" aria-hidden="true">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
          
          {!hasIssues && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
              aria-label="Fechar indicador"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && showDetails && (
          <div className="border-t border-gray-200 p-4 space-y-4" role="region" aria-label="Detalhes da sincronização">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {syncStatus.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" aria-hidden="true" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" aria-hidden="true" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  Conexão
                </span>
              </div>
              <span className={`text-sm ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Sync Statistics */}
            <div className="space-y-2" role="list">
              {syncStatus.pending > 0 && (
                <div className="flex items-center justify-between" role="listitem">
                  <span className="text-sm text-gray-600">Dados pendentes:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {syncStatus.pending}
                  </span>
                </div>
              )}
              
              {syncStatus.syncing > 0 && (
                <div className="flex items-center justify-between" role="listitem">
                  <span className="text-sm text-gray-600">Sincronizando:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {syncStatus.syncing}
                  </span>
                </div>
              )}
              
              {syncStatus.errors > 0 && (
                <div className="flex items-center justify-between" role="listitem">
                  <span className="text-sm text-gray-600">Erros:</span>
                  <span className="text-sm font-medium text-red-600">
                    {syncStatus.errors}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {(syncStatus.pending > 0 || syncStatus.errors > 0) && syncStatus.isOnline && (
                <button
                  onClick={handleSync}
                  disabled={syncStatus.isSyncing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  aria-label={syncStatus.isSyncing ? 'Sincronizando dados...' : 'Sincronizar dados'}
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
              )}
              
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg"
                aria-label="Fechar detalhes"
              >
                Fechar
              </button>
            </div>

            {/* Help Text */}
            <div 
              className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3"
              role="note"
            >
              {!syncStatus.isOnline ? (
                "Você está trabalhando offline. Suas entrevistas serão salvas localmente e enviadas automaticamente quando a conexão for restaurada."
              ) : syncStatus.pending > 0 ? (
                "Existem entrevistas aguardando envio. Elas serão sincronizadas automaticamente em breve."
              ) : syncStatus.errors > 0 ? (
                "Ocorreram erros durante a sincronização. Tente sincronizar novamente."
              ) : (
                "Todos os dados estão sincronizados."
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const useOfflineIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);
  return { isVisible, setIsVisible };
};
