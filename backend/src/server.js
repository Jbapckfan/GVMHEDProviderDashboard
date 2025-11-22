const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
// Storage for KPI uploads
const kpiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Always use 'kpi-metrics' as filename to replace previous upload
    const ext = path.extname(file.originalname);
    cb(null, `kpi-metrics${ext}`);
  }
});

// Storage for schedule uploads
const scheduleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Always use 'schedule' as filename to replace previous upload
    const ext = path.extname(file.originalname);
    cb(null, `schedule${ext}`);
  }
});

const uploadKPI = multer({
  storage: kpiStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadSchedule = multer({
  storage: scheduleStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Initialize database
db.initializeDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all providers
app.get('/api/providers', (req, res) => {
  try {
    const providers = db.getProviders();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shifts for a specific date
app.get('/api/shifts', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const shifts = db.getShifts(date);
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPI metrics
app.get('/api/kpi-metrics', (req, res) => {
  try {
    const metrics = db.getKPIMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update KPI metric
app.post('/api/kpi-metrics', (req, res) => {
  try {
    const result = db.updateKPIMetric(req.body);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quick links
app.get('/api/quick-links', (req, res) => {
  try {
    const links = db.getQuickLinks();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload KPI image/file
app.post('/api/upload-kpi', uploadKPI.single('file'), (req, res) => {
  try {
    console.log('Upload KPI request received');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file.filename);
    res.json({
      success: true,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload KPI error:', error);
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
app.get('/api/phone-directory', (req, res) => {
  try {
    const phoneNumbers = db.getPhoneDirectory();
    res.json(phoneNumbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add phone number
app.post('/api/admin/phone-directory', express.json(), (req, res) => {
  try {
    const result = db.addPhoneNumber(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update phone number
app.put('/api/admin/phone-directory/:id', express.json(), (req, res) => {
  try {
    const { id } = req.params;
    db.updatePhoneNumber(id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete phone number
app.delete('/api/admin/phone-directory/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.deletePhoneNumber(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Verify password
app.post('/api/admin/verify', express.json(), (req, res) => {
  try {
    const { password } = req.body;
    // Simple password check - you can change this password
    const adminPassword = 'admin123';
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
app.get('/api/news', (req, res) => {
  try {
    const news = db.getNews();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order set suggestions
app.get('/api/order-set-suggestions', (req, res) => {
  try {
    const suggestions = db.getOrderSetSuggestions();
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order set suggestion
app.post('/api/order-set-suggestions', (req, res) => {
  try {
    const result = db.createOrderSetSuggestion(req.body);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ED Dashboard Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
