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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Always use 'kpi-metrics' as filename to replace previous upload
    const ext = path.extname(file.originalname);
    cb(null, `kpi-metrics${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPG, PNG, GIF) and Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

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
app.post('/api/upload-kpi', upload.single('file'), (req, res) => {
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ED Dashboard Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
