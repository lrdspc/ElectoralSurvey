import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Users, Clock, Battery, Wifi, WifiOff, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOfflineStorage } from '@/react-app/utils/offlineStorage';
import type { Survey } from '@/shared/types';

export default function InterviewerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { syncStatus, forcSync } = useOfflineStorage();

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

  useEffect(() => {
    fetch('/api/surveys')
      .then(res => res.json())
      .then(setSurveys)
      .catch(console.error);
  }, []);

  const handleStartSurvey = (surveyId: number) => {
    navigate(`/interviewer/surveys/${surveyId}/interview`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">London Pesquisas</h1>
                <p className="text-xs text-gray-600">Entrevistador</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {syncStatus.pending > 0 && (
              <div className="flex items-center space-x-2">
                <div className="text-orange-600 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{syncStatus.pending} dados para sincronizar</span>
                </div>
                <button
                  onClick={forcSync}
                  disabled={syncStatus.isSyncing}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 p-1"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
            {syncStatus.errors > 0 && (
              <div className="text-red-600 text-sm">
                {syncStatus.errors} erros de sincronização
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Battery className="w-4 h-4" />
            <span>Modo Economia</span>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="px-4 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="text-xl font-bold mb-2">
          Olá, {user?.google_user_data?.given_name || 'Entrevistador'}!
        </h2>
        <p className="text-blue-100 text-sm">
          {surveys.length} pesquisas atribuídas • Acompanhe seu progresso
        </p>
      </div>

      {/* Surveys List */}
      <div className="px-4 py-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pesquisas Atribuídas</h3>
        
        {surveys.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pesquisa atribuída</h3>
            <p className="text-gray-600">Entre em contato com seu administrador para receber pesquisas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{survey.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{survey.city} • {survey.neighborhoods.split(',').length} bairros</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">0/{survey.sample_size}</div>
                    <div className="text-xs text-gray-500">entrevistas</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progresso</span>
                    <span className="text-gray-900 font-medium">0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Prazo: {new Date(survey.deadline_date).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleStartSurvey(survey.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Iniciar Entrevistas
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
