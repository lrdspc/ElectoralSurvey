import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  city: string;
  neighborhoods: string;
  interviewData?: Array<{
    neighborhood: string;
    completed: number;
    target: number;
    coordinates?: { lat: number; lng: number };
    interviewers: string[];
  }>;
  onNeighborhoodClick?: (neighborhood: string) => void;
  className?: string;
}

interface NeighborhoodData {
  name: string;
  completed: number;
  target: number;
  percentage: number;
  status: 'completed' | 'in-progress' | 'delayed' | 'not-started';
  interviewers: string[];
  coordinates?: { lat: number; lng: number };
}

export default function InteractiveMap({ 
  city, 
  neighborhoods, 
  interviewData = [], 
  onNeighborhoodClick,
  className = "" 
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [neighborhoodData, setNeighborhoodData] = useState<NeighborhoodData[]>([]);

  // Processa dados dos bairros
  useEffect(() => {
    const neighborhoodNames = neighborhoods.split(',').map(n => n.trim());
    const processedData: NeighborhoodData[] = neighborhoodNames.map(name => {
      const data = interviewData.find(item => item.neighborhood === name) || {
        neighborhood: name,
        completed: 0,
        target: 10,
        interviewers: []
      };
      
      const percentage = data.target > 0 ? (data.completed / data.target) * 100 : 0;
      let status: NeighborhoodData['status'] = 'not-started';
      
      if (percentage >= 100) status = 'completed';
      else if (percentage >= 50) status = 'in-progress';
      else if (percentage > 0) status = 'delayed';
      
      return {
        name,
        completed: data.completed,
        target: data.target,
        percentage: Math.round(percentage),
        status,
        interviewers: data.interviewers,
        coordinates: data.coordinates
      };
    });
    
    setNeighborhoodData(processedData);
  }, [neighborhoods, interviewData]);

  // Cria o popup content
  const createPopupContent = useCallback((neighborhood: NeighborhoodData) => {
    return `
      <div class="p-3 min-w-[200px]">
        <h4 class="font-bold text-gray-900 mb-2">${neighborhood.name}</h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span>Progresso:</span>
            <span class="font-medium">${neighborhood.completed}/${neighborhood.target}</span>
          </div>
          <div class="flex justify-between">
            <span>Percentual:</span>
            <span class="font-medium ${neighborhood.percentage >= 100 ? 'text-green-600' : neighborhood.percentage >= 50 ? 'text-orange-600' : 'text-red-600'}">${neighborhood.percentage}%</span>
          </div>
          <div class="mt-2 pt-2 border-t">
            <div class="text-xs text-gray-600">
              Entrevistadores: ${neighborhood.interviewers.length > 0 ? neighborhood.interviewers.join(', ') : 'Nenhum atribuído'}
            </div>
          </div>
          ${onNeighborhoodClick ? `
            <button 
              class="mt-3 w-full bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700"
              onclick="document.dispatchEvent(new CustomEvent('neighborhoodClick', { detail: '${neighborhood.name}' }))">
              Gerenciar
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }, [onNeighborhoodClick]);

  // Inicializa o mapa Leaflet
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const L = await import('leaflet');
        
        delete (L as any).Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const cityCoordinates: { [key: string]: [number, number] } = {
          'São Paulo': [-23.5505, -46.6333],
          'Rio de Janeiro': [-22.9068, -43.1729],
          'Brasília': [-15.8267, -47.9218],
          'Salvador': [-12.9714, -38.5014],
          'Fortaleza': [-3.7327, -38.5267],
          'Belo Horizonte': [-19.9208, -43.9378],
          'Manaus': [-3.1190, -60.0217],
          'Curitiba': [-25.4284, -49.2733],
          'Recife': [-8.0476, -34.8770],
          'Porto Alegre': [-30.0346, -51.2177],
        };

        const defaultCoords: [number, number] = cityCoordinates[city] || [-14.2350, -51.9253];

        const mapInstance = L.map(mapRef.current).setView(defaultCoords, 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        mapInstanceRef.current = mapInstance;
        setIsLoading(false);

        // Adiciona listener para eventos de clique em bairros
        if (onNeighborhoodClick) {
          document.addEventListener('neighborhoodClick', ((e: CustomEvent) => {
            onNeighborhoodClick(e.detail);
          }) as EventListener);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (onNeighborhoodClick) {
        document.removeEventListener('neighborhoodClick', onNeighborhoodClick as EventListener);
      }
    };
  }, [city, onNeighborhoodClick]);

  // Atualiza os marcadores quando os dados mudam
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = require('leaflet');

    // Remove marcadores antigos
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Adiciona novos marcadores
    neighborhoodData.forEach(neighborhood => {
      if (neighborhood.coordinates) {
        const marker = L.marker([neighborhood.coordinates.lat, neighborhood.coordinates.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(createPopupContent(neighborhood));

        markersRef.current[neighborhood.name] = marker;
      }
    });
  }, [neighborhoodData, createPopupContent]);

  const getStatusIcon = (status: NeighborhoodData['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      case 'delayed': return AlertCircle;
      default: return MapPin;
    }
  };

  const getStatusText = (status: NeighborhoodData['status']) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Em Andamento';
      case 'delayed': return 'Atrasado';
      default: return 'Não Iniciado';
    }
  };

  const getStatusColor = (status: NeighborhoodData['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'delayed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mapa Interativo - {city}</h2>
            <p className="text-sm text-gray-600">Acompanhe o progresso por região em tempo real</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div 
                ref={mapRef}
                className="h-80 lg:h-96 w-full rounded-lg border border-gray-300 bg-gray-100"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Zap className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Carregando mapa...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Bairros */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">Status por Região</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {neighborhoodData.map(neighborhood => {
                const StatusIcon = getStatusIcon(neighborhood.status);
                
                return (
                  <div
                    key={neighborhood.name}
                    onClick={() => onNeighborhoodClick?.(neighborhood.name)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getStatusColor(neighborhood.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-4 h-4" />
                        <span className="font-medium text-gray-900 text-sm">
                          {neighborhood.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium">
                        {neighborhood.percentage}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{neighborhood.completed}/{neighborhood.target}</span>
                        <span>{getStatusText(neighborhood.status)}</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            neighborhood.status === 'completed' ? 'bg-green-500' :
                            neighborhood.status === 'in-progress' ? 'bg-orange-500' :
                            neighborhood.status === 'delayed' ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(neighborhood.percentage, 100)}%` }}
                        />
                      </div>
                      
                      {neighborhood.interviewers.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {neighborhood.interviewers.slice(0, 2).join(', ')}
                          {neighborhood.interviewers.length > 2 && ` +${neighborhood.interviewers.length - 2}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legenda</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Concluído (100%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Em Andamento (50-99%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Atrasado (1-49%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-700">Não Iniciado (0%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resumo Estatístico */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Regiões Concluídas',
              value: neighborhoodData.filter(n => n.status === 'completed').length,
              total: neighborhoodData.length,
              color: 'green'
            },
            {
              label: 'Em Andamento',
              value: neighborhoodData.filter(n => n.status === 'in-progress').length,
              total: neighborhoodData.length,
              color: 'orange'
            },
            {
              label: 'Atrasadas',
              value: neighborhoodData.filter(n => n.status === 'delayed').length,
              total: neighborhoodData.length,
              color: 'red'
            },
            {
              label: 'Não Iniciadas',
              value: neighborhoodData.filter(n => n.status === 'not-started').length,
              total: neighborhoodData.length,
              color: 'gray'
            },
          ].map(stat => (
            <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${
                stat.color === 'green' ? 'text-green-600' :
                stat.color === 'orange' ? 'text-orange-600' :
                stat.color === 'red' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">
                de {stat.total} regiões
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
