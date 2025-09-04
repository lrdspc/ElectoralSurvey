// Calculadora Estatística London Pesquisas
export interface SampleCalculationParams {
  populationSize: number;
  confidenceLevel: 95 | 99;
  marginOfError: number;
  expectedProportion: number;
  responseRate?: number;
}

export interface SampleResult {
  sampleSize: number;
  adjustedSampleSize: number;
  marginOfError: number;
  confidenceLevel: number;
  isFinitePopulation: boolean;
  recommendations: string[];
  geographicDistribution?: { [neighborhood: string]: number };
}

export class StatisticalCalculator {
  /**
   * Calcula o tamanho da amostra baseado nos parâmetros estatísticos
   */
  static calculateSampleSize(params: SampleCalculationParams): SampleResult {
    const { populationSize, confidenceLevel, marginOfError, expectedProportion, responseRate = 0.8 } = params;
    
    // Z-score baseado no nível de confiança
    const zScore = confidenceLevel === 95 ? 1.96 : 2.576;
    
    // Proporção e seu complemento
    const p = expectedProportion;
    const q = 1 - p;
    
    // Margem de erro como decimal
    const e = marginOfError / 100;
    
    // Cálculo da amostra (população infinita)
    const sampleInfinite = Math.ceil((zScore * zScore * p * q) / (e * e));
    
    let sampleSize = sampleInfinite;
    let isFinitePopulation = false;
    
    // Correção para população finita (se amostra > 5% da população)
    if (populationSize && sampleInfinite > populationSize * 0.05) {
      isFinitePopulation = true;
      sampleSize = Math.ceil(
        sampleInfinite / (1 + ((sampleInfinite - 1) / populationSize))
      );
    }
    
    // Ajuste pela taxa de resposta
    const adjustedSampleSize = Math.ceil(sampleSize / responseRate);
    
    // Recomendações baseadas nos parâmetros
    const recommendations = this.generateRecommendations({
      sampleSize,
      adjustedSampleSize,
      populationSize,
      marginOfError,
      confidenceLevel,
      isFinitePopulation
    });
    
    return {
      sampleSize,
      adjustedSampleSize,
      marginOfError,
      confidenceLevel,
      isFinitePopulation,
      recommendations
    };
  }
  
  /**
   * Distribui a amostra geograficamente por bairros
   */
  static calculateGeographicDistribution(
    totalSample: number,
    neighborhoods: Array<{ name: string; population: number }>
  ): { [neighborhood: string]: number } {
    const totalPopulation = neighborhoods.reduce((sum, n) => sum + n.population, 0);
    const distribution: { [neighborhood: string]: number } = {};
    
    neighborhoods.forEach(neighborhood => {
      const proportion = neighborhood.population / totalPopulation;
      const allocation = Math.max(1, Math.round(totalSample * proportion));
      distribution[neighborhood.name] = allocation;
    });
    
    // Ajuste fino para garantir que a soma seja exata
    const currentTotal = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    const diff = totalSample - currentTotal;
    
    if (diff !== 0) {
      // Adiciona/remove do maior bairro
      const largestNeighborhood = neighborhoods.reduce((max, n) => 
        n.population > max.population ? n : max
      );
      distribution[largestNeighborhood.name] += diff;
    }
    
    return distribution;
  }
  
  /**
   * Recalcula margem de erro com base nas entrevistas já realizadas
   */
  static recalculateMarginOfError(
    completedInterviews: number,
    confidenceLevel: 95 | 99
  ): number {
    const zScore = confidenceLevel === 95 ? 1.96 : 2.576;
    const p = 0.5; // Máxima variabilidade
    
    if (completedInterviews === 0) return 0;
    
    const marginOfError = (zScore * Math.sqrt(p * (1 - p) / completedInterviews)) * 100;
    return Math.round(marginOfError * 100) / 100;
  }
  
