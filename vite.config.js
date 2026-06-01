import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,   // Expose on 0.0.0.0 so phones on the same network can connect
    port: 5173,
  },
});
