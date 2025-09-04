import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const authError = searchParams.get('error');

      if (authError) {
        console.error('OAuth error:', authError);
        setError('Falha na autenticação. Por favor, tente novamente.');
        setTimeout(() => navigate('/?error=auth_failed'), 3000);
        return;
      }

      if (code) {
        try {
          await exchangeCodeForSessionToken();
          navigate('/');
        } catch (error) {
          console.error('Token exchange error:', error);
          setError('Erro ao processar autenticação. Por favor, tente novamente.');
          setTimeout(() => navigate('/?error=token_exchange_failed'), 3000);
        }
      } else {
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate, searchParams]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center"
      role="main"
      aria-live="polite"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full mx-4">
        {error ? (
          <div role="alert" className="text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-6" aria-hidden="true" />
            <h2 className="text-2xl font-bold mb-2">Erro de Autenticação</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecionando em alguns segundos...</p>
          </div>
        ) : (
          <>
            <div className="animate-spin mb-6" role="status" aria-label="Carregando">
              <Loader2 className="w-12 h-12 mx-auto text-blue-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Autenticando...</h2>
            <p className="text-gray-600">
              Processando seu login. Você será redirecionado em instantes.
            </p>
            <div 
              className="mt-6 flex items-center justify-center space-x-1" 
              aria-hidden="true"
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div 
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" 
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div 
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" 
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
