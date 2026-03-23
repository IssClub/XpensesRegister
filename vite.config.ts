import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/XpensesRegister/',
  build: {
    rollupOptions: {
      maxParallelFileOps: 128,
    },
  },
});
