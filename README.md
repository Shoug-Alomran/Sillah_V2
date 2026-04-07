# Sillah V2

## Phase 5 (CS340) - Production Setup

Phase 5 now runs from the same Vercel frontend deployment using serverless API routes under `frontend/api`.

Implemented endpoints:
- `GET /api/health`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/family-members`
- `POST /api/family-members`
- `DELETE /api/family-members/:id`
- `GET /api/queries/:qid`

## Required Vercel Environment Variables (Frontend Project)

Set these in the Vercel project that deploys `frontend/`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Optional:
- `VITE_API_BASE`  
  Leave empty to use same-origin `/api` routes (recommended for this setup).

## Important Routing

`frontend/vercel.json` is configured so:
- existing files and `/api/*` functions are served directly
- everything else rewrites to `/index.html` for SPA routing

## Deploy Checklist

1. Push latest code.
2. In Vercel, confirm Root Directory is `frontend`.
3. Add DB env vars above in Vercel Project Settings.
4. Redeploy.
5. Verify:
   - `https://<your-domain>/api/health` returns JSON
   - `https://<your-domain>/phase5-demo` loads Users/Family Members/Queries

## Notes

- `server/` is still available for local Express development.
- Phase 5 in production no longer requires a separate backend URL if using `frontend/api/*`.
