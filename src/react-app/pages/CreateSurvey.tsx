import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, GripVertical, MapPin, Calendar, Users, Save } from 'lucide-react';
import SampleCalculator from '@/react-app/components/SampleCalculator';
import TemplateSelector from '@/react-app/components/TemplateSelector';
import type { SampleResult } from '@/react-app/utils/statisticalCalculator';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating';
  options: string[];
  is_required: boolean;
  order_index: number;
}

export default function CreateSurvey() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sampleCalculation, setSampleCalculation] = useState<SampleResult | null>(null);
  
  const [surveyData, setSurveyData] = useState({
    title: '',
    city: '',
    neighborhoods: '',
    sample_size: 100,
    deadline_date: '',
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q1',
      question_text: '',
      question_type: 'multiple_choice',
      options: [''],
      is_required: true,
      order_index: 0,
    }
  ]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      question_text: '',
      question_type: 'multiple_choice',
      options: [''],
      is_required: true,
      order_index: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: [...question.options, '']
      });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options.length > 1) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const questionsPayload = questions.map((q, index) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? JSON.stringify(q.options.filter(opt => opt.trim())) : undefined,
        is_required: q.is_required,
        order_index: index,
      }));

      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...surveyData,
          neighborhoods: surveyData.neighborhoods,
          questions: questionsPayload,
          template_id: selectedTemplate || undefined,
          statistical_config: sampleCalculation ? {
            confidence_level: sampleCalculation.confidenceLevel,
            margin_of_error: sampleCalculation.marginOfError,
            is_finite_population: sampleCalculation.isFinitePopulation
          } : undefined,
        }),
      });

      if (response.ok) {
        const survey = await response.json();
        navigate(`/admin/surveys/${survey.id}`);
      } else {
        alert('Erro ao criar pesquisa');
      }
    } catch (error) {
      console.error('Error creating survey:', error);
      alert('Erro ao criar pesquisa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return true; // Template step always allows proceed
    }
    if (currentStep === 2) {
      return surveyData.title && surveyData.city && surveyData.neighborhoods && surveyData.deadline_date;
    }
    if (currentStep === 3) {
      return questions.every(q => q.question_text.trim() && 
        (q.question_type !== 'multiple_choice' || q.options.some(opt => opt.trim())));
    }
    return true;
  };

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
                <h1 className="text-xl font-bold text-gray-900">Nova Pesquisa</h1>
                <p className="text-sm text-gray-600">Crie uma nova pesquisa eleitoral</p>
              </div>
            </div>
            <button
              onClick={() => {/* Save draft logic */}}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Rascunho</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step === 1 && 'Template'}
                    {step === 2 && 'Informações & Amostra'}
                    {step === 3 && 'Perguntas'}
                    {step === 4 && 'Revisão'}
                  </p>
                </div>
                {step < 4 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha um Template</h2>
              <p className="text-gray-600">Selecione um template pré-configurado ou crie uma pesquisa personalizada</p>
            </div>
            
            <TemplateSelector
              selectedTemplate={selectedTemplate || undefined}
              onTemplateSelect={setSelectedTemplate}
              onQuestionsImport={(templateQuestions) => {
                const mappedQuestions = templateQuestions.map((q, index) => ({
                  id: `q${index + 1}`,
                  question_text: q.text,
                  question_type: q.type as Question['question_type'],
                  options: q.options || [''],
                  is_required: q.required,
                  order_index: index,
                }));
                setQuestions(mappedQuestions);
              }}
            />
          </div>
        )}

        {/* Step 2: Basic Information & Sample Calculation */}
        {currentStep === 2 && (
          <div className="space-y-8">
            {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuração da Pesquisa</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Título da Pesquisa *
                </label>
                <input
                  type="text"
                  id="title"
                  value={surveyData.title}
                  onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Pesquisa de Intenção de Voto - Eleições 2024"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-900 mb-2">
                  Cidade *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="city"
                    value={surveyData.city}
                    onChange={(e) => setSurveyData({ ...surveyData, city: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sample_size" className="block text-sm font-semibold text-gray-900 mb-2">
                  Tamanho da Amostra *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    id="sample_size"
                    value={surveyData.sample_size}
                    onChange={(e) => setSurveyData({ ...surveyData, sample_size: parseInt(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="neighborhoods" className="block text-sm font-semibold text-gray-900 mb-2">
                  Bairros/Regiões *
                </label>
                <textarea
                  id="neighborhoods"
                  value={surveyData.neighborhoods}
                  onChange={(e) => setSurveyData({ ...surveyData, neighborhoods: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Digite os bairros separados por vírgula (ex: Centro, Vila Nova, Jardim América)"
                />
              </div>

              <div>
                <label htmlFor="deadline_date" className="block text-sm font-semibold text-gray-900 mb-2">
                  Prazo Final *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    id="deadline_date"
                    value={surveyData.deadline_date}
                    onChange={(e) => setSurveyData({ ...surveyData, deadline_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
            </div>

            {/* Sample Calculator */}
            <SampleCalculator
              templateId={selectedTemplate || undefined}
              onCalculationChange={(result) => {
                setSampleCalculation(result);
                if (result) {
                  setSurveyData(prev => ({
                    ...prev,
                    sample_size: result.adjustedSampleSize
                  }));
                }
              }}
              initialParams={{
                populationSize: 100000,
                confidenceLevel: 95,
                marginOfError: 3,
                expectedProportion: 0.5,
                responseRate: 0.8
              }}
            />
          </div>
        )}

        {/* Step 3: Questions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Perguntas da Pesquisa</h2>
                <button
                  onClick={addQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Pergunta</span>
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                          {index + 1}
                        </span>
                      </div>
                      {questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Texto da Pergunta *
                        </label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Digite sua pergunta aqui..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Tipo de Pergunta
                          </label>
                          <select
                            value={question.question_type}
                            onChange={(e) => updateQuestion(question.id, { 
                              question_type: e.target.value as Question['question_type'],
                              options: e.target.value === 'multiple_choice' ? [''] : []
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="multiple_choice">Múltipla Escolha</option>
                            <option value="text">Texto Livre</option>
                            <option value="rating">Avaliação (1-5)</option>
                          </select>
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={question.is_required}
                              onChange={(e) => updateQuestion(question.id, { is_required: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">Pergunta obrigatória</span>
                          </label>
                        </div>
                      </div>

                      {question.question_type === 'multiple_choice' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Opções de Resposta
                          </label>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={`Opção ${optionIndex + 1}`}
                                />
                                {question.options.length > 1 && (
                                  <button
                                    onClick={() => removeOption(question.id, optionIndex)}
                                    className="text-red-600 hover:text-red-700 p-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => addOption(question.id)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Adicionar Opção</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Revisão da Pesquisa</h2>
            
            <div className="space-y-8">
              {/* Survey Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Template:</strong> {selectedTemplate ? 'Template selecionado' : 'Pesquisa personalizada'}</p>
                  <p><strong>Título:</strong> {surveyData.title}</p>
                  <p><strong>Cidade:</strong> {surveyData.city}</p>
                  <p><strong>Bairros:</strong> {surveyData.neighborhoods}</p>
                  <p><strong>Amostra:</strong> {surveyData.sample_size} entrevistas</p>
                  <p><strong>Prazo:</strong> {new Date(surveyData.deadline_date).toLocaleDateString('pt-BR')}</p>
                  {sampleCalculation && (
                    <p><strong>Margem de Erro:</strong> ±{sampleCalculation.marginOfError}% (Confiança: {sampleCalculation.confidenceLevel}%)</p>
                  )}
                </div>
              </div>

              {/* Questions Review */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Perguntas ({questions.length})</h3>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-2">{question.question_text}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Tipo: {
                              question.question_type === 'multiple_choice' ? 'Múltipla Escolha' :
                              question.question_type === 'text' ? 'Texto Livre' : 'Avaliação'
                            }</span>
                            <span>{question.is_required ? 'Obrigatória' : 'Opcional'}</span>
                          </div>
                          {question.question_type === 'multiple_choice' && question.options.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 mb-1">Opções:</p>
                              <ul className="text-sm text-gray-800 ml-4">
                                {question.options.filter(opt => opt.trim()).map((option, idx) => (
                                  <li key={idx}>• {option}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all"
          >
            Anterior
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-8 rounded-xl transition-all flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar Pesquisa</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
