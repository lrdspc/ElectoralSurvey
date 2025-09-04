import { useState } from 'react';
import { Check, FileText, Users, TrendingUp, MessageSquare, Star, ChevronRight } from 'lucide-react';
import { SURVEY_TEMPLATES } from '@/react-app/utils/statisticalCalculator';

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string | null) => void;
  onQuestionsImport?: (questions: any[]) => void;
}

const categoryStyles: { [key: string]: {
  base: string;
  border: string;
  bg: string;
  text: string;
  hoverBorder: string;
  hoverBg: string;
  iconBg: string;
  iconText: string;
  tagBg: string;
  tagText: string;
}} = {
  electoral: {
    base: 'blue',
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    hoverBorder: 'hover:border-blue-600',
    hoverBg: 'hover:bg-blue-100',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    tagBg: 'bg-blue-100',
    tagText: 'text-blue-700',
  },
  approval: {
    base: 'green',
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-900',
    hoverBorder: 'hover:border-green-600',
    hoverBg: 'hover:bg-green-100',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    tagBg: 'bg-green-100',
    tagText: 'text-green-700',
  },
  demographic: {
    base: 'purple',
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    hoverBorder: 'hover:border-purple-600',
    hoverBg: 'hover:bg-purple-100',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    tagBg: 'bg-purple-100',
    tagText: 'text-purple-700',
  },
  qualitative: {
    base: 'orange',
    border: 'border-orange-500',
    bg: 'bg-orange-50',
    text: 'text-orange-900',
    hoverBorder: 'hover:border-orange-600',
    hoverBg: 'hover:bg-orange-100',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    tagBg: 'bg-orange-100',
    tagText: 'text-orange-700',
  },
  default: {
    base: 'gray',
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    text: 'text-gray-800',
    hoverBorder: 'hover:border-gray-400',
    hoverBg: 'hover:bg-gray-100',
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-500',
    tagBg: 'bg-gray-100',
    tagText: 'text-gray-600',
  }
};

export default function TemplateSelector({ 
  selectedTemplate, 
  onTemplateSelect,
  onQuestionsImport 
}: TemplateSelectorProps) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'electoral': return <TrendingUp className="w-5 h-5" />;
      case 'approval': return <Star className="w-5 h-5" />;
      case 'demographic': return <Users className="w-5 h-5" />;
      case 'qualitative': return <MessageSquare className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTemplateColor = (category: string) => {
    switch (category) {
      case 'electoral': return 'blue';
      case 'approval': return 'green';
      case 'demographic': return 'purple';
      case 'qualitative': return 'orange';
      default: return 'gray';
    }
  };

  const getCategoryStyles = (category: string) => {
    return categoryStyles[category] || categoryStyles.default;
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = SURVEY_TEMPLATES[templateId as keyof typeof SURVEY_TEMPLATES];
    onTemplateSelect(templateId);
    
    if (onQuestionsImport && template.questions) {
      onQuestionsImport(template.questions);
    }
  };

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Templates de Pesquisa</h3>
          <p className="text-sm text-gray-600">Escolha um template para acelerar a criação</p>
        </div>
        
        {selectedTemplate && (
          <button
            onClick={() => onTemplateSelect(null)}
            className="text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            Criar do Zero
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Object.entries(SURVEY_TEMPLATES).map(([templateId, template]) => {
          const isSelected = selectedTemplate === templateId;
          const isExpanded = expandedTemplate === templateId;
          const styles = getCategoryStyles(template.category);
          
          return (
            <div key={templateId} className="group">
              <div 
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? `${styles.border} ${styles.bg}` 
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
                onClick={() => handleTemplateSelect(templateId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${styles.iconBg} rounded-xl flex items-center justify-center ${styles.iconText}`}>
                      {getTemplateIcon(template.category)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <span className={`px-2 py-1 ${styles.tagBg} ${styles.tagText} text-xs font-medium rounded-full`}>
                          {template.category === 'electoral' ? 'Eleitoral' :
                           template.category === 'approval' ? 'Aprovação' :
                           template.category === 'demographic' ? 'Demográfica' : 'Qualitativa'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{template.questions.length} perguntas</span>
                        <span>Margem: ±{template.sampleDefaults.marginOfError}%</span>
                        <span>Confiança: {template.sampleDefaults.confidenceLevel}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <div className={`w-6 h-6 bg-${styles.base}-600 rounded-full flex items-center justify-center`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(templateId);
                      }}
                      className={`p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Preview das Perguntas */}
              {isExpanded && (
                <div className="mt-2 ml-6 mr-6 mb-4 bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                  <h5 className="font-medium text-gray-900 mb-3">Preview das Perguntas:</h5>
                  <div className="space-y-3">
                    {template.questions.slice(0, 3).map((question, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {question.text}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>{
                                question.type === 'multiple_choice' ? 'Múltipla Escolha' :
                                question.type === 'text' ? 'Texto Livre' : 'Avaliação'
                              }</span>
                              {question.required && <span className="text-red-500">Obrigatória</span>}
                            </div>
                            {question.options && (
                              <div className="mt-2 text-xs text-gray-600">
                                Opções: {question.options.slice(0, 2).join(', ')}
                                {question.options.length > 2 && ` (+${question.options.length - 2} mais)`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {template.questions.length > 3 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        + {template.questions.length - 3} perguntas adicionais
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Template Personalizado */}
      <div 
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          !selectedTemplate 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
        }`}
        onClick={() => onTemplateSelect(null)}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            !selectedTemplate ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}>
            <FileText className="w-6 h-6" />
          </div>
          
          <div>
            <h4 className={`font-semibold ${!selectedTemplate ? 'text-blue-900' : 'text-gray-700'}`}>
              Pesquisa Personalizada
            </h4>
            <p className={`text-sm ${!selectedTemplate ? 'text-blue-700' : 'text-gray-500'}`}>
              Crie uma pesquisa do zero com suas próprias perguntas
            </p>
          </div>
          
          {!selectedTemplate && (
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
      
      {/* Dicas */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-amber-600 mt-0.5">💡</div>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Dicas para Escolher o Template</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• <strong>Eleitoral:</strong> Para intenção de voto e rejeição de candidatos</li>
              <li>• <strong>Aprovação:</strong> Para avaliar gestões e políticas públicas</li>
              <li>• <strong>Demográfica:</strong> Para entender o perfil do eleitorado</li>
              <li>• <strong>Qualitativa:</strong> Para opiniões abertas e análise de discurso</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
