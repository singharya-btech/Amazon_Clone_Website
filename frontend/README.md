# Frontend — Amazon Clone (Version 4)

Production-ready React 19 enterprise marketplace SPA styled with Tailwind CSS ("Atlas & Ledger" theme).

## Features
- Multi-role UI: Customer, Seller, and Admin interfaces
- Seller Portal: Storefront dashboard, inventory management, line-item fulfillment
- Admin Panel: Seller verification, product moderation, platform statistics
- Customer Support: Interactive ticket thread system with role-based responses
- Offline-first mock auth fallback for seamless local development

## Development
```bash
npm install
npm run dev
```

## Production Build & Containerization
```bash
npm run build
docker build -t aryasingh1234/amazone_clone:frontend-V4 .
```
