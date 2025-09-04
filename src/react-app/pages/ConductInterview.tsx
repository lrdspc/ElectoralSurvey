import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useNotifications } from '@/react-app/contexts/NotificationContext';
import { useOfflineStorage } from '@/react-app/utils/offlineStorage';
import GPSValidator from '@/react-app/components/GPSValidator';
import { ResponseRandomizer } from '@/react-app/utils/statisticalCalculator';
import { 
  ArrowLeft, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  WifiOff,
  MapPin,
  Shuffle
} from 'lucide-react';
import type { Survey, SurveyQuestion } from '@/shared/types';
import type { GPSLocation } from '@/react-app/utils/statisticalCalculator';

interface Response {
  question_id: number;
  response_text: string;
}

export default function ConductInterview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError, showInfo, isOnline } = useNotifications();
  const { saveOfflineInterview, syncStatus } = useOfflineStorage();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [locationValidation, setLocationValidation] = useState<any>(null);
  const [locationJustification, setLocationJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [randomizationSeed] = useState(ResponseRandomizer.generateSeed());
  const [showGPSValidator, setShowGPSValidator] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveyRes, questionsRes] = await Promise.all([
          fetch(`/api/surveys/${id}`),
          fetch(`/api/surveys/${id}/questions`),
        ]);

        if (surveyRes.ok && questionsRes.ok) {
          const surveyData = await surveyRes.json();
          const questionsData = await questionsRes.json();
          
          setSurvey(surveyData);
          setOriginalQuestions(questionsData);
          
          // Randomize questions with multiple choice options
          const randomizedQuestions = questionsData.map((q: SurveyQuestion) => {
            if (q.question_type === 'multiple_choice' && q.options) {
              const options = JSON.parse(q.options);
              const { shuffled } = ResponseRandomizer.shuffleWithSeed(options, randomizationSeed);
              return {
                ...q,
                options: JSON.stringify(shuffled)
              };
            }
            return q;
          });
          
          setQuestions(randomizedQuestions);
          
          // Initialize responses array
          setResponses(questionsData.map((q: SurveyQuestion) => ({
            question_id: q.id,
            response_text: '',
          })));
        }
      } catch (error) {
        console.error('Error fetching survey:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleLocationUpdate = (newLocation: GPSLocation | null, validation: any) => {
    setLocation(newLocation);
    setLocationValidation(validation);
    
    if (!validation?.isValid) {
      setLocationJustification(
        validation ? validation.assignedArea 
          ? `Localização fora da área ${validation.assignedArea} (${validation.distance.toFixed(1)}km de distância)`
          : 'Localização não validada'
        : 'GPS indisponível'
      );
    } else {
      setLocationJustification('');
    }
  };

  const updateResponse = (questionId: number, responseText: string) => {
    setResponses(prev => prev.map(r => 
      r.question_id === questionId 
        ? { ...r, response_text: responseText }
        : r
    ));
    setIsDraftSaved(false);
  };

  const getCurrentResponse = (questionId: number) => {
    return responses.find(r => r.question_id === questionId)?.response_text || '';
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    const response = getCurrentResponse(currentQuestion.id);
    return !currentQuestion.is_required || response.trim() !== '';
  };

  const canSubmit = () => {
    return questions.every(question => {
      const response = getCurrentResponse(question.id);
      return !question.is_required || response.trim() !== '';
    });
  };

  const saveDraft = async () => {
    // In a real app, you'd save the draft to local storage or backend
    setIsDraftSaved(true);
    setTimeout(() => setIsDraftSaved(false), 2000);
  };

  const submitInterview = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    try {
      if (!isOnline) {
        // Save offline
        await saveOfflineInterview({
          survey_id: parseInt(id!),
          interviewer_id: 'current_user', // Will be set by the offline storage
          responses: responses.filter(r => r.response_text.trim() !== '').map(r => ({
            question_id: r.question_id,
            response_text: r.response_text
          })),
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp
          } : null
        });
        
        showInfo('Entrevista salva offline - será enviada quando houver conexão');
        navigate('/interviewer/dashboard');
        return;
      }

      // Online submission
      const interviewRes = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: parseInt(id!),
          latitude: location?.latitude,
          longitude: location?.longitude,
          location_justification: locationJustification || undefined,
          randomization_seed: randomizationSeed,
        }),
      });

      if (interviewRes.ok) {
        const interview = await interviewRes.json();
        
        // Submit responses with original question mapping
        const mappedResponses = responses.filter(r => r.response_text.trim() !== '').map(r => {
          const originalQuestion = originalQuestions.find(q => q.id === r.question_id);
          const currentQuestion = questions.find(q => q.id === r.question_id);
          
          let responseText = r.response_text;
          
          // If multiple choice, map back to original order
          if (originalQuestion?.question_type === 'multiple_choice' && originalQuestion.options && currentQuestion?.options) {
            const originalOptions = JSON.parse(originalQuestion.options);
            const currentOptions = JSON.parse(currentQuestion.options);
            const responseIndex = currentOptions.indexOf(responseText);
            if (responseIndex !== -1) {
              // Map to original option using the randomization seed
              const { order } = ResponseRandomizer.shuffleWithSeed(originalOptions, randomizationSeed);
              responseText = originalOptions[order[responseIndex]] || responseText;
            }
          }
          
          return {
            question_id: r.question_id,
            response_text: responseText
          };
        });
        
        const responsesRes = await fetch(`/api/interviews/${interview.id}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responses: mappedResponses,
          }),
        });

        if (responsesRes.ok) {
          showSuccess('Entrevista enviada com sucesso!');
          navigate('/interviewer/dashboard');
        } else {
          showError('Erro ao salvar respostas');
        }
      } else {
        showError('Erro ao criar entrevista');
      }
    } catch (error) {
      console.error('Error submitting interview:', error);
      
      // Try to save offline as fallback
      try {
        await saveOfflineInterview({
          survey_id: parseInt(id!),
          interviewer_id: 'current_user',
          responses: responses.filter(r => r.response_text.trim() !== '').map(r => ({
            question_id: r.question_id,
            response_text: r.response_text
          })),
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp
          } : null
        });
        
        showInfo('Erro na conexão - entrevista salva offline');
        navigate('/interviewer/dashboard');
      } catch (offlineError) {
        showError('Erro ao submeter entrevista');
      }
    } finally {
      setIsSubmitting(false);
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

  if (!survey || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesquisa não encontrada</h2>
          <button
            onClick={() => navigate('/interviewer/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/interviewer/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{survey.title}</h1>
                <p className="text-sm text-gray-600">Nova Entrevista</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGPSValidator(!showGPSValidator)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg transition-all flex items-center space-x-1 text-sm"
              >
                <MapPin className="w-4 h-4" />
                <span>GPS</span>
              </button>
              <button
                onClick={saveDraft}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-all flex items-center space-x-1 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
              {isDraftSaved && (
                <span className="text-green-600 text-sm">✓ Salvo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progresso da Entrevista</span>
          <span>{currentQuestionIndex + 1} de {questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* GPS Validator */}
      {showGPSValidator && (
        <div className="bg-white border-b">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <GPSValidator
              assignedAreas={[]} // TODO: Add assigned areas from survey config
              onLocationUpdate={handleLocationUpdate}
              onJustificationRequired={(required) => {
                if (!required) setLocationJustification('');
              }}
              enableAutoRefresh={true}
            />
          </div>
        </div>
      )}

      {/* Location Status */}
      {location && (
        <div className={`border-b px-4 py-2 ${
          locationValidation?.isValid ? 'bg-green-50' : 'bg-orange-50'
        }`}>
          <div className="flex items-center space-x-2 text-sm">
            <Navigation className="w-4 h-4" />
            <span className={locationValidation?.isValid ? 'text-green-700' : 'text-orange-700'}>
              {locationValidation?.isValid ? 'Localização válida' : 'Localização fora da área'}
            </span>
            <span className="text-gray-600">
              ({location.latitude.toFixed(6)}, {location.longitude.toFixed(6)})
            </span>
            {locationValidation?.distance > 0 && (
              <span className="text-orange-600">
                • {locationValidation.distance.toFixed(1)}km da área
              </span>
            )}
          </div>
        </div>
      )}

      {/* Offline Sync Status */}
      {syncStatus.pending > 0 && (
        <div className="bg-amber-50 border-b px-4 py-2">
          <div className="flex items-center space-x-2 text-sm text-amber-700">
            <WifiOff className="w-4 h-4" />
            <span>{syncStatus.pending} entrevistas aguardando sincronização</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Current Question */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-3 mb-4">
            <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {currentQuestionIndex + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900 flex-1">
                  {currentQuestion.question_text}
                </h2>
                {currentQuestion.question_type === 'multiple_choice' && (
                  <div className="ml-4 flex items-center text-xs text-gray-500">
                    <Shuffle className="w-3 h-3 mr-1" />
                    <span>Randomizado</span>
                  </div>
                )}
              </div>
              {currentQuestion.is_required && (
                <span className="inline-flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Pergunta obrigatória
                </span>
              )}
            </div>
          </div>

          {/* Answer Input */}
          <div className="mt-6">
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options ? (
              <div className="space-y-3">
                {JSON.parse(currentQuestion.options).map((option: string, index: number) => (
                  <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={getCurrentResponse(currentQuestion.id) === option}
                      onChange={(e) => updateResponse(currentQuestion.id, e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            ) : currentQuestion.question_type === 'rating' ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">1 (Muito ruim)</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateResponse(currentQuestion.id, rating.toString())}
                      className={`w-10 h-10 rounded-full border-2 font-semibold transition-all ${
                        getCurrentResponse(currentQuestion.id) === rating.toString()
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 text-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-600">5 (Muito bom)</span>
              </div>
            ) : (
              <textarea
                value={getCurrentResponse(currentQuestion.id)}
                onChange={(e) => updateResponse(currentQuestion.id, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Digite sua resposta..."
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all"
          >
            Anterior
          </button>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={!isCurrentQuestionAnswered()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={submitInterview}
              disabled={!canSubmit() || isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-8 rounded-xl transition-all flex items-center space-x-2"
            >
              {isOnline ? <Send className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>
                {isSubmitting 
                  ? 'Enviando...' 
                  : isOnline 
                    ? 'Finalizar Entrevista' 
                    : 'Salvar Offline'
                }
              </span>
            </button>
          )}
        </div>

        {/* Location Justification */}
        {!location && (
          <div className="bg-orange-50 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 mb-2">Localização não disponível</h3>
                <p className="text-sm text-orange-700 mb-3">
                  Explique onde está sendo realizada esta entrevista:
                </p>
                <textarea
                  value={locationJustification}
                  onChange={(e) => setLocationJustification(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  rows={2}
                  placeholder="Ex: Praça central do bairro, próximo ao mercado..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Offline Mode Info */}
        {!isOnline && (
          <div className="bg-orange-50 rounded-xl p-4 mb-6 border border-orange-200">
            <div className="flex items-center space-x-2 text-orange-800">
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">Modo Offline</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Sua entrevista será salva localmente e enviada automaticamente quando a conexão for restaurada.
            </p>
          </div>
        )}

        {/* Answer Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Resumo das Respostas
          </h3>
          
          <div className="space-y-3">
            {questions.map((question, index) => {
              const response = getCurrentResponse(question.id);
              const isAnswered = response.trim() !== '';
              
              return (
                <div key={question.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className={`text-sm ${isAnswered ? 'text-gray-900' : 'text-gray-500'}`}>
                      Pergunta {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAnswered ? (
                      <span className="text-green-600 text-sm">✓ Respondida</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Pendente</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
