import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../');  // ← points up to root where .env lives

  return {
    plugins: [react()],
    envDir: '../',                   // ← Vite reads .env from root
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});