# Routes

File-based routing via TanStack Router. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/` — those are Next.js conventions.
The only root layout is `src/routes/__root.tsx`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `login.tsx` | `/login` |
| `members.tsx` | `/members` layout (`<Outlet />`) |
| `members.index.tsx` | `/members/` |
| `members.$id.tsx` | `/members/:id` |
| `gyms.index.tsx` | `/gyms/` |
| `gyms.$id.tsx` | `/gyms/:id` |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.
