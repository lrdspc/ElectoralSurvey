import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertCircle, CheckCircle, Users, Target } from 'lucide-react';
import { StatisticalCalculator, SURVEY_TEMPLATES } from '@/react-app/utils/statisticalCalculator';
import type { SampleCalculationParams, SampleResult } from '@/react-app/utils/statisticalCalculator';

interface SampleCalculatorProps {
  onCalculationChange?: (result: SampleResult) => void;
  initialParams?: Partial<SampleCalculationParams>;
  templateId?: string;
}

export default function SampleCalculator({ 
  onCalculationChange, 
  initialParams,
  templateId 
}: SampleCalculatorProps) {
  const [params, setParams] = useState<SampleCalculationParams>({
    populationSize: initialParams?.populationSize || 100000,
    confidenceLevel: initialParams?.confidenceLevel || 95,
    marginOfError: initialParams?.marginOfError || 3,
    expectedProportion: initialParams?.expectedProportion || 0.5,
    responseRate: initialParams?.responseRate || 0.8,
  });

  const [result, setResult] = useState<SampleResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Aplica defaults do template selecionado
  useEffect(() => {
    if (templateId && SURVEY_TEMPLATES[templateId as keyof typeof SURVEY_TEMPLATES]) {
      const template = SURVEY_TEMPLATES[templateId as keyof typeof SURVEY_TEMPLATES];
      setParams(prev => ({
        ...prev,
        ...template.sampleDefaults
      }));
    }
  }, [templateId]);

  // Recalcula sempre que parâmetros mudam
  useEffect(() => {
    const validationErrors = StatisticalCalculator.validateParameters(params);
    setErrors(validationErrors);
    
    if (validationErrors.length === 0) {
      const calculation = StatisticalCalculator.calculateSampleSize(params);
      setResult(calculation);
      onCalculationChange?.(calculation);
    } else {
      setResult(null);
      onCalculationChange?.(null as any);
    }
  }, [params, onCalculationChange]);

  const updateParam = (key: keyof SampleCalculationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Calculadora Estatística</h2>
            <p className="text-sm text-gray-600">Configure os parâmetros para calcular a amostra</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Parâmetros de Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* População */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tamanho da População
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={params.populationSize}
                onChange={(e) => updateParam('populationSize', parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 100000"
                min="1"
              />
            </div>
          </div>

          {/* Margem de Erro */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Margem de Erro (%)
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={params.marginOfError}
                onChange={(e) => updateParam('marginOfError', parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 3"
                min="1"
                max="10"
                step="0.1"
              />
            </div>
          </div>

          {/* Nível de Confiança */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nível de Confiança
            </label>
            <select
              value={params.confidenceLevel}
              onChange={(e) => updateParam('confidenceLevel', parseInt(e.target.value) as 95 | 99)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={95}>95% (padrão)</option>
              <option value={99}>99% (alta precisão)</option>
            </select>
          </div>

          {/* Proporção Esperada */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Proporção Esperada
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={params.expectedProportion}
                onChange={(e) => updateParam('expectedProportion', parseFloat(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0.5}>50% (máxima variabilidade)</option>
                <option value={0.3}>30%</option>
                <option value={0.4}>40%</option>
                <option value={0.6}>60%</option>
                <option value={0.7}>70%</option>
              </select>
            </div>
          </div>

          {/* Taxa de Resposta */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Taxa de Resposta Esperada (%)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="20"
                max="100"
                value={params.responseRate! * 100}
                onChange={(e) => updateParam('responseRate', parseInt(e.target.value) / 100)}
                className="flex-1"
              />
              <span className="w-16 text-center font-medium text-gray-900">
                {Math.round(params.responseRate! * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Baixa (20%)</span>
              <span>Média (60%)</span>
              <span>Alta (100%)</span>
            </div>
          </div>
        </div>

        {/* Erros de Validação */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Parâmetros Inválidos
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Resultado do Cálculo */}
        {result && (
          <div className="space-y-6">
            {/* Resultados Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900 mb-1">
                  {result.sampleSize.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Amostra Teórica</div>
              </div>

              <div className="bg-green-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900 mb-1">
                  {result.adjustedSampleSize.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Amostra Ajustada</div>
              </div>

              <div className="bg-purple-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900 mb-1">
                  ±{result.marginOfError}%
                </div>
                <div className="text-sm text-purple-700">Margem de Erro</div>
              </div>
            </div>

            {/* Detalhes Estatísticos */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Detalhes do Cálculo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nível de Confiança:</span>
                    <span className="font-medium text-gray-900">{result.confidenceLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">População Finita:</span>
                    <span className="font-medium text-gray-900">
                      {result.isFinitePopulation ? 'Sim (correção aplicada)' : 'Não'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxa de Resposta:</span>
                    <span className="font-medium text-gray-900">{Math.round(params.responseRate! * 100)}%</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proporção:</span>
                    <span className="font-medium text-gray-900">{Math.round(params.expectedProportion * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amostra vs População:</span>
                    <span className="font-medium text-gray-900">
                      {((result.adjustedSampleSize / params.populationSize) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Poder Estatístico:</span>
                    <span className="font-medium text-gray-900">
                      {(StatisticalCalculator.calculateStatisticalPower(result.sampleSize) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendações */}
            {result.recommendations.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                  Recomendações Estatísticas
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-amber-800 text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Guia de Interpretação */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Interpretação dos Resultados</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Amostra Teórica</h4>
                  <p className="text-blue-800 mb-3">
                    Número mínimo de entrevistas necessárias para atingir a margem de erro desejada.
                  </p>
                  
                  <h4 className="font-semibold text-blue-900 mb-2">Amostra Ajustada</h4>
                  <p className="text-blue-800">
                    Número real de entrevistas considerando a taxa de resposta esperada.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Margem de Erro</h4>
                  <p className="text-blue-800 mb-3">
                    Precisão estatística dos resultados. Menor valor = maior precisão.
                  </p>
                  
                  <h4 className="font-semibold text-blue-900 mb-2">Interpretação</h4>
                  <div className="space-y-1 text-blue-800">
                    <div>• ≤ 2%: Excelente precisão</div>
                    <div>• 3-4%: Boa precisão</div>
                    <div>• 5%+: Precisão moderada</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
