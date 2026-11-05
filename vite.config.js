import { defineConfig } from 'vite';

// The Maps key lives in .env as GOOGLE_MAPS_API_KEY. Vite only exposes
// variables whose names start with a listed prefix, so we add GOOGLE_MAPS_
// instead of asking anyone to rename the variable.
export default defineConfig({
  envPrefix: ['VITE_', 'GOOGLE_MAPS_'],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true, // the API key is restricted to http://localhost:5173/*
  },
  preview: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
});
