import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.zentto.web3app',
  appName: 'Zentto',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      // Lo ocultamos manualmente desde main.tsx tras cargar el bundle.
      launchAutoHide: false,
      backgroundColor: '#0b0e1a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'small',
      spinnerColor: '#6366f1',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
