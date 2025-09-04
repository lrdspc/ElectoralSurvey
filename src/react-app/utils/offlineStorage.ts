// Sistema de Armazenamento Offline London Pesquisas
interface OfflineInterview {
  id: string;
  survey_id: number;
  interviewer_id: string;
  responses: Array<{
    question_id: number;
    response_text: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null;
  metadata: {
    collected_at: string;
    device_info: string;
    randomization_seed: string;
    sync_status: 'pending' | 'syncing' | 'synced' | 'error';
    sync_attempts: number;
    last_sync_attempt?: string;
    error_message?: string;
  };
}

export class OfflineStorageManager {
  private dbName = 'LondonPesquisasDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Inicializa o banco IndexedDB com cache de promise
   */
  async initialize(): Promise<void> {
    if (this.db) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        this.initPromise = null;
        reject(new Error('Erro ao abrir banco de dados offline'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para entrevistas offline
        if (!db.objectStoreNames.contains('interviews')) {
          const interviewStore = db.createObjectStore('interviews', { keyPath: 'id' });
          interviewStore.createIndex('survey_id', 'survey_id', { unique: false });
          interviewStore.createIndex('sync_status', 'metadata.sync_status', { unique: false });
        }

        // Store para pesquisas (cache)
        if (!db.objectStoreNames.contains('surveys')) {
          const surveyStore = db.createObjectStore('surveys', { keyPath: 'id' });
          surveyStore.createIndex('is_active', 'is_active', { unique: false });
        }

        // Store para perguntas das pesquisas
        if (!db.objectStoreNames.contains('survey_questions')) {
          const questionStore = db.createObjectStore('survey_questions', { keyPath: 'id' });
          questionStore.createIndex('survey_id', 'survey_id', { unique: false });
        }

        // Store para configurações
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Salva entrevista offline com validação
   */
  async saveOfflineInterview(interview: OfflineInterview): Promise<void> {
    await this.initialize();
    
    // Validate interview data
    if (!interview.id || !interview.survey_id || !interview.responses?.length) {
      throw new Error('Dados da entrevista inválidos');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interviews'], 'readwrite');
      const store = transaction.objectStore('interviews');
      
      // Use put instead of add to allow updates
      const request = store.put(interview);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erro ao salvar entrevista offline'));
      
      transaction.onerror = () => reject(new Error('Transação falhou'));
    });
  }

  /**
   * Lista entrevistas pendentes de sincronização com limite
   */
  async getPendingInterviews(limit: number = 50): Promise<OfflineInterview[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interviews'], 'readonly');
      const store = transaction.objectStore('interviews');
      const index = store.index('sync_status');
      
      const request = index.getAll('pending');
      
      request.onsuccess = () => {
        const results = request.result;
        // Limit results to prevent memory issues
        resolve(results.slice(0, limit));
      };
      request.onerror = () => reject(new Error('Erro ao buscar entrevistas pendentes'));
    });
  }

  /**
   * Atualiza status de sincronização
   */
  async updateSyncStatus(
    interviewId: string, 
    status: OfflineInterview['metadata']['sync_status'],
    errorMessage?: string
  ): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interviews'], 'readwrite');
      const store = transaction.objectStore('interviews');
      
      const getRequest = store.get(interviewId);
      
      getRequest.onsuccess = () => {
        const interview = getRequest.result;
        if (interview) {
          interview.metadata.sync_status = status;
          interview.metadata.sync_attempts = (interview.metadata.sync_attempts || 0) + 1;
          interview.metadata.last_sync_attempt = new Date().toISOString();
          
          if (errorMessage) {
            interview.metadata.error_message = errorMessage;
          }
          
          const putRequest = store.put(interview);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Erro ao atualizar status'));
        }
      };
      
