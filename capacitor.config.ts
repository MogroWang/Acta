import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mws.acta',
  appName: 'Acta 行记',
  webDir: 'dist',
  android: {
    backgroundColor: '#e7e7e3',
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_acta',
      iconColor: '#526b55',
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#e7e7e3',
      style: 'DARK',
    },
  },
};

export default config;
