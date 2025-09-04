import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Users, 
  UserCheck, 
  UserX, 
  Search,
  Filter,
  MoreVertical,
  Phone,
  Calendar,
  Activity
} from 'lucide-react';

interface InterviewerData {
  id: number;
  user_id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  total_interviews: number;
  completed_interviews: number;
  last_activity: string | null;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [interviewers, setInterviewers] = useState<InterviewerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchInterviewers();
  }, []);

  const fetchInterviewers = async () => {
    try {
      const response = await fetch('/api/admin/interviewers');
      if (response.ok) {
        const data = await response.json();
        setInterviewers(data);
      }
    } catch (error) {
      console.error('Error fetching interviewers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterviewerStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/interviewers/${userId}/toggle`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchInterviewers(); // Refresh the list
      } else {
        alert('Erro ao alterar status do entrevistador');
      }
    } catch (error) {
      console.error('Error toggling interviewer status:', error);
      alert('Erro ao alterar status do entrevistador');
    }
  };

  const filteredInterviewers = interviewers.filter(interviewer => {
    const matchesSearch = interviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (interviewer.phone && interviewer.phone.includes(searchTerm));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && interviewer.is_active) ||
                         (filterStatus === 'inactive' && !interviewer.is_active);

    return matchesSearch && matchesFilter;
  });

  const totalInterviewers = interviewers.length;
  const activeInterviewers = interviewers.filter(i => i.is_active).length;
  const totalInterviews = interviewers.reduce((sum, i) => sum + i.total_interviews, 0);
  const completedInterviews = interviewers.reduce((sum, i) => sum + i.completed_interviews, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando entrevistadores...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-gray-900">Gestão de Entrevistadores</h1>
                <p className="text-sm text-gray-600">Gerencie sua equipe de entrevistadores</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entrevistadores</p>
                <p className="text-2xl font-bold text-gray-900">{totalInterviewers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{activeInterviewers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entrevistas</p>
                <p className="text-2xl font-bold text-gray-900">{totalInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{completedInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Interviewers List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Entrevistadores ({filteredInterviewers.length})
            </h2>
          </div>

          {filteredInterviewers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'Nenhum entrevistador encontrado' : 'Nenhum entrevistador cadastrado'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Entrevistadores aparecerão aqui quando se cadastrarem no sistema'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInterviewers.map((interviewer) => (
                <div key={interviewer.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        interviewer.is_active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {interviewer.is_active ? (
                          <UserCheck className="w-6 h-6 text-green-600" />
                        ) : (
                          <UserX className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">{interviewer.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            interviewer.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {interviewer.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          {interviewer.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{interviewer.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Desde {new Date(interviewer.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4" />
                            <span>{interviewer.total_interviews} entrevistas</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-4 h-4" />
                            <span>{interviewer.completed_interviews} concluídas</span>
                          </div>
                        </div>

                        {interviewer.last_activity && (
                          <div className="mt-2 text-sm text-gray-500">
                            Última atividade: {new Date(interviewer.last_activity).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleInterviewerStatus(interviewer.user_id)}
                        className={`font-medium py-2 px-4 rounded-lg transition-all ${
                          interviewer.is_active
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {interviewer.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
