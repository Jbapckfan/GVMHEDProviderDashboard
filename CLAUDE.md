# GVMH ED Provider Dashboard

## Quick Reference
- **Aliases**: "gvmh dashboard", "gvmh ed provider dashboard", "gvmhed dashboard"
- **Local Path**: `/Users/jamesalford/Projects/Archive/GVMHEDProviderDashboard`

## Deployment
| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://gvmhed-provider-dashboard.vercel.app |
| **Backend (Render)** | https://gvmh-backend.onrender.com |
| **GitHub** | https://github.com/Jbapckfan/GVMHEDProviderDashboard |

## Tech Stack
- **Frontend**: React 18 + Vite, deployed on Vercel
- **Backend**: Express.js + Turso (SQLite), deployed on Render
- **Database**: SQLite with libsql client (files stored as base64 for persistence)

## Deployment
Push to `main` branch triggers auto-deploy on both Vercel and Render.

## Environment Variables
- **Frontend** (`.env`): `VITE_API_URL=https://gvmh-backend.onrender.com/api`
- **Backend**: `ADMIN_PASSWORD` (default: admin123), `NODE_ENV`
