# GVMH ED Provider Dashboard

A comprehensive dashboard for the GVMH Emergency Department providers to track schedules, KPI metrics, phone directory, news updates, and more.

## Live Dashboard

**Production URL:** https://gvmh-ed-frontend.fly.dev

## Features

- **KPI Metrics Upload** - Upload and display KPI metrics images
- **Schedule Viewer** - View provider schedules from Google Sheets (November/December 2025)
- **Phone Directory** - Quick reference for important phone numbers (admin-editable with drag-to-reorder)
- **News Updates** - Post and manage department news and updates (admin-protected)
- **Provider Chart Status** - Track outstanding and delinquent charts by provider (admin-protected)
- **KPI Goals** - Set and track progress toward KPI targets (admin-protected)
- **Message Board** - Provider-to-provider communication (no password required)
- **Dark Mode** - Toggle between light and dark themes

## Admin Access

**Admin Password:** `admin123`

Features requiring admin password:
- Edit Phone Directory
- Add/Edit News Updates
- Manage Provider Chart Status
- Set KPI Goals

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Jbapckfan/GVMHEDProviderDashboard.git
cd GVMHEDProviderDashboard
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Start development servers:
```bash
# Terminal 1 - Backend (runs on port 3001)
cd backend
npm start

# Terminal 2 - Frontend (runs on port 3000)
cd frontend
npm run dev
```

4. Open http://localhost:3000 in your browser

## Deployment

### Backend Deployment

```bash
cd ~/GVMHEDProviderDashboard/backend
fly deploy
```

### Frontend Deployment

```bash
cd ~/GVMHEDProviderDashboard/frontend
fly deploy
```

## Backup & Recovery

### Code Backup
All code is backed up to GitHub:
- Repository: https://github.com/Jbapckfan/GVMHEDProviderDashboard
- Push changes: `git push origin main`

### Data Backup (Fly.io Volumes)

**Create a snapshot:**
```bash
fly volumes snapshots create vol_r6391depxd6e6gqr --app gvmh-ed-backend
```

**List snapshots:**
```bash
fly volumes snapshots list vol_r6391depxd6e6gqr --app gvmh-ed-backend
```

**Volume Information:**
- Volume ID: `vol_r6391depxd6e6gqr`
- Size: 1 GB
- Contains: SQLite database + uploaded files
- Retention: 5 days (automatic)

**Recommended backup schedule:** Weekly or before major changes

### Restore from Snapshot
If you need to restore data from a snapshot, contact Fly.io support or see: https://fly.io/docs/volumes/volume-manage/

## Fly.io Apps

- **Backend:** `gvmh-ed-backend` (https://gvmh-ed-backend.fly.dev)
- **Frontend:** `gvmh-ed-frontend` (https://gvmh-ed-frontend.fly.dev)

### Monitoring

**View logs:**
```bash
# Backend logs
fly logs --app gvmh-ed-backend

# Frontend logs
fly logs --app gvmh-ed-frontend
```

**Check status:**
```bash
fly status --app gvmh-ed-backend
fly status --app gvmh-ed-frontend
```

**View resource usage:**
```bash
fly dashboard
```

## Free Tier Usage

Current configuration stays within Fly.io's free tier:
- 2 VMs (backend + frontend)
- 256MB RAM each
- 1GB persistent storage
- ~2GB bandwidth/month

**Free tier limits:**
- 3 VMs with 256MB RAM
- 3GB storage total
- 160GB bandwidth/month

## Tech Stack

### Frontend
- React 18
- Vite
- Axios
- CSS3 with Dark Mode

### Backend
- Node.js 18
- Express.js
- SQLite (better-sqlite3)
- Multer (file uploads)

### Deployment
- Fly.io (hosting)
- Docker (containerization)
- Nginx (frontend web server)

## Project Structure

```
GVMHEDProviderDashboard/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server
│   │   └── database.js        # SQLite database
│   ├── Dockerfile
│   ├── fly.toml
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── App.jsx
│   │   └── App.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── fly.toml
│   └── package.json
└── README.md
```

## Troubleshooting

### 502 Bad Gateway Error
If you see 502 errors, the frontend can't reach the backend:
1. Check backend is running: `fly status --app gvmh-ed-backend`
2. Check backend logs: `fly logs --app gvmh-ed-backend`
3. Verify nginx.conf has correct backend URL

### File Upload Fails
1. Check backend logs for errors
2. Verify volume is mounted: `fly volumes list --app gvmh-ed-backend`
3. Ensure uploads directory exists in volume

### Database Not Saving Data
1. Check volume is attached: `fly volumes list --app gvmh-ed-backend`
2. Create a snapshot before attempting fixes
3. Check backend logs for SQLite errors

## Support & Maintenance

**Update Schedule:**
- Deploy updates after testing locally
- Create volume snapshot before major updates
- Monitor Fly.io dashboard for resource usage

**Security Notes:**
- Change admin password in `backend/src/server.js` (line 291)
- Keep dependencies updated: `npm audit`
- Review Fly.io security settings periodically

## License

Private - Internal use only for GVMH Emergency Department

## Contact

For issues or questions, contact the development team or open an issue on GitHub.
