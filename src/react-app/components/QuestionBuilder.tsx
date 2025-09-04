import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Type,
  List,
  Star,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export interface QuestionData {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating';
  options: string[];
  is_required: boolean;
  order_index: number;
}

interface QuestionBuilderProps {
  questions: QuestionData[];
  onChange: (questions: QuestionData[]) => void;
  readonly?: boolean;
}

export default function QuestionBuilder({ questions, onChange, readonly = false }: QuestionBuilderProps) {

  const [previewMode, setPreviewMode] = useState(false);

  const addQuestion = (type: QuestionData['question_type'] = 'multiple_choice') => {
    const newQuestion: QuestionData = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question_text: '',
      question_type: type,
      options: type === 'multiple_choice' ? [''] : [],
      is_required: true,
      order_index: questions.length
    };

    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (questionId: string, updates: Partial<QuestionData>) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    onChange(updatedQuestions);
  };

  const removeQuestion = (questionId: string) => {
    const filtered = questions.filter(q => q.id !== questionId);
    const reordered = filtered.map((q, index) => ({ ...q, order_index: index }));
    onChange(reordered);
  };

  const duplicateQuestion = (questionId: string) => {
    const original = questions.find(q => q.id === questionId);
    if (!original) return;

    const originalIndex = questions.findIndex(q => q.id === questionId);

    const duplicate: QuestionData = {
      ...original,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question_text: `${original.question_text} (cópia)`,
      order_index: originalIndex + 1
    };

    const newQuestions = [
      ...questions.slice(0, originalIndex + 1),
      duplicate,
      ...questions.slice(originalIndex + 1)
    ].map((q, index) => ({ ...q, order_index: index }));

    onChange(newQuestions);
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    updateQuestion(questionId, {
      options: [...question.options, '']
    });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newOptions = question.options.filter((_, index) => index !== optionIndex);
    updateQuestion(questionId, { options: newOptions });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || readonly) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualiza order_index
    const reordered = items.map((item, index) => ({
      ...item,
      order_index: index
    }));

    onChange(reordered);
  };

  const getQuestionTypeIcon = (type: QuestionData['question_type']) => {
    switch (type) {
      case 'multiple_choice': return List;
      case 'text': return Type;
      case 'rating': return Star;
      default: return List;
    }
  };

  const getQuestionTypeLabel = (type: QuestionData['question_type']) => {
    switch (type) {
      case 'multiple_choice': return 'Múltipla Escolha';
      case 'text': return 'Texto Livre';
      case 'rating': return 'Avaliação';
      default: return 'Múltipla Escolha';
    }
  };

  if (previewMode) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Preview do Questionário</h2>
            <button
              onClick={() => setPreviewMode(false)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Modo Edição
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {question.question_text || `Pergunta ${index + 1}`}
                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  
                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`preview_${question.id}`}
                            className="w-4 h-4 text-blue-600"
                            disabled
                          />
                          <span className="text-gray-700">{option || `Opção ${optionIndex + 1}`}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.question_type === 'text' && (
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Resposta em texto livre"
                      disabled
                    />
                  )}
                  
                  {question.question_type === 'rating' && (
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button key={rating} className="w-8 h-8 border border-gray-300 rounded text-sm" disabled>
                          {rating}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <List className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Construtor de Perguntas</h2>
              <p className="text-sm text-gray-600">{questions.length} pergunta{questions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          {!readonly && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(true)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
              >
                <EyeOff className="w-4 h-4" />
                <span>Preview</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pergunta adicionada</h3>
            <p className="text-gray-600 mb-6">Comece criando suas primeiras perguntas</p>
            
            {!readonly && (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => addQuestion('multiple_choice')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                  Múltipla Escolha
                </button>
                <button
                  onClick={() => addQuestion('text')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                  Texto Livre
                </button>
                <button
                  onClick={() => addQuestion('rating')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                  Avaliação
                </button>
              </div>
            )}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions" isDropDisabled={readonly}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {questions.map((question, index) => (
                    <Draggable 
                      key={question.id} 
                      draggableId={question.id} 
                      index={index}
                      isDragDisabled={readonly}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-3">
                            {!readonly && (
                              <div {...provided.dragHandleProps} className="mt-2">
                                <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-move" />
                              </div>
                            )}
                            
                            <div className="flex-1 space-y-4">
                              {/* Question Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {React.createElement(getQuestionTypeIcon(question.question_type), {
                                      className: 'w-4 h-4 text-gray-500'
                                    })}
                                    <span className="text-sm text-gray-600">
                                      {getQuestionTypeLabel(question.question_type)}
                                    </span>
                                  </div>
                                </div>
                                
                                {!readonly && (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => duplicateQuestion(question.id)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Duplicar pergunta"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => removeQuestion(question.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Remover pergunta"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Question Text */}
                              <div>
                                {readonly ? (
                                  <p className="text-gray-900 font-medium">
                                    {question.question_text || `Pergunta ${index + 1}`}
                                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    <textarea
                                      value={question.question_text}
                                      onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                                      placeholder="Digite o texto da pergunta..."
                                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      rows={2}
                                    />
                                    
                                    <div className="flex items-center justify-between">
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={question.is_required}
                                          onChange={(e) => updateQuestion(question.id, { is_required: e.target.checked })}
                                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Pergunta obrigatória</span>
                                      </label>

                                      <select
                                        value={question.question_type}
                                        onChange={(e) => updateQuestion(question.id, { 
                                          question_type: e.target.value as QuestionData['question_type'],
                                          options: e.target.value === 'multiple_choice' ? [''] : []
                                        })}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      >
                                        <option value="multiple_choice">Múltipla Escolha</option>
                                        <option value="text">Texto Livre</option>
                                        <option value="rating">Avaliação (1-5)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Question Options */}
                              {question.question_type === 'multiple_choice' && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-gray-900">Opções de Resposta</h4>
                                  
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center space-x-2">
                                      <div className="flex items-center space-x-2 flex-1">
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                        {readonly ? (
                                          <span className="text-gray-700">{option || `Opção ${optionIndex + 1}`}</span>
                                        ) : (
                                          <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                            placeholder={`Opção ${optionIndex + 1}`}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                          />
                                        )}
                                      </div>
                                      
                                      {!readonly && question.options.length > 1 && (
                                        <button
                                          onClick={() => removeOption(question.id, optionIndex)}
                                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                          title="Remover opção"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  
                                  {!readonly && (
                                    <button
                                      onClick={() => addOption(question.id)}
                                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span>Adicionar opção</span>
                                    </button>
                                  )}

                                  {/* Randomization Notice */}
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start space-x-2">
                                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium text-blue-900">Randomização Automática</p>
                                        <p className="text-xs text-blue-800">
                                          As opções serão embaralhadas automaticamente para cada entrevista, eliminando viés de ordem.
                                          Opções com "Não sabe", "Branco/Nulo" permanecem no final.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {question.question_type === 'rating' && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900">Escala de Avaliação (1-5)</h4>
                                  <div className="flex items-center space-x-2">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                      <div key={rating} className="flex flex-col items-center">
                                        <button 
                                          className="w-8 h-8 border-2 border-gray-300 rounded text-sm hover:bg-blue-50"
                                          disabled
                                        >
                                          {rating}
                                        </button>
                                        {rating === 1 && <span className="text-xs text-gray-500 mt-1">Ruim</span>}
                                        {rating === 5 && <span className="text-xs text-gray-500 mt-1">Ótimo</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {question.question_type === 'text' && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm text-gray-600">
                                    📝 Pergunta de texto livre. O entrevistador poderá digitar a resposta completa.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Add Question Buttons */}
        {!readonly && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => addQuestion('multiple_choice')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <List className="w-4 h-4" />
                <span>Múltipla Escolha</span>
              </button>
              
              <button
                onClick={() => addQuestion('text')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Type className="w-4 h-4" />
                <span>Texto Livre</span>
              </button>
              
              <button
                onClick={() => addQuestion('rating')}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>Avaliação</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
