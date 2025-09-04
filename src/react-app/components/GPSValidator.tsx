import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Wifi,
  WifiOff,
  Target
} from 'lucide-react';
import { GPSValidator as GPSValidatorUtil } from '@/react-app/utils/statisticalCalculator';
import type { GPSLocation, AssignedArea } from '@/react-app/utils/statisticalCalculator';

interface GPSValidatorProps {
  assignedAreas?: AssignedArea[];
  onLocationUpdate?: (location: GPSLocation | null, validation: any) => void;
  onJustificationRequired?: (required: boolean) => void;
  enableAutoRefresh?: boolean;
}

export default function GPSValidator({
  assignedAreas = [],
  onLocationUpdate,
  onJustificationRequired,
  enableAutoRefresh = true
}: GPSValidatorProps) {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GPSLocation | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkPermissionStatus();
    if (enableAutoRefresh) {
      startLocationTracking();
    }
    
    return () => {
      stopLocationTracking();
    };
  }, [enableAutoRefresh]);

  useEffect(() => {
    if (location && assignedAreas.length > 0) {
      const validationResult = GPSValidatorUtil.isLocationValid(location, assignedAreas);
      setValidation(validationResult);
      onLocationUpdate?.(location, validationResult);
      onJustificationRequired?.(!validationResult.isValid);
    } else if (location) {
      const defaultValidation = { isValid: true, assignedArea: null, distance: 0 };
      setValidation(defaultValidation);
      onLocationUpdate?.(location, defaultValidation);
      onJustificationRequired?.(false);
    }
  }, [location, assignedAreas, onLocationUpdate, onJustificationRequired]);

  const checkPermissionStatus = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissionStatus(result.state);
      } catch (error) {
        setPermissionStatus('unknown');
      }
    }
  };

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste dispositivo');
      setIsLoading(false);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0 // Forçar nova leitura
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      const newLocation: GPSLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

      // Only update if location has significantly changed
      const lastLocation = lastLocationRef.current;
      if (!lastLocation || 
          Math.abs(lastLocation.latitude - newLocation.latitude) > 0.0001 ||
          Math.abs(lastLocation.longitude - newLocation.longitude) > 0.0001 ||
          Math.abs(lastLocation.accuracy - newLocation.accuracy) > 10) {
        setLocation(newLocation);
        lastLocationRef.current = newLocation;
      }
      
      setPermissionStatus('granted');
    } catch (error: any) {
      let errorMessage = 'Erro ao obter localização';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada';
          setPermissionStatus('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Localização indisponível';
          break;
        case error.TIMEOUT:
          errorMessage = 'Timeout ao obter localização';
          break;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation || !enableAutoRefresh) return;

    // Clear existing watch if any
    stopLocationTracking();

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000 // Cache por 30 segundos para tracking
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
          const newLocation: GPSLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          const lastLocation = lastLocationRef.current;
          if (!lastLocation) {
            setLocation(newLocation);
            lastLocationRef.current = newLocation;
          } else {
            // Use the public method to calculate distance
            const validation = GPSValidatorUtil.isLocationValid(
              newLocation,
              []
            );
            if (validation.distance > 0.01) { // Atualizar se mover mais de 10m
              setLocation(newLocation);
              lastLocationRef.current = newLocation;
            }
          }
            setLocation(newLocation);
            lastLocationRef.current = newLocation;
          }
          
          setPermissionStatus('granted');
          setError(null);
        }, 500); // Debounce de 500ms
      },
      (error) => {
        let errorMessage = 'Erro no rastreamento GPS';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada';
            setPermissionStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout no rastreamento GPS';
            break;
        }
        
        setError(errorMessage);
      },
      options
    );

    watchIdRef.current = id;
  }, [enableAutoRefresh]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  const getStatusColor = () => {
    if (isLoading) return 'blue';
    if (!location) return 'gray';
    if (!validation) return 'blue';
    return validation.isValid ? 'green' : 'red';
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (!location) return <MapPin className="w-5 h-5" />;
    if (!validation) return <Navigation className="w-5 h-5" />;
    return validation.isValid ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />;
  };

  const getAccuracyText = (accuracy: number) => {
    if (accuracy < 10) return 'Excelente';
    if (accuracy < 50) return 'Boa';
    if (accuracy < 100) return 'Moderada';
    return 'Baixa';
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`border-2 rounded-xl p-6 transition-all ${
        getStatusColor() === 'green' ? 'border-green-200 bg-green-50' :
        getStatusColor() === 'red' ? 'border-red-200 bg-red-50' :
        getStatusColor() === 'blue' ? 'border-blue-200 bg-blue-50' :
        'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              getStatusColor() === 'green' ? 'bg-green-100 text-green-600' :
              getStatusColor() === 'red' ? 'bg-red-100 text-red-600' :
              getStatusColor() === 'blue' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Status da Localização</h3>
              <p className={`text-sm ${
                getStatusColor() === 'green' ? 'text-green-700' :
                getStatusColor() === 'red' ? 'text-red-700' :
                getStatusColor() === 'blue' ? 'text-blue-700' :
                'text-gray-600'
              }`}>
                {!location ? 'Localização não obtida' :
                 !validation ? 'Validando localização...' :
                 validation.isValid ? 'Localização válida' :
                 'Localização fora da área'}
              </p>
            </div>
          </div>
          
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isLoading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Obtendo...' : 'Atualizar'}
          </button>
        </div>

        {/* Location Details */}
        {location && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono text-gray-900">{formatCoordinate(location.latitude)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono text-gray-900">{formatCoordinate(location.longitude)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precisão:</span>
                <span className="text-gray-900">
                  {location.accuracy.toFixed(0)}m ({getAccuracyText(location.accuracy)})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Obtido em:</span>
                <span className="text-gray-900">
                  {new Date(location.timestamp).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Validation Results */}
        {validation && assignedAreas.length > 0 && (
          <div className={`p-4 rounded-lg ${
            validation.isValid ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <div className="flex items-start space-x-3">
              <div className={`w-5 h-5 mt-0.5 ${
                validation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {validation.isValid ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${
                  validation.isValid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {validation.isValid ? 'Localização Válida' : 'Localização Inválida'}
                </h4>
                <p className={`text-sm ${
                  validation.isValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validation.isValid 
                    ? `Você está na área ${validation.assignedArea}`
                    : `Você está a ${validation.distance.toFixed(1)}km da área ${validation.assignedArea}`
                  }
                </p>
                
                {!validation.isValid && (
                  <div className="mt-2 text-xs text-red-600">
                    {GPSValidatorUtil.generateLocationJustification(validation)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Erro de Localização</h4>
                <p className="text-sm text-red-700">{error}</p>
                
                {permissionStatus === 'denied' && (
                  <div className="mt-2 text-xs text-red-600">
                    Para usar esta funcionalidade, permita o acesso à localização nas configurações do navegador.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assigned Areas Info */}
      {assignedAreas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Áreas Atribuídas ({assignedAreas.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignedAreas.map((area, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{area.name}</span>
                  {validation && validation.assignedArea === area.name && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      validation.isValid 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {validation.isValid ? 'Atual' : 'Mais próxima'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Centro: {area.center.lat.toFixed(4)}, {area.center.lng.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-white rounded-lg p-3 border">
        <div className="flex items-center space-x-2">
          {navigator.onLine ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span>
            {navigator.onLine ? 'Online' : 'Offline'} - 
            {enableAutoRefresh ? ' Rastreamento ativo' : ' Rastreamento manual'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          Permissão: {
            permissionStatus === 'granted' ? '✓ Concedida' :
            permissionStatus === 'denied' ? '✗ Negada' :
            permissionStatus === 'prompt' ? '? Solicitando' :
            '? Desconhecida'
          }
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">💡 Dicas para Melhor Precisão</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Use o GPS em área aberta, longe de prédios altos</li>
          <li>• Aguarde alguns segundos para o GPS se estabilizar</li>
          <li>• Precision abaixo de 10m é considerada excelente</li>
          <li>• Em caso de erro, tente atualizar a localização</li>
        </ul>
      </div>
    </div>
  );
}
