import React from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/* Core CSS de Ionic — obligatorio */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/display.css';

/* Modo oscuro de Ionic (forzado) */
import '@ionic/react/css/palettes/dark.always.css';

/* Tema Zentto */
import './theme/zentto.css';

import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { LockProvider } from './auth/LockContext';

setupIonicReact({ mode: 'md' });

// Ocultar el splash nativo una vez cargado el bundle (carga dinámica para no
// exigir el plugin en web). Evita el flash blanco por defecto.
void (async () => {
  try {
    const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    }
  } catch {
    /* sin plugin (web): no-op */
  }
})();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LockProvider>
          <App />
        </LockProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
