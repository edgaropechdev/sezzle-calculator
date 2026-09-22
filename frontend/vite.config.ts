import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

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
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Coverage is measured over the layer that unit tests can reach without
      // a browser: the API client, the error wording and the operation
      // catalogue. The components and the hook that drives them are rendered
      // code — measuring them here would report a number for files no test
      // opens. What that leaves untested is named in the README rather than
      // hidden behind an average.
      include: ['src/api/**/*.ts', 'src/lib/**/*.ts', 'src/components/operations.ts'],
      // Report every measured file, including the ones at 100%: a table that
      // silently drops them reads as if they were never tested.
      skipFull: false,
    },
  },
})
