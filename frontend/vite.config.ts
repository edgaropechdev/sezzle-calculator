import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The page and the API share an origin in every shipped topology: this proxy
// in development, nginx in Docker. That is why the Go server carries no CORS
// headers. 8080 is the server's own default port.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
