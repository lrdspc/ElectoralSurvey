import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Users, MapPin, ChevronRight } from 'lucide-react';

export default function LoginScreen() {
  const { redirectToLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'interviewer' | 'admin' | null>(null);

  const handleLogin = async (type: 'interviewer' | 'admin') => {
    setIsLoading(true);
    setUserType(type);
    
    try {
      await redirectToLogin();
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      setUserType(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mr-4" aria-hidden="true">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white">London Pesquisas</h1>
                <p className="text-blue-200 text-lg">Pesquisas Eleitorais e Opinião Pública</p>
              </div>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Tecnologia avançada com metodologia científica rigorosa para candidatos, partidos e órgãos públicos
            </p>
          </header>

          {/* Login Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto" role="group" aria-label="Opções de login">
            {/* Interviewer Login */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Entrevistador</h2>
                <p className="text-blue-200">
                  Realize entrevistas em campo com coleta de dados offline e sincronização automática
                </p>
              </div>
              
              <ul className="space-y-3 mb-6" aria-label="Recursos para entrevistadores">
                <li className="flex items-center text-blue-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3" aria-hidden="true"></div>
                  <span>Coleta de dados offline</span>
                </li>
                <li className="flex items-center text-blue-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3" aria-hidden="true"></div>
                  <span>Geolocalização automática</span>
                </li>
                <li className="flex items-center text-blue-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3" aria-hidden="true"></div>
                  <span>Interface otimizada para mobile</span>
                </li>
              </ul>

              <button
                onClick={() => handleLogin('interviewer')}
                disabled={isLoading}
                aria-busy={isLoading && userType === 'interviewer'}
                aria-label={isLoading && userType === 'interviewer' ? 'Entrando como entrevistador...' : 'Entrar como entrevistador'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center group-hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-blue-900"
              >
                {isLoading && userType === 'interviewer' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" role="status">
                    <span className="sr-only">Carregando...</span>
                  </div>
                ) : (
                  <>
                    <span>Entrar como Entrevistador</span>
                    <ChevronRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            {/* Admin Login */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Administrador</h2>
                <p className="text-blue-200">
                  Gerencie pesquisas, monitore progresso e gere relatórios profissionais em tempo real
                </p>
              </div>
              
              <ul className="space-y-3 mb-6" aria-label="Recursos para administradores">
                <li className="flex items-center text-blue-100">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" aria-hidden="true"></div>
                  <span>Dashboard analítico completo</span>
                </li>
                <li className="flex items-center text-blue-100">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" aria-hidden="true"></div>
                  <span>Relatórios em PDF e Excel</span>
                </li>
                <li className="flex items-center text-blue-100">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" aria-hidden="true"></div>
                  <span>Gestão de equipes</span>
                </li>
              </ul>

              <button
                onClick={() => handleLogin('admin')}
                disabled={isLoading}
                aria-busy={isLoading && userType === 'admin'}
                aria-label={isLoading && userType === 'admin' ? 'Entrando como administrador...' : 'Entrar como administrador'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center group-hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-900"
              >
                {isLoading && userType === 'admin' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" role="status">
                    <span className="sr-only">Carregando...</span>
                  </div>
                ) : (
                  <>
                    <span>Entrar como Administrador</span>
                    <ChevronRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto" role="list" aria-label="Recursos principais">
            <div className="text-center" role="listitem">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Geolocalização</h3>
              <p className="text-blue-200 text-sm">Coleta automática de coordenadas GPS para validação territorial</p>
            </div>
            
            <div className="text-center" role="listitem">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Trabalho Offline</h3>
              <p className="text-blue-200 text-sm">Continue trabalhando sem internet, sincronização automática</p>
            </div>
            
            <div className="text-center" role="listitem">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Relatórios</h3>
              <p className="text-blue-200 text-sm">Análises avançadas com gráficos e exportação profissional</p>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center mt-16">
            <p className="text-blue-300 text-sm">
              © 2024 London Pesquisas - Especializada em pesquisas eleitorais e opinião pública
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
