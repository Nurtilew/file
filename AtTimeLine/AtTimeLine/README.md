# AtTimeLine — QazaqFin AI

QazaqFin AI is a Coffee Bean-themed React + TypeScript demo for conversational AI, receipt/image analysis, installment calculations, and contract UI. It is a prototype, **not a real bank/payment service**. No real bank, credit-bureau, government database, payment processor, or legally binding electronic-signature provider is connected. Demo balances, credit scores, contracts, and OTP examples must not be treated as real financial/legal records.

## What was fixed

- Chat requests now go to a server-side AI endpoint using Gemini 3.8 Flash, with Gemini 3.6 Flash as a fallback model.
- The browser no longer stores or sends a shared Gemini API key. Legacy browser-stored keys are removed.
- When the AI backend is unconfigured, unavailable, rate-limited, or returns no usable output, the UI shows a clear error instead of pretending a canned reply came from AI.
- The AI receives recent conversation history and optional image input. Receipt scanning validates extracted fields and does not make up a default product/price when recognition fails.
- Prompts tell the model not to fabricate balances, approval odds, market prices, legal conclusions, or integrations that do not exist.
- Build output is generated cleanly into `dist`; stale `assets/` and `docs/` copies are not used as build sources.

## Deploy with a working AI backend (recommended: Netlify)

1. Push the contents of this project to a GitHub repository, then import that repository into Netlify.
2. In Netlify, open **Site configuration → Environment variables** and add `GEMINI_API_KEY` with your own Gemini API key. Do not paste this key into React code, `index.html`, GitHub, or a public file.
3. Trigger a fresh deploy. The `netlify.toml` file builds the site and maps `/api/ai/chat` to the Netlify Function.
4. Test the deployed chat with a normal general question, a follow-up that refers to the previous answer, and a receipt photo. Confirm that answers actually come from the model and that unavailable API/quota errors are shown truthfully.

Gemini API keys are secret credentials: Google advises keeping them out of client-side applications and using a backend proxy for production. See [Google's API-key guidance](https://ai.google.dev/gemini-api/docs/api-key).

## GitHub Pages limitation

GitHub Pages hosts static files only; it cannot run the included Node/Netlify server-side function. The interface can be published there, but the live AI will not work unless you point it to a separate secured backend. Do not put `GEMINI_API_KEY` in the browser bundle to make GitHub Pages appear to work. Use Netlify (or another serverless/backend host) for the actual AI endpoint.

## Local development

Requirements: Node.js 22 or later (recommended for the included Vite version).

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY to your own key
npm install
npm run dev
```

The Express development server listens on port `3000`. Set `JWT_SECRET` to a long random value for a stable server session. To generate the static site bundle, run `npm run build`; output is in `dist/`. The static bundle alone does not contain the AI key or backend function.

## Security and scope notes

- Never use a real card number, PIN, password, IIN, or banking credential in this demo.
- The visible demo balance is local application data, not a confirmed bank balance.
- Installment calculations are estimates; exact fees, APR/GESV, and contract terms must come from the actual provider.
- Contract/OTP screens are demo UI, not a legally verified e-signature or SMS delivery service.
- Before any public production launch, add authentication/authorization, durable database storage, rate limiting, abuse controls, logging with secret redaction, request validation, and a security review.

## Styling

The interface retains the Coffee Bean palette: espresso/mokka backgrounds, caramel highlights, and cream typography.
