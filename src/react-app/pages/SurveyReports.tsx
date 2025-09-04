import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  FileText
} from 'lucide-react';
import { CustomBarChart, CustomPieChart, StatCard } from '@/react-app/components/Charts';
import { useNotifications } from '@/react-app/contexts/NotificationContext';
import type { Survey } from '@/shared/types';

interface ReportData {
  survey: Survey;
  statistics: {
    total_interviews: number;
    completed_interviews: number;
    unique_interviewers: number;
  };
  responses: Array<{
    question_id: number;
    question_text: string;
    question_type: string;
    options: string | null;
    response_text: string;
    response_count: number;
  }>;
}

export default function SurveyReports() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError } = useNotifications();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch(`/api/reports/survey/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReportData(data);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReportData();
    }
  }, [id]);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const { exportToPDF: exportPDFUtil } = await import('@/react-app/utils/exportUtils');
      await exportPDFUtil(id!);
      showSuccess('Relatório PDF baixado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const { exportToExcel: exportExcelUtil } = await import('@/react-app/utils/exportUtils');
      await exportExcelUtil(id!);
      showSuccess('Relatório Excel baixado com sucesso!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showError('Erro ao exportar Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dados não encontrados</h2>
          <button
            onClick={() => navigate(`/admin/surveys/${id}`)}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar aos detalhes da pesquisa
          </button>
        </div>
      </div>
    );
  }

  const { survey, statistics, responses } = reportData;
  const completionRate = statistics.total_interviews > 0 
    ? (statistics.completed_interviews / statistics.total_interviews) * 100 
    : 0;

  // Group responses by question
  const responsesByQuestion = responses.reduce((acc, response) => {
    if (!acc[response.question_id]) {
      acc[response.question_id] = {
        question_text: response.question_text,
        question_type: response.question_type,
        options: response.options,
        responses: []
      };
    }
    if (response.response_text) {
      acc[response.question_id].responses.push({
        text: response.response_text,
        count: response.response_count
      });
    }
    return acc;
  }, {} as any);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/admin/surveys/${id}`)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Relatório da Pesquisa</h1>
                <p className="text-sm text-gray-600">{survey.title}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exportando...' : 'Excel'}</span>
              </button>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exportando...' : 'PDF'}</span>
              </button>
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
              { id: 'responses', label: 'Respostas', icon: FileText },
              { id: 'demographics', label: 'Demografia', icon: Users },
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total de Entrevistas"
                value={statistics.total_interviews}
                icon={Users}
                color="blue"
              />
              
              <StatCard
                title="Concluídas"
                value={statistics.completed_interviews}
                icon={BarChart3}
                color="green"
              />
              
              <StatCard
                title="Taxa de Conclusão"
                value={`${completionRate.toFixed(1)}%`}
                icon={TrendingUp}
                color="purple"
              />
              
              <StatCard
                title="Entrevistadores"
                value={statistics.unique_interviewers}
                icon={Users}
                color="orange"
              />
            </div>

            {/* Survey Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informações da Pesquisa</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Cidade</p>
                    <p className="font-semibold text-gray-900">{survey.city}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Prazo</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(survey.deadline_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Meta</p>
                    <p className="font-semibold text-gray-900">{survey.sample_size} entrevistas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Progresso da Coleta</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso geral</span>
                  <span className="font-medium">{statistics.completed_interviews}/{survey.sample_size} ({((statistics.completed_interviews / survey.sample_size) * 100).toFixed(1)}%)</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((statistics.completed_interviews / survey.sample_size) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{statistics.completed_interviews}</div>
                    <div className="text-sm text-gray-600">Concluídas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{statistics.total_interviews - statistics.completed_interviews}</div>
                    <div className="text-sm text-gray-600">Em andamento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{survey.sample_size - statistics.total_interviews}</div>
                    <div className="text-sm text-gray-600">Restantes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Análise das Respostas</h2>
            
            {Object.entries(responsesByQuestion).map(([questionId, questionData]: [string, any], index) => (
              <div key={questionId} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {index + 1}. {questionData.question_text}
                </h3>
                
                {questionData.question_type === 'multiple_choice' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart */}
                    <div>
                      <CustomBarChart
                        data={questionData.responses.map((r: any) => ({
                          name: r.text.length > 20 ? r.text.substring(0, 20) + '...' : r.text,
                          value: r.count
                        }))}
                        color="#3b82f6"
                      />
                    </div>
                    
                    {/* Pie Chart */}
                    <div>
                      <CustomPieChart
                        data={questionData.responses.map((r: any) => ({
                          name: r.text,
                          value: r.count
                        }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 mb-3">Respostas em Texto Livre:</h4>
                    {questionData.responses.slice(0, 10).map((response: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-900">{response.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{response.count} menção(ões)</p>
                      </div>
                    ))}
                    {questionData.responses.length > 10 && (
                      <p className="text-sm text-gray-600 text-center py-2">
                        ... e mais {questionData.responses.length - 10} respostas
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Demographics Tab */}
        {activeTab === 'demographics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Análise Demográfica</h2>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Bairros</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {survey.neighborhoods.split(',').map((neighborhood, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{neighborhood.trim()}</h4>
                    <p className="text-sm text-gray-600">0 entrevistas realizadas</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <PieChart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Análise Demográfica Detalhada</h3>
              <p className="text-blue-700">
                Gráficos e análises demográficas detalhadas serão exibidos quando houver mais dados coletados.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
