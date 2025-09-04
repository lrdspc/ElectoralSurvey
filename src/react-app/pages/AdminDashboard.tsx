import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, Users, MapPin, Plus, Settings, LogOut, Bell, FileText, Activity, Zap } from 'lucide-react';
import RealTimeDashboard from '@/react-app/components/RealTimeDashboard';
import type { Survey } from '@/shared/types';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState({
    active_surveys: 0,
    total_interviews: 0,
    active_interviewers: 0,
    completion_rate: 0,
    recent_activity: [] as Array<{
      created_at: string;
      is_completed: boolean;
      interviewer_name: string;
      survey_title: string;
      survey_id: number;
    }>
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveysRes, statsRes] = await Promise.all([
          fetch('/api/surveys'),
          fetch('/api/admin/dashboard')
        ]);
        
        if (surveysRes.ok) {
          const surveysData = await surveysRes.json();
          setSurveys(surveysData);
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">London Pesquisas</h1>
                <p className="text-sm text-gray-600">Painel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              <button
                onClick={() => logout()}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Bem-vindo, {user?.google_user_data?.given_name || 'Administrador'}!
        </h2>
        <p className="text-blue-100">
          Sistema avançado de pesquisas eleitorais e opinião pública
        </p>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pesquisas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_surveys || surveys.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entrevistas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_interviews}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entrevistadores Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_interviewers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa Conclusão</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completion_rate}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Dashboard */}
        <div className="mb-8">
          <RealTimeDashboard 
            refreshInterval={30000}
            showGeographic={true}
            showActivity={true}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/admin/surveys/create')}
              className="bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border text-left transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Nova Pesquisa</h4>
                  <p className="text-sm text-gray-600">Criar com templates</p>
                </div>
              </div>
            </button>
            
            <button className="bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border text-left transition-all duration-200 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Relatórios</h4>
                  <p className="text-sm text-gray-600">Análises estatísticas</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border text-left transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Usuários</h4>
                  <p className="text-sm text-gray-600">Gestão de equipe</p>
                </div>
              </div>
            </button>

            <button className="bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border text-left transition-all duration-200 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Tempo Real</h4>
                  <p className="text-sm text-gray-600">Monitoramento ativo</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Surveys List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pesquisas Recentes</h3>
          
          {surveys.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pesquisa criada</h3>
              <p className="text-gray-600 mb-6">Comece criando sua primeira pesquisa eleitoral</p>
              <button 
                onClick={() => navigate('/admin/surveys/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Criar Primeira Pesquisa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {surveys.map((survey) => (
                <div key={survey.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{survey.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{survey.city}</span>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Ativa
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Meta</p>
                      <p className="font-semibold text-gray-900">{survey.sample_size} entrevistas</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prazo</p>
                      <p className="font-semibold text-gray-900">{new Date(survey.deadline_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate(`/admin/surveys/${survey.id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Ver Detalhes
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/surveys/${survey.id}/reports`)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Relatório
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {stats.recent_activity && stats.recent_activity.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
            <div className="bg-white rounded-xl shadow-sm">
              <div className="divide-y divide-gray-200">
                {stats.recent_activity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.is_completed ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {activity.is_completed ? (
                            <Users className="w-5 h-5 text-green-600" />
                          ) : (
                            <Activity className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.interviewer_name} {activity.is_completed ? 'concluiu' : 'iniciou'} uma entrevista
                          </p>
                          <p className="text-sm text-gray-600">
                            Pesquisa: {activity.survey_title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