  /**
   * Valida se os parâmetros estatísticos são viáveis
   */
  static validateParameters(params: SampleCalculationParams): string[] {
    const errors: string[] = [];
    
    if (params.populationSize <= 0) {
      errors.push('População deve ser maior que zero');
    }
    
    if (params.marginOfError < 1 || params.marginOfError > 10) {
      errors.push('Margem de erro deve estar entre 1% e 10%');
    }
    
    if (params.expectedProportion < 0.1 || params.expectedProportion > 0.9) {
      errors.push('Proporção esperada deve estar entre 10% e 90%');
    }
    
    const result = this.calculateSampleSize(params);
    
    if (result.adjustedSampleSize > params.populationSize * 0.3) {
      errors.push('Amostra muito grande para a população (>30%)');
    }
    
    if (result.adjustedSampleSize < 100) {
      errors.push('Amostra muito pequena para análises confiáveis (mínimo 100)');
    }
    
    return errors;
  }
  
  /**
   * Gera recomendações baseadas nos resultados
   */
  private static generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.marginOfError > 5) {
      recommendations.push('Considere aumentar a amostra para reduzir a margem de erro');
    }
    
    if (data.adjustedSampleSize > data.sampleSize * 1.5) {
      recommendations.push('Taxa de resposta baixa. Planeje estratégias para aumentar participação');
    }
    
    if (data.isFinitePopulation) {
      recommendations.push('População finita detectada. Correção aplicada para maior precisão');
    }
    
    if (data.sampleSize > 1000) {
      recommendations.push('Amostra grande. Considere estratificação por bairros/segmentos');
    }
    
    return recommendations;
  }
  
  /**
   * Calcula poder estatístico para testes
   */
  static calculateStatisticalPower(
    sampleSize: number,
    effectSize: number = 0.05
  ): number {
    // Simplified power calculation for proportions
    const z_alpha = 1.96; // for alpha = 0.05
    const z_beta = Math.sqrt(sampleSize) * effectSize / Math.sqrt(0.25); // assuming p = 0.5
    
    // Convert to power (1 - beta)
    const power = 1 - this.normalCDF(z_alpha - z_beta);
    return Math.max(0, Math.min(1, power));
  }
  
  /**
   * Função auxiliar para cálculo de distribuição normal
   */
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return x > 0 ? 1 - prob : prob;
  }
}

/**
 * Templates de configuração para diferentes tipos de pesquisa
 */
