import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import type { Survey, SurveyQuestion } from '@/shared/types';

interface QuestionForm {
  id?: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating';
  options: string[];
  is_required: boolean;
  order_index: number;
}

export default function EditSurvey() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    neighborhoods: '',
    sample_size: 100,
    deadline_date: '',
  });
  
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

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
          setFormData({
            title: surveyData.title,
            city: surveyData.city,
            neighborhoods: surveyData.neighborhoods,
            sample_size: surveyData.sample_size,
            deadline_date: surveyData.deadline_date.split('T')[0],
          });
          
          setQuestions(questionsData.map((q: SurveyQuestion) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options ? JSON.parse(q.options) : [],
            is_required: q.is_required,
            order_index: q.order_index,
          })));
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

  const handleSave = async () => {
    if (!survey) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/surveys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate(`/admin/surveys/${id}`);
      } else {
        alert('Erro ao salvar pesquisa');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      alert('Erro ao salvar pesquisa');
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuestionForm = {
      question_text: '',
      question_type: 'multiple_choice',
      options: ['Opção 1', 'Opção 2'],
      is_required: true,
      order_index: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push(`Opção ${updated[questionIndex].options.length + 1}`);
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
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
                <h1 className="text-xl font-bold text-gray-900">Editar Pesquisa</h1>
                <p className="text-sm text-gray-600">{survey.title}</p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Survey Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informações da Pesquisa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Pesquisa *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Pesquisa Eleitoral Prefeito 2024"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: São Paulo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairros/Regiões *
              </label>
              <input
                type="text"
                value={formData.neighborhoods}
                onChange={(e) => setFormData({ ...formData, neighborhoods: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Centro, Vila Nova, Jardim América"
              />
              <p className="text-sm text-gray-500 mt-1">Separe os bairros por vírgula</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho da Amostra *
              </label>
              <input
                type="number"
                value={formData.sample_size}
                onChange={(e) => setFormData({ ...formData, sample_size: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 1000"
                min="1"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Limite *
              </label>
              <input
                type="date"
                value={formData.deadline_date}
                onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Perguntas da Pesquisa</h2>
            <button
              onClick={addQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Pergunta</span>
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {questionIndex + 1}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto da Pergunta *
                    </label>
                    <textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Digite sua pergunta aqui..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Pergunta
                      </label>
                      <select
                        value={question.question_type}
                        onChange={(e) => updateQuestion(questionIndex, 'question_type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          onChange={(e) => updateQuestion(questionIndex, 'is_required', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Pergunta obrigatória</span>
                      </label>
                    </div>
                  </div>

                  {question.question_type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opções de Resposta
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Opção ${optionIndex + 1}`}
                            />
                            <button
                              onClick={() => removeOption(questionIndex, optionIndex)}
                              className="text-red-600 hover:text-red-700 p-2"
                              disabled={question.options.length <= 2}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(questionIndex)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          + Adicionar opção
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pergunta adicionada</h3>
              <p className="text-gray-600 mb-6">Adicione pelo menos uma pergunta para sua pesquisa</p>
              <button
                onClick={addQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Adicionar Primeira Pergunta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
