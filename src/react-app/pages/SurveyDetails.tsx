import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Trash2, 
  Users, 
  MapPin, 
  Calendar,
  BarChart3,
  Download,
  Play,
  Pause,
  Settings,
  FileText,
  CheckCircle
} from 'lucide-react';
import type { Survey, SurveyQuestion } from '@/shared/types';

export default function SurveyDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [stats, setStats] = useState({
    total_interviews: 0,
    completed_interviews: 0,
    unique_interviewers: 0,
    completion_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveyRes, questionsRes, statsRes] = await Promise.all([
          fetch(`/api/surveys/${id}`),
          fetch(`/api/surveys/${id}/questions`),
          fetch(`/api/reports/survey/${id}`),
        ]);

        if (surveyRes.ok) {
          const surveyData = await surveyRes.json();
          setSurvey(surveyData);
        }

        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          setQuestions(questionsData);
        }

        if (statsRes.ok) {
          const reportData = await statsRes.json();
          setStats(reportData.statistics);
        }
      } catch (error) {
        console.error('Error fetching survey data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleToggleSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/${id}/toggle`, {
        method: 'PATCH',
      });

      if (response.ok) {
        const updatedSurvey = await response.json();
        setSurvey(updatedSurvey);
      } else {
        alert('Erro ao alterar status da pesquisa');
      }
    } catch (error) {
      console.error('Error toggling survey:', error);
      alert('Erro ao alterar status da pesquisa');
    }
  };

  const handleDeleteSurvey = async () => {
    if (confirm('Tem certeza que deseja excluir esta pesquisa? Esta ação não pode ser desfeita.')) {
      try {
        const response = await fetch(`/api/surveys/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          navigate('/admin/dashboard');
        } else {
          alert('Erro ao excluir pesquisa');
        }
      } catch (error) {
        console.error('Error deleting survey:', error);
        alert('Erro ao excluir pesquisa');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesquisa não encontrada</h2>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = survey.sample_size > 0 
    ? (stats.completed_interviews / survey.sample_size) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{survey.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{survey.city}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Prazo: {new Date(survey.deadline_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    survey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {survey.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/admin/surveys/${id}/edit`)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Editar</span>
              </button>
              
              <button
                onClick={() => navigate(`/admin/surveys/${id}/reports`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Relatório</span>
              </button>
              
              <button
                onClick={handleToggleSurvey}
                className={`font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2 ${
                  survey.is_active 
                    ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              >
                {survey.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{survey.is_active ? 'Pausar' : 'Ativar'}</span>
              </button>
              
              <button
                onClick={handleDeleteSurvey}
                className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white border-b">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.completed_interviews}</div>
              <div className="text-sm text-gray-600">Entrevistas Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{survey.sample_size}</div>
              <div className="text-sm text-gray-600">Meta Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{progressPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Progresso</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.unique_interviewers}</div>
              <div className="text-sm text-gray-600">Entrevistadores Ativos</div>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progresso da Coleta</span>
              <span className="font-medium">{stats.completed_interviews}/{survey.sample_size}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'questions', label: 'Perguntas', icon: FileText },
              { id: 'settings', label: 'Configurações', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Survey Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informações da Pesquisa</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Cidade</p>
                    <p className="font-semibold text-gray-900">{survey.city}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Amostra</p>
                    <p className="font-semibold text-gray-900">{survey.sample_size} entrevistas</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Prazo</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(survey.deadline_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Bairros/Regiões</p>
                <div className="flex flex-wrap gap-2">
                  {survey.neighborhoods.split(',').map((neighborhood, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {neighborhood.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Atividade Recente</h2>
              
              <div className="space-y-4">
                {stats.completed_interviews === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma entrevista realizada</h3>
                    <p className="text-gray-600">As entrevistas aparecem aqui quando forem enviadas pelos entrevistadores.</p>
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          {stats.completed_interviews} entrevistas concluídas
                        </p>
                        <p className="text-sm text-green-700">
                          Por {stats.unique_interviewers} entrevistador(es)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Perguntas da Pesquisa</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {questions.length} pergunta(s)
              </span>
            </div>
            
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start space-x-4">
                    <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {question.question_text}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>Tipo: {
                          question.question_type === 'multiple_choice' ? 'Múltipla Escolha' :
                          question.question_type === 'text' ? 'Texto Livre' :
                          'Avaliação (1-5)'
                        }</span>
                        <span>{question.is_required ? '• Obrigatória' : '• Opcional'}</span>
                      </div>

                      {question.question_type === 'multiple_choice' && question.options && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Opções:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {JSON.parse(question.options).map((option: string, idx: number) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <span className="text-sm text-gray-900">• {option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Configurações da Pesquisa</h2>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações da Pesquisa</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Status da Pesquisa</h4>
                    <p className="text-sm text-gray-600">
                      {survey.is_active ? 'A pesquisa está ativa e coletando dados' : 'A pesquisa está pausada'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSurvey}
                    className={`font-medium py-2 px-4 rounded-lg transition-all ${
                      survey.is_active 
                        ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {survey.is_active ? 'Pausar Pesquisa' : 'Ativar Pesquisa'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Exportar Dados</h4>
                    <p className="text-sm text-gray-600">Baixar todos os dados coletados</p>
                  </div>
                  <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-900">Excluir Pesquisa</h4>
                    <p className="text-sm text-red-700">Esta ação não pode ser desfeita</p>
                  </div>
                  <button
                    onClick={handleDeleteSurvey}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