export const SURVEY_TEMPLATES = {
  presidential: {
    id: 'presidential',
    name: 'Pesquisa Presidencial',
    description: 'Template para pesquisa de intenção de voto presidencial',
    category: 'electoral',
    sampleDefaults: {
      confidenceLevel: 95 as const,
      marginOfError: 3,
      expectedProportion: 0.5,
      responseRate: 0.8
    },
    questions: [
      {
        type: 'multiple_choice',
        text: 'Se as eleições presidenciais fossem hoje, em quem você votaria?',
        options: ['Candidato A', 'Candidato B', 'Candidato C', 'Branco/Nulo', 'Não sabe/Não respondeu'],
        required: true,
        order_index: 1
      },
      {
        type: 'multiple_choice',
        text: 'Como você avalia o governo atual?',
        options: ['Ótimo', 'Bom', 'Regular', 'Ruim', 'Péssimo', 'Não sabe'],
        required: true,
        order_index: 2
      }
    ]
  },
  
  municipal: {
    id: 'municipal',
    name: 'Pesquisa Municipal',
    description: 'Template para eleições municipais (prefeito)',
    category: 'electoral',
    sampleDefaults: {
      confidenceLevel: 95 as const,
      marginOfError: 4,
      expectedProportion: 0.5,
      responseRate: 0.75
    },
    questions: [
      {
        type: 'multiple_choice',
        text: 'Se as eleições para prefeito fossem hoje, em quem você votaria?',
        options: ['Candidato X', 'Candidato Y', 'Candidato Z', 'Branco/Nulo', 'Não sabe/Não respondeu'],
        required: true,
        order_index: 1
      },
      {
        type: 'multiple_choice',
        text: 'Qual o principal problema da cidade atualmente?',
        options: ['Saúde', 'Educação', 'Segurança', 'Transporte', 'Desemprego', 'Outro'],
        required: true,
        order_index: 2
      }
    ]
  },
  
  approval: {
    id: 'approval',
    name: 'Avaliação de Governo',
    description: 'Template para pesquisa de aprovação governamental',
    category: 'approval',
    sampleDefaults: {
      confidenceLevel: 95 as const,
      marginOfError: 3.5,
      expectedProportion: 0.5,
      responseRate: 0.85
    },
    questions: [
      {
        type: 'multiple_choice',
        text: 'Como você avalia a gestão do atual governo?',
        options: ['Ótimo', 'Bom', 'Regular', 'Ruim', 'Péssimo'],
        required: true,
        order_index: 1
      },
      {
        type: 'multiple_choice',
        text: 'Qual área você considera mais bem avaliada?',
        options: ['Economia', 'Saúde', 'Educação', 'Segurança', 'Infraestrutura', 'Nenhuma'],
        required: true,
        order_index: 2
      }
    ]
  },
  
  rejection: {
    id: 'rejection',
    name: 'Rejeição de Candidatos',
    description: 'Template para pesquisa de rejeição eleitoral',
    category: 'electoral',
    sampleDefaults: {
      confidenceLevel: 95 as const,
      marginOfError: 3,
      expectedProportion: 0.3,
      responseRate: 0.8
    },
    questions: [
      {
        type: 'multiple_choice',
        text: 'Em qual candidato você NÃO votaria de jeito nenhum?',
        options: ['Candidato A', 'Candidato B', 'Candidato C', 'Nenhum', 'Todos', 'Não sabe'],
        required: true,
        order_index: 1
      },
      {
        type: 'multiple_choice',
        text: 'Qual o principal motivo da sua rejeição?',
        options: ['Corrupção', 'Incompetência', 'Ideologia', 'Caráter', 'Propostas', 'Outro'],
        required: false,
        order_index: 2
      }
    ]
  },
  
  demographic: {
    id: 'demographic',
    name: 'Perfil do Eleitorado',
    description: 'Template para pesquisa de perfil demográfico',
    category: 'demographic',
    sampleDefaults: {
      confidenceLevel: 95 as const,
      marginOfError: 4,
      expectedProportion: 0.5,
      responseRate: 0.7
    },
    questions: [
      {
        type: 'multiple_choice',
        text: 'Qual sua faixa etária?',
        options: ['16-24 anos', '25-34 anos', '35-44 anos', '45-59 anos', '60 anos ou mais'],
        required: true,
        order_index: 1
      },
      {
        type: 'multiple_choice',
        text: 'Qual seu grau de escolaridade?',
        options: ['Fundamental incompleto', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Superior incompleto', 'Superior completo'],
        required: true,
        order_index: 2
      },
      {
        type: 'multiple_choice',
        text: 'Qual sua renda familiar?',
        options: ['Até 1 SM', '1-2 SM', '2-5 SM', '5-10 SM', 'Mais de 10 SM', 'Não informado'],
        required: false,
        order_index: 3
      }
    ]
  },
  
  qualitative: {
    id: 'qualitative',
    name: 'Pesquisa Qualitativa Rápida',
    description: 'Template para pesquisa qualitativa com perguntas abertas',
    category: 'qualitative',
    sampleDefaults: {
      confidenceLevel: 95 as const,
      marginOfError: 5,
      expectedProportion: 0.5,
      responseRate: 0.6
    },
    questions: [
      {
        type: 'text',
        text: 'Na sua opinião, qual é o principal problema do país atualmente?',
        options: null,
        required: true,
        order_index: 1
      },
      {
        type: 'text',
        text: 'Como você avalia a situação econômica atual?',
        options: null,
        required: true,
        order_index: 2
      },
      {
        type: 'multiple_choice',
        text: 'Você confia nas instituições democráticas?',
        options: ['Totalmente', 'Parcialmente', 'Pouco', 'Não confio', 'Não sei opinar'],
        required: true,
        order_index: 3
      }
    ]
  }
};

/**
 * Utilitários para randomização de respostas
 */
export class ResponseRandomizer {
  /**
   * Embaralha as opções de resposta mantendo itens fixos no final
   */
  static shuffleOptions(
    options: string[],
    fixedAtEnd: string[] = ['Não sabe', 'Não respondeu', 'Não sabe/Não respondeu', 'Branco/Nulo']
  ): { shuffled: string[]; order: number[] } {
    const fixed: string[] = [];
    const toShuffle: string[] = [];
    const originalOrder: number[] = [];
    
    options.forEach((option, index) => {
      if (fixedAtEnd.some(fixedOption => option.includes(fixedOption))) {
        fixed.push(option);
      } else {
        toShuffle.push(option);
        originalOrder.push(index);
      }
    });
    
    // Fisher-Yates shuffle
    const shuffledOptions = [...toShuffle];
    const shuffledOrder = [...originalOrder];
    
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      [shuffledOrder[i], shuffledOrder[j]] = [shuffledOrder[j], shuffledOrder[i]];
    }
    
    // Combina opções embaralhadas + opções fixas
    const finalOptions = [...shuffledOptions, ...fixed];
    const finalOrder = [...shuffledOrder, ...fixed.map((_, index) => options.length - fixed.length + index)];
    
    return {
      shuffled: finalOptions,
      order: finalOrder
    };
  }
  
  /**
   * Gera seed único para reproduzir randomização
   */
  static generateSeed(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * Reproduz randomização baseada em seed
   */
  static shuffleWithSeed(options: string[], seed: string): { shuffled: string[]; order: number[] } {
    // Implementação básica de PRNG com seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const rng = () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
    
    const shuffled = [...options];
    const order = options.map((_, i) => i);
    
    // Shuffle usando RNG com seed
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      [order[i], order[j]] = [order[j], order[i]];
    }
    
    return { shuffled, order };
  }
}

