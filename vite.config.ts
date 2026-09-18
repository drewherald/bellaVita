import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import eventsHandler from './api/events.js'
import checkoutHandler from './api/checkout.js'
import checkoutSessionHandler from './api/checkout-session.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY
  process.env.SITE_URL = env.SITE_URL

  return {
    plugins: [
      react(),
      {
        name: 'bella-vita-local-api',
        configureServer(server) {
          server.middlewares.use(async (request, response, next) => {
            const path = request.url?.split('?')[0]
            if (path === '/api/events') return eventsHandler(request, response)
            if (path === '/api/checkout') return checkoutHandler(request, response)
            if (path === '/api/checkout-session') return checkoutSessionHandler(request, response)
            next()
          })
        },
      },
    ],
  }
})
