# Bella Vita

## Events and Stripe

The `/events` page reads active, one-time Stripe Prices from `/api/events` and sends guests to a Stripe-hosted Checkout page through `/api/checkout`. Both endpoints run server-side so the secret key is never exposed to the browser.

To publish an event in Stripe:

1. Create an active Product and a one-time Price.
2. Add Product metadata `type=event`.
3. Add `event_date` as an ISO 8601 value (for example `2026-10-24T18:30:00-04:00`).
4. Optionally add `location`, `age`, and `capacity`; the product description and first product image also appear on the event card.
5. Add more one-time Prices to the same Product for ticket tiers. A Price's `ticket_name` and `ticket_description` metadata control its display copy (its nickname is used as a fallback name).

Copy `.env.example` to `.env.local`, add a Stripe test secret, and run the app with `npm run dev`. The Vite development server exposes the same Stripe API routes locally. Dokploy runs the production Node server with `npm start` after `npm run build`.

Ticket availability is stored in PostgreSQL by Price ID. See [the Dokploy inventory setup guide](docs/dokploy-inventory.md) for deployment, Stripe webhooks, initial inventory, local testing, and recovery. The guide includes the supplied 68-ticket and 8-ticket prices. Set `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SITE_URL` in Dokploy; initialize with `npm run inventory:setup` in the deployed application terminal. Test checkout using a Stripe sandbox before opening sales.

Dokploy's internal database hostname cannot resolve on your laptop. `npm run dev` can preview events with purchasing disabled when inventory is unreachable. `npm run dev:inventory` starts a separate local PostgreSQL instance for Stripe test-mode checkout.

## Frontend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