/**
 * Sistema de validação GPS
 */
export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface AssignedArea {
  name: string;
  boundaries: Array<{ lat: number; lng: number }>;
  center: { lat: number; lng: number };
  radius?: number;
}

export class GPSValidator {
  /**
   * Verifica se uma localização está dentro da área atribuída
   */
  static isLocationValid(
    location: GPSLocation,
    assignedAreas: AssignedArea[]
  ): { isValid: boolean; assignedArea: string | null; distance: number } {
    if (!assignedAreas.length) {
      return { isValid: true, assignedArea: null, distance: 0 };
    }
    
    for (const area of assignedAreas) {
      const isInside = this.pointInPolygon(
        { lat: location.latitude, lng: location.longitude },
        area.boundaries
      );
      
      if (isInside) {
        return {
          isValid: true,
          assignedArea: area.name,
          distance: this.calculateDistance(
            location.latitude,
            location.longitude,
            area.center.lat,
            area.center.lng
          )
        };
      }
    }
    
    // Se não está em nenhuma área, calcula a distância para a mais próxima
    const distances = assignedAreas.map(area => ({
      area: area.name,
      distance: this.calculateDistance(
        location.latitude,
        location.longitude,
        area.center.lat,
        area.center.lng
      )
    }));
    
    const closest = distances.reduce((min, current) => 
      current.distance < min.distance ? current : min
    );
    
    return {
      isValid: false,
      assignedArea: closest.area,
      distance: closest.distance
    };
  }
  
  /**
   * Algoritmo Point-in-Polygon (Ray Casting)
   */
  private static pointInPolygon(
    point: { lat: number; lng: number },
    polygon: Array<{ lat: number; lng: number }>
  ): boolean {
    const { lat: x, lng: y } = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const { lat: xi, lng: yi } = polygon[i];
      const { lat: xj, lng: yj } = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
  
  /**
   * Calcula distância entre dois pontos (Haversine)
   */
  private static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
  }
  
  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Gera justificativa automática para GPS inválido
   */
  static generateLocationJustification(
    validation: ReturnType<typeof GPSValidator.isLocationValid>
  ): string {
    if (validation.isValid) return '';
    
    const distance = validation.distance;
    const area = validation.assignedArea;
    
    if (distance < 0.5) {
      return `Localização próxima à área ${area} (${distance.toFixed(0)}m de distância)`;
    } else if (distance < 2) {
      return `Localização fora da área designada ${area} (${distance.toFixed(1)}km de distância)`;
    } else {
      return `Localização significativamente fora da área ${area} (${distance.toFixed(1)}km de distância)`;
    }
  }
}
