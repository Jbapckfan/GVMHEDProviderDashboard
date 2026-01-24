const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists (ephemeral on Render, but needed for local dev)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const kpiStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `kpi-metrics${ext}`);
  }
});

const scheduleStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `schedule${ext}`);
  }
});

const uploadKPI = multer({ storage: kpiStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadSchedule = multer({ storage: scheduleStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Initialize database (async)
(async () => {
  try {
    await db.initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all providers
app.get('/api/providers', async (req, res) => {
  try {
    const providers = await db.getProviders();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shifts for a specific date
app.get('/api/shifts', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const shifts = await db.getShifts(date);
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPI metrics
app.get('/api/kpi-metrics', async (req, res) => {
  try {
    const metrics = await db.getKPIMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update KPI metric
app.post('/api/kpi-metrics', async (req, res) => {
  try {
    const result = await db.updateKPIMetric(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quick links
app.get('/api/quick-links', async (req, res) => {
  try {
    const links = await db.getQuickLinks();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload KPI image/file
app.post('/api/upload-kpi', uploadKPI.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      success: true,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current KPI file info
app.get('/api/kpi-file', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const kpiFile = files.find(f => f.startsWith('kpi-metrics'));
    if (kpiFile) {
      const filePath = path.join(uploadsDir, kpiFile);
      const stats = fs.statSync(filePath);
      res.json({
        exists: true,
        filename: kpiFile,
        path: `/uploads/${kpiFile}`,
        uploadedAt: stats.mtime.toISOString(),
        size: stats.size
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete KPI file
app.delete('/api/kpi-file', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const kpiFile = files.find(f => f.startsWith('kpi-metrics'));
    if (kpiFile) {
      fs.unlinkSync(path.join(uploadsDir, kpiFile));
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'No file found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Schedule image/file
app.post('/api/upload-schedule', uploadSchedule.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      success: true,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current schedule file info
app.get('/api/schedule-file', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const scheduleFile = files.find(f => f.startsWith('schedule'));
    if (scheduleFile) {
      const filePath = path.join(uploadsDir, scheduleFile);
      const stats = fs.statSync(filePath);
      res.json({
        exists: true,
        filename: scheduleFile,
        path: `/uploads/${scheduleFile}`,
        uploadedAt: stats.mtime.toISOString(),
        size: stats.size
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete schedule file
app.delete('/api/schedule-file', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const scheduleFile = files.find(f => f.startsWith('schedule'));
    if (scheduleFile) {
      fs.unlinkSync(path.join(uploadsDir, scheduleFile));
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'No file found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get phone directory
app.get('/api/phone-directory', async (req, res) => {
  try {
    const phoneNumbers = await db.getPhoneDirectory();
    res.json(phoneNumbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add phone number
app.post('/api/admin/phone-directory', async (req, res) => {
  try {
    const result = await db.addPhoneNumber(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update phone number
app.put('/api/admin/phone-directory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.updatePhoneNumber(id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete phone number
app.delete('/api/admin/phone-directory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deletePhoneNumber(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Verify password
app.post('/api/admin/verify', (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get news
app.get('/api/news', async (req, res) => {
  try {
    const news = await db.getNews();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add news
app.post('/api/admin/news', async (req, res) => {
  try {
    const result = await db.addNews(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update news
app.put('/api/admin/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.updateNews(id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete news
app.delete('/api/admin/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteNews(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order set suggestions
app.get('/api/order-set-suggestions', async (req, res) => {
  try {
    const suggestions = await db.getOrderSetSuggestions();
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order set suggestion
app.post('/api/order-set-suggestions', async (req, res) => {
  try {
    const result = await db.createOrderSetSuggestion(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get provider chart status
app.get('/api/provider-charts', async (req, res) => {
  try {
    const charts = await db.getProviderCharts();
    res.json(charts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add provider chart status
app.post('/api/admin/provider-charts', async (req, res) => {
  try {
    const result = await db.addProviderChart(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update provider chart status
app.put('/api/admin/provider-charts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.updateProviderChart(id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete provider chart status
app.delete('/api/admin/provider-charts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteProviderChart(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPI goals
app.get('/api/kpi-goals', async (req, res) => {
  try {
    const goals = await db.getKPIGoals();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add KPI goal
app.post('/api/admin/kpi-goals', async (req, res) => {
  try {
    const result = await db.addKPIGoal(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update KPI goal
app.put('/api/admin/kpi-goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.updateKPIGoal(id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete KPI goal
app.delete('/api/admin/kpi-goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteKPIGoal(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await db.getMessages();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add message (no auth required - any provider can post)
app.post('/api/messages', async (req, res) => {
  try {
    const result = await db.addMessage(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update message
app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.updateMessage(id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteMessage(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy Google Sheets schedule (bypasses network blocks)
const SHEET_ID = '1eFtQiknDOiQSwJkYs-jC-w1_K0byKB5I9qkIE9xnnpU';
const SHEET_GIDS = {
  'December 2025': '256218995',
  'January 2026': '1997148602',
  'February 2026': '1342065365',
  'March 2026': '94782258',
};

app.get('/api/schedule-proxy', async (req, res) => {
  const { month, year } = req.query;
  const key = `${month} ${year}`;
  const gid = SHEET_GIDS[key];

  if (!gid) {
    return res.status(404).json({ error: 'Month not available' });
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/htmlembed?gid=${gid}&single=true`;

  try {
    const html = await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
        response.on('error', reject);
      }).on('error', reject);
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ED Dashboard Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
