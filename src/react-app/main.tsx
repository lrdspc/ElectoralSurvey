import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWA Installation and Offline Support
class PWAManager {
  private deferredPrompt: any = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.setupPWAInstallation();
    this.setupOfflineSupport();
    this.setupNotifications();
  }

  private setupPWAInstallation() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA foi instalado');
      this.deferredPrompt = null;
    });
  }

  private setupOfflineSupport() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineStatus();
    });

    // Initial check
    if (!this.isOnline) {
      this.showOfflineStatus();
    }
  }

  private setupNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notificações permitidas');
        }
      });
    }
  }

  private showInstallPrompt() {
    const existingPrompt = document.getElementById('pwa-install-prompt');
    if (existingPrompt) return;

    const promptDiv = document.createElement('div');
    promptDiv.id = 'pwa-install-prompt';
    promptDiv.className = 'pwa-install-prompt';
    promptDiv.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h3 class="font-semibold">Instalar ElectoralSurvey</h3>
          <p class="text-sm opacity-90">Adicione à tela inicial para acesso rápido e trabalho offline</p>
        </div>
        <div class="flex space-x-2 ml-4">
          <button id="pwa-install-btn" class="bg-white text-blue-600 px-4 py-2 rounded font-medium text-sm hover:bg-gray-100 transition-colors">
            Instalar
          </button>
          <button id="pwa-dismiss-btn" class="text-white px-2 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
            ✕
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(promptDiv);

    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('PWA instalado');
          }
          this.deferredPrompt = null;
          this.hideInstallPrompt();
        });
      }
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallPrompt();
    });

    // Auto hide after 10 seconds
    setTimeout(() => {
      this.hideInstallPrompt();
    }, 10000);
  }

  private hideInstallPrompt() {
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
      prompt.remove();
    }
  }

  private showOfflineStatus() {
    this.removeOnlineIndicator();
    
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    indicator.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-10 5h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>Você está offline. Os dados serão sincronizados quando a conexão for restaurada.</span>
      </div>
    `;
    document.body.appendChild(indicator);
  }

  private showOnlineStatus() {
    this.removeOfflineIndicator();
    
    const indicator = document.createElement('div');
    indicator.id = 'online-indicator';
    indicator.className = 'online-indicator';
    indicator.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span>Conexão restaurada. Sincronizando dados...</span>
      </div>
    `;
    document.body.appendChild(indicator);

    // Auto hide after 3 seconds
    setTimeout(() => {
      this.removeOnlineIndicator();
    }, 3000);
  }

  private removeOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  private removeOnlineIndicator() {
    const indicator = document.getElementById('online-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  public showNotification(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      });
    }
  }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Make PWA Manager available globally for components to use
declare global {
  interface Window {
    pwaManager: PWAManager;
  }
}
window.pwaManager = pwaManager;

// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
    
    // Send error to monitoring service in production
    if (import.meta.env.PROD) {
      // You could send this to a service like Sentry here
      console.log('Sending error to monitoring service:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Algo deu errado</h2>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Por favor, recarregue a página ou tente novamente.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Recarregar Página
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">Detalhes do erro (desenvolvimento)</summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring
if (import.meta.env.DEV) {
  // Web Vitals monitoring in development (optional)
  // import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
  //   getCLS(console.log);
  //   getFID(console.log);
  //   getFCP(console.log);
  //   getLCP(console.log);
  //   getTTFB(console.log);
  // });
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Development only: Hot module replacement
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept();
}
