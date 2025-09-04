import { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Users, 
  MapPin, 
  TrendingUp, 
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { ArrowPathIcon, CloudArrowDownIcon, ServerIcon, SignalSlashIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineStorage } from '../hooks/useOfflineStorage';
import { Survey, Interview } from '../../shared/types';

interface RealTimeStats {
  total_interviews: number;
  completed_today: number;
  active_interviewers: number;
  completion_rate: number;
  avg_time_per_interview: number;
  recent_activity: Array<{
    id: number;
    interviewer_name: string;
    survey_title: string;
    action: 'started' | 'completed';
    timestamp: string;
    location?: string;
  }>;
  geographic_distribution: Array<{
    area: string;
    completed: number;
    target: number;
    percentage: number;
  }>;
  hourly_activity: Array<{
    hour: number;
    interviews: number;
  }>;
}

interface RealTimeDashboardProps {
  surveyId?: number;
  refreshInterval?: number;
  showGeographic?: boolean;
  showActivity?: boolean;
}

export default function RealTimeDashboard({
  surveyId,
  refreshInterval = 30000, // 30 segundos
  showGeographic = true,
  showActivity = true
}: RealTimeDashboardProps) {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh data with proper cleanup
  useEffect(() => {
    const fetchStats = async () => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        setIsLoading(true);
        const endpoint = surveyId 
          ? `/api/reports/survey/${surveyId}/realtime`
          : '/api/admin/dashboard/realtime';
        
        const response = await fetch(endpoint, {
          signal: abortControllerRef.current.signal
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setError(null);
        } else {
          throw new Error('Falha ao carregar dados');
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
        setLastUpdate(new Date());
      }
    };

    fetchStats();
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (isOnline && document.visibilityState === 'visible') {
        fetchStats();
      }
    }, refreshInterval);
    
    // Pause/resume on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        fetchStats();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshInterval, isOnline, surveyId]);

  const getActivityIcon = (action: string) => {
    return action === 'completed' ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <Activity className="w-4 h-4 text-blue-600" />
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}min atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return time.toLocaleDateString('pt-BR');
  };

  if (isLoading && !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando Dashboard</h3>
        <p className="text-gray-600">Obtendo dados em tempo real...</p>
      </div>
    );
  }



  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, 30000); // Atualiza a cada 30 segundos

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOnline, user]);

  const { completed, pending, total } = stats.interviews;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="pb-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Dashboard em Tempo Real</h1>
            <p className="mt-1 text-sm text-gray-500">Última atualização: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`flex items-center text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? (
                <WifiIcon className="h-5 w-5 mr-1.5" aria-hidden="true" />
              ) : (
                <SignalSlashIcon className="h-5 w-5 mr-1.5" aria-hidden="true" />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Atualizar dados"
            >
              <ArrowPathIcon className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p className="font-bold">Erro</p>
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card de Entrevistas */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ServerIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Entrevistas</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{total}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <p className="text-gray-600">Concluídas: {completed}</p>
                <p className="text-gray-600">Pendentes: {pending}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Sincronização */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CloudArrowDownIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Status da Sincronização</dt>
                    <dd className="text-lg font-semibold text-gray-900 capitalize">{syncStatus.status}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-600">
                <p>Pendente: {syncStatus.stats.pending}</p>
                <p>Sincronizado: {syncStatus.stats.synced}</p>
                <p>Erros: {syncStatus.stats.errors}</p>
              </div>
            </div>
          </div>

          {/* Outros cards... */}
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