      getRequest.onerror = () => reject(new Error('Entrevista não encontrada'));
    });
  }

  /**
   * Remove entrevista após sincronização
   */
  async removeSyncedInterview(interviewId: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interviews'], 'readwrite');
      const store = transaction.objectStore('interviews');
      
      const request = store.delete(interviewId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erro ao remover entrevista'));
    });
  }

  /**
   * Cache de pesquisas para acesso offline
   */
  async cacheSurvey(survey: any, questions: any[]): Promise<void> {
    if (!this.db) await this.initialize();

    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['surveys', 'survey_questions'], 'readwrite');
    
    // Cache survey
    const surveyStore = transaction.objectStore('surveys');
    surveyStore.put(survey);
    
    // Cache questions
    const questionStore = transaction.objectStore('survey_questions');
    questions.forEach(question => questionStore.put(question));
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Erro ao fazer cache da pesquisa'));
    });
  }

  /**
   * Recupera pesquisa do cache
   */
  async getCachedSurvey(surveyId: number): Promise<{ survey: any; questions: any[] } | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['surveys', 'survey_questions'], 'readonly');
      
      const surveyStore = transaction.objectStore('surveys');
      const questionStore = transaction.objectStore('survey_questions');
      
      const surveyRequest = surveyStore.get(surveyId);
      const questionRequest = questionStore.index('survey_id').getAll(surveyId);
      
      let survey: any = null;
      let questions: any[] = [];
      let completed = 0;
      
      surveyRequest.onsuccess = () => {
        survey = surveyRequest.result;
        completed++;
        if (completed === 2) resolve(survey && questions ? { survey, questions } : null);
      };
      
      questionRequest.onsuccess = () => {
        questions = questionRequest.result;
        completed++;
        if (completed === 2) resolve(survey && questions ? { survey, questions } : null);
      };
      
      surveyRequest.onerror = questionRequest.onerror = () => {
        reject(new Error('Erro ao recuperar pesquisa do cache'));
      };
    });
  }

  /**
   * Estatísticas de armazenamento offline
   */
  async getOfflineStats(): Promise<{
    pendingInterviews: number;
    syncingInterviews: number;
    errorInterviews: number;
    totalStorageUsed: number;
  }> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interviews'], 'readonly');
      const store = transaction.objectStore('interviews');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const interviews = request.result;
        
        const stats = {
          pendingInterviews: interviews.filter(i => i.metadata.sync_status === 'pending').length,
          syncingInterviews: interviews.filter(i => i.metadata.sync_status === 'syncing').length,
          errorInterviews: interviews.filter(i => i.metadata.sync_status === 'error').length,
          totalStorageUsed: this.estimateStorageSize(interviews)
        };
        
        resolve(stats);
      };
      
      request.onerror = () => reject(new Error('Erro ao calcular estatísticas offline'));
    });
  }

  /**
   * Estima tamanho usado no armazenamento
   */
  private estimateStorageSize(data: any[]): number {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size; // Size in bytes
  }

  /**
   * Limpa dados antigos (mais de 30 dias)
   */
  async cleanOldData(): Promise<void> {
    if (!this.db) await this.initialize();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interviews'], 'readwrite');
      const store = transaction.objectStore('interviews');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const interviews = request.result;
        const toDelete = interviews.filter(interview => 
          new Date(interview.metadata.collected_at) < thirtyDaysAgo &&
          interview.metadata.sync_status === 'synced'
        );
        
        toDelete.forEach(interview => {
          store.delete(interview.id);
        });
        
        resolve();
      };
      
      request.onerror = () => reject(new Error('Erro ao limpar dados antigos'));
    });
  }
}

/**
 * Sistema de Sincronização Automática
 */
export class SyncManager {
  private storageManager: OfflineStorageManager;
  private isSyncing = false;
  private syncInterval: number | null = null;
  private debounceTimer: number | null = null;

  constructor() {
    this.storageManager = new OfflineStorageManager();
    this.setupAutoSync();
  }

