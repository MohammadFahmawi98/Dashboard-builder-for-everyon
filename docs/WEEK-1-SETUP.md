# DASHLY Week 1: Foundation Complete

## What Was Built

### Database
- PostgreSQL schema with 10 tables deployed on Railway
- Tables: users, workspaces, workspace_members, dashboards, queries, tiles, connectors, usage_tracking, share_tokens, alerts
- Indexes, foreign keys, cascade deletes, auto `updated_at` triggers

### Backend (Express + TypeScript) — `localhost:3001`
| Endpoint | Description |
|----------|-------------|
| GET / | API info |
| GET /health | Health check |
| POST /auth/signup | Register + get JWT |
| POST /auth/login | Login + get JWT |
| GET /auth/me | Get current user |
| PUT /auth/profile | Update name/email |
| POST /auth/change-password | Change password |
| GET /workspaces | List user workspaces |
| POST /workspaces | Create workspace |
| GET /workspaces/:id | Get workspace |
| PATCH /workspaces/:id | Update workspace |
| DELETE /workspaces/:id | Delete workspace |
| GET /workspaces/:id/members | List members |
| POST /workspaces/:id/members | Invite by email |

### Frontend (Vite + React TypeScript) — `localhost:5173`
- `/login` — Sign in page
- `/signup` — Register page
- `/dashboard` — Protected dashboard (placeholder)
- AuthContext + Zustand store for global auth state
- Axios client with JWT interceptors (auto-redirect on 401)
- TailwindCSS with DASHLY brand colors

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env        # fill in DATABASE_URL + JWT_SECRET
npm install
npm run dev                 # http://localhost:3001

# Frontend
cd frontend
cp .env.example .env        # set VITE_API_URL=http://localhost:3001
npm install
npm run dev                 # http://localhost:5173
```

## Project Structure

```
Dashly/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts    # pg pool + helpers
│   │   │   └── redis.ts       # Redis cache
│   │   ├── auth/
│   │   │   └── jwt.ts         # signToken / verifyToken
│   │   ├── middleware/
│   │   │   └── auth.ts        # requireAuth
│   │   ├── routes/
│   │   │   ├── auth.ts        # auth endpoints
│   │   │   └── workspaces.ts  # workspace CRUD
│   │   ├── db.ts              # pool re-export
│   │   └── index.ts           # Express server
│   ├── migrations/
│   │   └── dashly-schema.sql
│   ├── .env
│   ├── railway.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts      # axios instance
│   │   │   └── auth.ts        # auth API methods
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── store/
│   │   │   └── auth.ts        # Zustand store
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── vercel.json
│   └── tailwind.config.js
└── docs/
    └── WEEK-1-SETUP.md
```

## Deployment

### Backend → Railway
1. Push `backend/` to GitHub
2. Railway → New Service → GitHub repo
3. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=3001`
4. Railway auto-deploys on push

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Vercel → Import project
3. Set env var: `VITE_API_URL=https://your-backend.railway.app`
4. Vercel auto-deploys on push

## Week 2 Targets
- Login/Signup page improvements (confirm password, forgot password)
- Password reset flow
- User settings page
- Session management + token refresh
