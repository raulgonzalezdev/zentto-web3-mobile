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
  },
};

export default config;
