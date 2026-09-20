import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import eventsHandler from './api/events.js'
import checkoutHandler from './api/checkout.js'
import checkoutSessionHandler from './api/checkout-session.js'
import stripeWebhookHandler from './api/stripe-webhook.js'
import { reconcileReservations } from './api/_inventory.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY
  process.env.SITE_URL = env.SITE_URL
  process.env.DATABASE_URL = env.DATABASE_URL
  process.env.STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET

  return {
    plugins: [
      react(),
      {
        name: 'bella-vita-local-api',
        configureServer(server) {
          const timer = setInterval(() => {
            if (process.env.DATABASE_URL) void reconcileReservations().catch(() => console.error('Unable to reconcile ticket reservations.'))
          }, 60_000)
          timer.unref()
          server.httpServer?.once('close', () => clearInterval(timer))
          server.middlewares.use(async (request, response, next) => {
            const path = request.url?.split('?')[0]
            if (path === '/api/events') return eventsHandler(request, response)
            if (path === '/api/checkout') return checkoutHandler(request, response)
            if (path === '/api/checkout-session') return checkoutSessionHandler(request, response)
            if (path === '/api/stripe-webhook') return stripeWebhookHandler(request, response)
            next()
          })
        },
      },
    ],
  }
})