  /**
   * Configura sincronização automática
   */
  private setupAutoSync(): void {
    // Sincroniza quando fica online (com debounce)
    window.addEventListener('online', () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => this.syncPendingData(), 2000); // 2s debounce
    });

    // Sincroniza periodicamente usando requestIdleCallback
    const scheduleSync = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          if (navigator.onLine && !this.isSyncing) {
            this.syncPendingData();
          }
          this.syncInterval = window.setTimeout(scheduleSync, 5 * 60 * 1000);
        }, { timeout: 1000 });
      } else {
        // Fallback para setInterval
        this.syncInterval = window.setInterval(() => {
          if (navigator.onLine && !this.isSyncing) {
            this.syncPendingData();
          }
        }, 5 * 60 * 1000);
      }
    };
    
    scheduleSync();
  }

  /**
   * Sincroniza dados pendentes em lotes
   */
  async syncPendingData(batchSize: number = 10): Promise<{ success: number; errors: number; details: any[] }> {
    if (this.isSyncing || !navigator.onLine) {
      return { success: 0, errors: 0, details: [] };
    }

    this.isSyncing = true;
    let successCount = 0;
    let errorCount = 0;
    const details: any[] = [];

    try {
      await this.storageManager.initialize();
      const pendingInterviews = await this.storageManager.getPendingInterviews();

      for (let i = 0; i < pendingInterviews.length; i += batchSize) {
        const batch = pendingInterviews.slice(i, i + batchSize);
        const syncPromises = batch.map(async (interview) => {
          try {
            await this.storageManager.updateSyncStatus(interview.id, 'syncing');
            const success = await this.uploadInterview(interview);

            if (success) {
              await this.storageManager.updateSyncStatus(interview.id, 'synced');
              await this.storageManager.removeSyncedInterview(interview.id);
              successCount++;
              details.push({ id: interview.id, status: 'synced' });
            } else {
              throw new Error('Falha no upload da entrevista');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            await this.storageManager.updateSyncStatus(interview.id, 'error', errorMessage);
            errorCount++;
            details.push({ id: interview.id, status: 'error', error: errorMessage });
          }
        });
        
        await Promise.all(syncPromises);
      }
    } catch (error) {
      console.error('Error during sync:', error);
      details.push({ status: 'error', error: 'Erro geral no processo de sincronização' });
    } finally {
      this.isSyncing = false;
    }

    if (successCount > 0 || errorCount > 0) {
      OfflineNotificationManager.showSyncStatus(successCount, errorCount);
    }

    return { success: successCount, errors: errorCount, details };
  }

  /**
   * Upload de entrevista individual
   */
  private async uploadInterview(interview: OfflineInterview): Promise<boolean> {
    try {
      // Primeiro cria o interview
      const interviewResponse = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: interview.survey_id,
          latitude: interview.location?.latitude,
          longitude: interview.location?.longitude,
          location_justification: `Coletado offline em ${new Date(interview.metadata.collected_at).toLocaleString('pt-BR')}`
        })
      });

      if (!interviewResponse.ok) return false;

      const createdInterview = await interviewResponse.json();

      // Depois salva as respostas
      const responsesResponse = await fetch(`/api/interviews/${createdInterview.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: interview.responses
        })
      });

      return responsesResponse.ok;
    } catch (error) {
      console.error('Error uploading interview:', error);
      return false;
    }
  }

  /**
   * Força sincronização manual
   */
  async forcSync(): Promise<{ success: number; errors: number; details: any[] }> {
    this.isSyncing = false; // Reset flag
    return this.syncPendingData();
  }

  /**
   * Status da sincronização
   */
  async getSyncStatus(): Promise<{
    pending: number;
    syncing: number;
    errors: number;
    isOnline: boolean;
    isSyncing: boolean;
  }> {
    const stats = await this.storageManager.getOfflineStats();
    
    return {
      pending: stats.pendingInterviews,
      syncing: stats.syncingInterviews,
      errors: stats.errorInterviews,
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing
    };
  }

  /**
   * Limpa dados sincronizados
   */
  async cleanup(): Promise<void> {
    await this.storageManager.cleanOldData();
  }

  /**
   * Para sincronização automática
   */
  stop(): void {
    if (this.syncInterval !== null) {
      clearTimeout(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    window.removeEventListener('online', () => this.syncPendingData());
  }
}

/**
 * Utilitário para notificações offline
 */
export class OfflineNotificationManager {
  /**
   * Mostra notificação de status offline
   */
  static showOfflineStatus(pendingCount: number): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('London Pesquisas - Modo Offline', {
        body: `${pendingCount} entrevistas salvas localmente. Serão sincronizadas quando voltar online.`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    }
  }

  /**
   * Mostra notificação de sincronização
   */
  static showSyncStatus(success: number, errors: number): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = success > 0 ? 'Sincronização Concluída' : 'Erro na Sincronização';
      const body = success > 0 
        ? `${success} entrevistas sincronizadas com sucesso${errors > 0 ? `, ${errors} com erro` : ''}`
        : `${errors} entrevistas não puderam ser sincronizadas`;

      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    }
  }

  /**
   * Solicita permissão para notificações
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

// Instância global do gerenciador
let syncManagerInstance: SyncManager | null = null;

export const getSyncManager = (): SyncManager => {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }
  return syncManagerInstance;
};

import { useState, useEffect } from 'react';

/**
 * Hook para usar o sistema offline
 */
export const useOfflineStorage = () => {
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    syncing: 0,
    errors: 0,
    isOnline: navigator.onLine,
    isSyncing: false
  });

  const syncManager = getSyncManager();

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await syncManager.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Error updating sync status:', error);
      }
    };

    updateStatus();
    
    // Atualiza status a cada 10 segundos
    const interval = window.setInterval(updateStatus, 10000);
    
    // Monitor online/offline status
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      updateStatus();
    };
    
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncManager]);

  const forcSync = async () => {
    const result = await syncManager.forcSync();
    OfflineNotificationManager.showSyncStatus(result.success, result.errors);
    return result;
  };

  const saveOfflineInterview = async (interviewData: Omit<OfflineInterview, 'id' | 'metadata'>) => {
    const storageManager = new OfflineStorageManager();
    await storageManager.initialize();
    
    const interview: OfflineInterview = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...interviewData,
      metadata: {
        collected_at: new Date().toISOString(),
        device_info: navigator.userAgent,
        randomization_seed: Date.now().toString(36),
        sync_status: 'pending',
        sync_attempts: 0
      }
    };

    await storageManager.saveOfflineInterview(interview);
    OfflineNotificationManager.showOfflineStatus(syncStatus.pending + 1);
  };

  return {
    syncStatus,
    forcSync,
    saveOfflineInterview,
    getSyncManager: () => syncManager
  };
};
