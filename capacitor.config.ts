import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.keuanganpintar.app',
  appName: 'DIAMOND Finance AI',
  webDir: 'out',
  server: {
    url: 'https://project-4vdfh.vercel.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  overrideUserAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
};

export default config;
