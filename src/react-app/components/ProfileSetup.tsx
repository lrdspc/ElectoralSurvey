import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '@/react-app/hooks/useUserProfile';
import { Users, BarChart3, User, Phone, AlertCircle } from 'lucide-react';

export default function ProfileSetup() {
  const { user } = useAuth();
  const { createProfile } = useUserProfile();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: 'interviewer' as 'interviewer' | 'admin',
    name: user?.google_user_data?.name || '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    role: false,
    name: false,
    phone: false
  });

  // Validação em tempo real
  const getValidationState = () => {
    const errors = {
      role: !formData.role ? 'Selecione um tipo de usuário' : '',
      name: !formData.name.trim() ? 'Nome é obrigatório' : '',
      phone: formData.phone && !/^\(\d{2}\)\s\d{5}-\d{4}$/.test(formData.phone) ? 
        'Formato inválido. Use (99) 99999-9999' : ''
    };
    return errors;
  };

  const validationErrors = getValidationState();
  const hasErrors = Object.values(validationErrors).some(error => error);

  // Formata o telefone automaticamente
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marca todos os campos como tocados para mostrar validações
    setTouched({
      role: true,
      name: true,
      phone: true
    });

    if (hasErrors) {
      setError('Por favor, corrija os erros no formulário');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProfile({
        role: formData.role as 'interviewer' | 'admin',
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
      });

      const defaultRoute = formData.role === 'admin' ? '/admin/dashboard' : '/interviewer/dashboard';
      navigate(defaultRoute);
    } catch (err) {
      console.error('Profile creation error:', err);
      setError('Erro ao criar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900" role="main">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <header className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Configure seu Perfil</h1>
            <p className="text-gray-600">
              Complete suas informações para começar a usar o ElectoralSurvey
            </p>
          </header>

          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" 
              role="alert" 
              aria-live="polite"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" aria-hidden="true" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Role Selection */}
            <fieldset>
              <legend className="block text-sm font-semibold text-gray-900 mb-3">
                Tipo de Usuário *
              </legend>
              <div 
                className="grid grid-cols-1 gap-3" 
                role="radiogroup" 
                aria-required="true"
                aria-invalid={touched.role && !!validationErrors.role}
                aria-errormessage={touched.role && validationErrors.role ? 'role-error' : undefined}
              >
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="interviewer"
                    checked={formData.role === 'interviewer'}
                    onChange={(e) => {
                      setFormData({ ...formData, role: e.target.value as 'interviewer' });
                      setTouched({ ...touched, role: true });
                    }}
                    className="sr-only"
                    aria-label="Selecionar papel de entrevistador"
                  />
                  <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.role === 'interviewer'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.role === 'interviewer' ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <Users className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Entrevistador</h3>
                        <p className="text-sm text-gray-600">Realizar entrevistas em campo</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => {
                      setFormData({ ...formData, role: e.target.value as 'admin' });
                      setTouched({ ...touched, role: true });
                    }}
                    className="sr-only"
                    aria-label="Selecionar papel de administrador"
                  />
                  <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.role === 'admin'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.role === 'admin' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        <BarChart3 className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Administrador</h3>
                        <p className="text-sm text-gray-600">Gerenciar pesquisas e relatórios</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              {touched.role && validationErrors.role && (
                <p className="mt-2 text-sm text-red-600" id="role-error" role="alert">
                  {validationErrors.role}
                </p>
              )}
            </fieldset>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setTouched({ ...touched, name: true });
                  }}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.name && validationErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Seu nome completo"
                  required
                  aria-required="true"
                  aria-invalid={touched.name && !!validationErrors.name}
                  aria-errormessage={touched.name && validationErrors.name ? 'name-error' : undefined}
                />
              </div>
              {touched.name && validationErrors.name && (
                <p className="mt-2 text-sm text-red-600" id="name-error" role="alert">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                Telefone <span className="text-gray-500">(opcional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                    setTouched({ ...touched, phone: true });
                  }}
                  onBlur={() => setTouched({ ...touched, phone: true })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.phone && validationErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="(99) 99999-9999"
                  aria-invalid={touched.phone && !!validationErrors.phone}
                  aria-errormessage={touched.phone && validationErrors.phone ? 'phone-error' : undefined}
                />
              </div>
              {touched.phone && validationErrors.phone && (
                <p className="mt-2 text-sm text-red-600" id="phone-error" role="alert">
                  {validationErrors.phone}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || hasErrors}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-busy={isSubmitting}
              aria-disabled={isSubmitting || hasErrors}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2" role="status">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                  <span>Criando perfil...</span>
                </div>
              ) : (
                'Finalizar Configuração'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Ao continuar, você concorda com nossos termos de uso e política de privacidade
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
