# Fly.io Deployment Guide

This guide will walk you through deploying the GVMH ED Provider Dashboard to Fly.io.

## Prerequisites

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Sign up for Fly.io (free tier):
   ```bash
   fly auth signup
   ```
   Or login if you already have an account:
   ```bash
   fly auth login
   ```

## Step 1: Deploy Backend

1. Navigate to the backend directory:
   ```bash
   cd ~/GVMHEDProviderDashboard/backend
   ```

2. Launch the backend app:
   ```bash
   fly launch --no-deploy
   ```
   - When prompted for app name, use: `gvmh-ed-backend` (or choose your own)
   - When prompted for region, choose the closest to you (e.g., `sjc` for San Jose)
   - Say NO to setting up a PostgreSQL database
   - Say NO to setting up Redis

3. Create persistent volumes for database and uploads:
   ```bash
   fly volumes create gvmh_data --region sjc --size 1
   fly volumes create gvmh_uploads --region sjc --size 1
   ```

4. Deploy the backend:
   ```bash
   fly deploy
   ```

5. Verify backend is running:
   ```bash
   fly open
   ```
   This should open your backend URL (e.g., https://gvmh-ed-backend.fly.dev)

## Step 2: Deploy Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ~/GVMHEDProviderDashboard/frontend
   ```

2. Update the BACKEND_URL in `fly.toml` with your actual backend URL:
   - Open `fly.toml`
   - Change `BACKEND_URL = "https://gvmh-ed-backend.fly.dev"` to match your backend app name

3. Launch the frontend app:
   ```bash
   fly launch --no-deploy
   ```
   - When prompted for app name, use: `gvmh-ed-frontend` (or choose your own)
   - When prompted for region, choose the same region as backend
   - Say NO to setting up a PostgreSQL database
   - Say NO to setting up Redis

4. Deploy the frontend:
   ```bash
   fly deploy
   ```

5. Verify frontend is running:
   ```bash
   fly open
   ```
   This should open your dashboard in the browser!

## Post-Deployment

### Viewing Logs

Backend logs:
```bash
cd ~/GVMHEDProviderDashboard/backend
fly logs
```

Frontend logs:
```bash
cd ~/GVMHEDProviderDashboard/frontend
fly logs
```

### Updating the App

Whenever you make changes to the code:

1. For backend updates:
   ```bash
   cd ~/GVMHEDProviderDashboard/backend
   fly deploy
   ```

2. For frontend updates:
   ```bash
   cd ~/GVMHEDProviderDashboard/frontend
   fly deploy
   ```

### Managing Volumes

List volumes:
```bash
fly volumes list
```

Create snapshots:
```bash
fly volumes snapshots list gvmh_data
fly volumes snapshots create gvmh_data
```

### Scaling

If you need more resources (will use credits beyond free tier):

```bash
# Increase memory
fly scale memory 512 --app gvmh-ed-backend

# Add more instances
fly scale count 2 --app gvmh-ed-backend
```

### Monitoring

Check app status:
```bash
fly status --app gvmh-ed-backend
fly status --app gvmh-ed-frontend
```

Check resource usage:
```bash
fly dashboard
```

## Troubleshooting

### Backend not connecting to database

Check if volumes are properly mounted:
```bash
fly ssh console --app gvmh-ed-backend
ls -la /app/data
ls -la /app/uploads
```

### Frontend can't reach backend

1. Verify backend URL in `frontend/fly.toml`
2. Check CORS settings in `backend/src/server.js`
3. Verify nginx configuration is using correct BACKEND_URL

### App crashes or won't start

View detailed logs:
```bash
fly logs --app gvmh-ed-backend
fly logs --app gvmh-ed-frontend
```

### Out of memory

The free tier includes 256MB RAM. If you're running out:
1. Check for memory leaks in your code
2. Consider upgrading to 512MB (will use credits)

## Cost Monitoring

Free tier limits:
- 3 VMs with 256MB RAM each
- 3GB persistent storage total
- 160GB bandwidth/month

Check your usage:
```bash
fly dashboard
```

## Important Notes

1. **Data Persistence**: Your SQLite database and uploaded files are stored in persistent volumes. These persist across deployments.

2. **Backups**: Regularly create volume snapshots for backups:
   ```bash
   fly volumes snapshots create gvmh_data
   fly volumes snapshots create gvmh_uploads
   ```

3. **Security**: The admin password is hardcoded as `admin123`. Consider changing it in `backend/src/server.js` before deploying.

4. **HTTPS**: Fly.io automatically provides HTTPS certificates for your apps.

5. **Always On**: With the current configuration, your apps will stay running 24/7 within free tier limits.

## Next Steps

1. Share the frontend URL with your team
2. Set up regular volume snapshots for backups
3. Monitor usage to ensure you stay within free tier
4. Consider changing the admin password

Your dashboard should now be live at:
- Frontend: https://gvmh-ed-frontend.fly.dev (or your chosen name)
- Backend: https://gvmh-ed-backend.fly.dev (or your chosen name)
