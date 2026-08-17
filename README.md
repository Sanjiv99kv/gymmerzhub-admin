# GymmerzHub · Ops Console

Platform admin console for GymmerzHub. Manage gyms, members, content catalogs, subscriptions, revenue share, and payouts.

## Stack

- React 19 + TypeScript + Vite
- TanStack Router + TanStack Query
- Tailwind CSS v4

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Dev server: `http://localhost:5173`  
API default: `http://localhost:8800` (see `VITE_API_BASE_URL`)

Requires [gymmerzhub-backend](../gymmerzhub-backend) running locally.

## Environment

```bash
VITE_API_BASE_URL=http://localhost:8800
```

First platform admin is created via the backend setup endpoint (`PLATFORM_ADMIN_SETUP_KEY` in backend `.env`).

## Scripts

```bash
npm run dev          # local dev
npm run build        # production build
npm run build:dev   # development-mode build
npm run preview      # preview production build
npm run lint
npm run format
```

## Main routes

| Path | Purpose |
|------|---------|
| `/login` | Platform admin login |
| `/` | Dashboard |
| `/gyms` | Gyms list / detail |
| `/members` | Members across gyms |
| `/join-requests` | Join request oversight |
| `/workouts`, `/exercises` | Workout plan & exercise catalog |
| `/diets`, `/food-items` | Diet plans & food catalog |
| `/ai-plans` | AI plan oversight |
| `/subscriptions` | Member subscriptions |
| `/revenue-share`, `/payouts` | Gym revenue share & payouts |
| `/admins`, `/audit-logs` | Admins & audit |
| `/settings`, `/profile` | Console settings |

## Project layout

```
src/
  components/     # Admin UI + shared primitives
  lib/            # API client, auth, domain helpers
  routes/         # File-based routes
public/
```

## Related repos

- `gymmerzhub-backend` — API
- `gymmerzhub-hub` — gym owner portal
- `gymmerzhub-launch` — marketing site
