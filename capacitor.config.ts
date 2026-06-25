import type { CapacitorConfig } from '@capacitor/cli';
import { config as loadEnv } from 'dotenv';
import path from 'path';

/**
 * اپ اندروید از URL سرور Next.js لود می‌شود (SSR + API).
 *
 * env جدا از .env اصلی — تا NEXTAUTH_URL لوکال روی APK اثر نگذارد:
 *   prod (پیش‌فرض): .env.capacitor.prod → https://app.wibe.ir
 *   dev:            .env.capacitor.dev  → http://10.0.2.2:3003
 *
 * npm run cap:sync:prod   # قبل از build APK
 * npm run cap:sync:dev    # قبل از run روی امولاتور
 */
const CAP_ENV = process.env.CAPACITOR_ENV === 'dev' ? 'dev' : 'prod';
const DEFAULT_PROD_URL = 'https://app.wibe.ir';
const DEFAULT_DEV_URL = 'http://10.0.2.2:3003';

loadEnv({ path: path.resolve(process.cwd(), `.env.capacitor.${CAP_ENV}`) });

const serverUrl = (
  process.env.CAPACITOR_SERVER_URL ||
  (CAP_ENV === 'dev' ? DEFAULT_DEV_URL : DEFAULT_PROD_URL)
).replace(/\/$/, '');

const isLocalDev =
  CAP_ENV === 'dev' ||
  /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\./.test(serverUrl) ||
  serverUrl.includes('ngrok');

const config: CapacitorConfig = {
  appId: 'ir.wibecur.app',
  appName: 'WibeCur',
  webDir: 'capacitor-shell',
  // server.url عمداً حذف شده — MainActivity مستقیماً WebView را به APP_URL وصل می‌کند
  android: {
    allowMixedContent: isLocalDev,
    backgroundColor: '#E5E7EB',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 4000,
      launchAutoHide: true,
      backgroundColor: '#6366F1',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#6366F1',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
