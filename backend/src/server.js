const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const net = require('net');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Use persistent volume in production, local directory in development
const isProduction = process.env.NODE_ENV === 'production';
const uploadsDir = isProduction ? '/data/uploads' : path.join(__dirname, '../uploads');
const dbDir = isProduction ? '/data/db' : path.join(__dirname, '..');

// Ensure data directories exist (important for persistent volume)
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
console.log(`Uploads directory: ${uploadsDir}`);
console.log(`Database directory: ${dbDir}`);

try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }
} catch (err) {
  console.warn(`Could not create database directory ${dbDir}: ${err.message}`);
}
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
  }
} catch (err) {
  console.warn(`Could not create uploads directory ${uploadsDir}: ${err.message}`);
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

// Upload KPI image/file - store in database for persistence
app.post('/api/upload-kpi', uploadKPI.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file and convert to base64
    const filePath = path.join(uploadsDir, req.file.filename);
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    // Store in database
    await db.saveFile('kpi-metrics', req.file.originalname, req.file.mimetype, base64Data, req.file.size);

    // Clean up temp file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      filename: req.file.originalname,
      path: `/kpi-file/download`,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current KPI file info
app.get('/api/kpi-file', async (req, res) => {
  try {
    const file = await db.getFile('kpi-metrics');
    if (file) {
      res.json({
        exists: true,
        filename: file.filename,
        path: `/kpi-file/download`,
        uploadedAt: file.uploaded_at,
        size: file.size
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download KPI file from database
app.get('/api/kpi-file/download', async (req, res) => {
  try {
    const file = await db.getFile('kpi-metrics');
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(file.data, 'base64');

    // Set appropriate headers
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete KPI file
app.delete('/api/kpi-file', async (req, res) => {
  try {
    const file = await db.getFile('kpi-metrics');
    if (file) {
      await db.deleteFile('kpi-metrics');
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'No file found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// KPI Documents API (Multiple File Support)
// ============================================

// Get all KPI documents (metadata only, no file data)
app.get('/api/kpi-documents', async (req, res) => {
  try {
    const documents = await db.getKPIDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload new KPI document
app.post('/api/kpi-documents', uploadKPI.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file and convert to base64
    const filePath = path.join(uploadsDir, req.file.filename);
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    // Use custom title if provided, otherwise use original filename without extension
    const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');

    // Store in database
    const result = await db.addKPIDocument(
      title,
      req.file.originalname,
      req.file.mimetype,
      base64Data,
      req.file.size
    );

    // Clean up temp file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      id: result?.lastInsertRowid || result?.lastInsertRowId || null,
      title: title,
      filename: req.file.originalname,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single KPI document info
app.get('/api/kpi-documents/:id', async (req, res) => {
  try {
    const doc = await db.getKPIDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    // Return metadata without the file data
    res.json({
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
      mimetype: doc.mimetype,
      size: doc.size,
      display_order: doc.display_order,
      uploaded_at: doc.uploaded_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download KPI document
app.get('/api/kpi-documents/:id/download', async (req, res) => {
  try {
    const doc = await db.getKPIDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(doc.data, 'base64');

    // Set appropriate headers
    res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update KPI document title
app.put('/api/kpi-documents/:id', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    await db.updateKPIDocumentTitle(req.params.id, title);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update document order (for reordering tabs)
app.put('/api/kpi-documents/:id/order', async (req, res) => {
  try {
    const { display_order } = req.body;
    await db.updateKPIDocumentOrder(req.params.id, display_order);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete KPI document
app.delete('/api/kpi-documents/:id', async (req, res) => {
  try {
    await db.deleteKPIDocument(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// KPI Document Annotations API
// ============================================

// Get annotations for a document
app.get('/api/kpi-documents/:docId/annotations', async (req, res) => {
  try {
    const annotations = await db.getAnnotations(req.params.docId);
    res.json(annotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add annotation to a document
app.post('/api/kpi-documents/:docId/annotations', async (req, res) => {
  try {
    const { content, author, annotation_type } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const result = await db.addAnnotation({
      document_id: req.params.docId,
      content: content.trim(),
      author: author || 'Anonymous',
      annotation_type: annotation_type || 'comment'
    });
    res.json({ success: true, id: result?.lastInsertRowid || result?.lastInsertRowId || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update annotation
app.put('/api/kpi-documents/:docId/annotations/:id', async (req, res) => {
  try {
    const { content, author, annotation_type } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    await db.updateAnnotation(req.params.id, {
      content: content.trim(),
      author: author || 'Anonymous',
      annotation_type: annotation_type || 'comment'
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete annotation
app.delete('/api/kpi-documents/:docId/annotations/:id', async (req, res) => {
  try {
    await db.deleteAnnotation(req.params.id);
    res.json({ success: true });
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
    res.json({ success: true, id: result?.lastInsertRowid || result?.lastInsertRowId || null });
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

// Provider login: verify last name against schedule providers
app.post('/api/auth/provider-login', async (req, res) => {
  try {
    const { lastName } = req.body;
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Last name is required' });
    }

    const needle = lastName.trim().toLowerCase();

    // Collect all provider names from all cached schedule months + fetch current month
    const allProviders = new Set();

    // 1) Pull from schedule cache (already fetched months)
    for (const [, entry] of scheduleCache) {
      if (entry && entry.data && entry.data.calendar) {
        Object.values(entry.data.calendar).forEach(day => {
          (day.providers || []).forEach(p => allProviders.add(p));
        });
      }
    }

    // 2) Fetch current month if not already cached
    try {
      const tabs = await fetchSheetTabs();
      const now = new Date();
      const monthNames = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'];
      const currentKey = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      const gid = tabs[currentKey];

      if (gid) {
        const cached = scheduleCache.get(currentKey);
        let data;
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          data = cached.data;
        } else {
          const csv = await fetchSheetData(gid);
          data = parseScheduleCSV(csv, monthNames[now.getMonth()], now.getFullYear());
          if (data) scheduleCache.set(currentKey, { data, timestamp: Date.now() });
        }
        if (data && data.calendar) {
          Object.values(data.calendar).forEach(day => {
            (day.providers || []).forEach(p => allProviders.add(p));
          });
        }
      }

      // Also fetch next month in case we're near month boundary
      const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextKey = `${monthNames[nextDate.getMonth()]} ${nextDate.getFullYear()}`;
      const nextGid = tabs[nextKey];
      if (nextGid) {
        const cachedNext = scheduleCache.get(nextKey);
        let nextData;
        if (cachedNext && Date.now() - cachedNext.timestamp < CACHE_DURATION) {
          nextData = cachedNext.data;
        } else {
          const csv = await fetchSheetData(nextGid);
          nextData = parseScheduleCSV(csv, monthNames[nextDate.getMonth()], nextDate.getFullYear());
          if (nextData) scheduleCache.set(nextKey, { data: nextData, timestamp: Date.now() });
        }
        if (nextData && nextData.calendar) {
          Object.values(nextData.calendar).forEach(day => {
            (day.providers || []).forEach(p => allProviders.add(p));
          });
        }
      }
    } catch (err) {
      console.error('Error fetching schedule for provider login:', err.message);
    }

    // 3) Also check providers table in DB
    try {
      const dbProviders = await db.getProviders();
      dbProviders.forEach(p => allProviders.add(p.name));
    } catch (err) {
      console.error('Error fetching DB providers:', err.message);
    }

    // Extract last names and match
    const match = Array.from(allProviders).find(name => {
      const parts = name.trim().split(/\s+/);
      const last = parts[parts.length - 1].toLowerCase();
      return last === needle;
    });

    if (match) {
      res.json({ success: true, providerName: match });
    } else {
      res.status(401).json({ success: false, error: 'Last name not found' });
    }
  } catch (error) {
    console.error('Provider login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
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
    res.json({ success: true, id: result?.lastInsertRowid || result?.lastInsertRowId || null });
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
    res.json({ success: true, id: result?.lastInsertRowid || result?.lastInsertRowId || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order set suggestion
app.put('/api/order-set-suggestions/:id', async (req, res) => {
  try {
    await db.updateOrderSetSuggestion(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order set suggestion
app.delete('/api/order-set-suggestions/:id', async (req, res) => {
  try {
    await db.deleteOrderSetSuggestion(req.params.id);
    res.json({ success: true });
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

// Get provider chart trends (latest vs previous for all providers)
app.get('/api/provider-charts/trends', async (req, res) => {
  try {
    const trends = await db.getAllProviderChartHistory();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add provider chart status
app.post('/api/admin/provider-charts', async (req, res) => {
  try {
    const result = await db.addProviderChart(req.body);
    res.json({ success: true, id: result?.lastInsertRowid || result?.lastInsertRowId || null });
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

// Admin: Bulk import provider chart statuses
app.post('/api/admin/charts/bulk-import', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries must be a non-empty array' });
    }

    // Validate each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.provider_name || typeof entry.provider_name !== 'string' || !entry.provider_name.trim()) {
        return res.status(400).json({ error: `Entry ${i + 1}: provider_name is required` });
      }
      if (typeof entry.outstanding_charts !== 'number' || entry.outstanding_charts < 0) {
        return res.status(400).json({ error: `Entry ${i + 1}: outstanding_charts must be a non-negative number` });
      }
      if (typeof entry.delinquent_charts !== 'number' || entry.delinquent_charts < 0) {
        return res.status(400).json({ error: `Entry ${i + 1}: delinquent_charts must be a non-negative number` });
      }
    }

    const imported = await db.bulkUpsertProviderCharts(entries);
    res.json({ success: true, imported });
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

// Admin: Bulk delete provider charts
app.post('/api/admin/provider-charts/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    for (const id of ids) {
      await db.deleteProviderChart(id);
    }
    res.json({ success: true, deleted: ids.length });
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
    res.json({ success: true, id: result?.lastInsertRowid || result?.lastInsertRowId || null });
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
    res.json({ success: true, id: result?.lastInsertRowid || result?.lastInsertRowId || null });
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

// Google Sheets configuration
const SHEET_ID = '1eFtQiknDOiQSwJkYs-jC-w1_K0byKB5I9qkIE9xnnpU';

// Cache for schedule data and sheet tabs
const scheduleCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let sheetTabsCache = null;
let sheetTabsCacheTime = 0;
const TABS_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes for tabs

// Fetch and parse available sheet tabs dynamically using pubhtml endpoint
async function fetchSheetTabs() {
  // Check cache first
  if (sheetTabsCache && Date.now() - sheetTabsCacheTime < TABS_CACHE_DURATION) {
    return sheetTabsCache;
  }

  // Use pubhtml which reliably contains gid links
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pubhtml`;

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (redirectResponse) => {
          handleResponse(redirectResponse, resolve, reject);
        }).on('error', reject);
        return;
      }
      handleResponse(response, resolve, reject);
    }).on('error', reject);
  });

  function handleResponse(response, resolve, reject) {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', async () => {
      try {
        // Find all gids from pubhtml links
        const gidMatches = data.matchAll(/gid=(\d+)/g);
        const gids = [...new Set([...gidMatches].map(m => m[1]))];

        console.log(`Found ${gids.length} unique gids, checking each...`);

        const tabs = {};
        const monthPattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/;

        // Check each gid to find month tabs
        for (const gid of gids) {
          try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
            const firstLine = await fetchFirstLine(csvUrl);
            const match = firstLine.match(monthPattern);
            if (match) {
              const monthName = `${match[1]} ${match[2]}`;
              tabs[monthName] = gid;
              console.log(`Found sheet tab: ${monthName} (gid: ${gid})`);
            }
          } catch (e) {
            // Skip invalid gids
          }
        }

        // Cache the results
        sheetTabsCache = tabs;
        sheetTabsCacheTime = Date.now();

        console.log(`Discovered ${Object.keys(tabs).length} month tabs`);
        resolve(tabs);
      } catch (error) {
        console.error('Error parsing sheet tabs:', error);
        reject(error);
      }
    });
    response.on('error', reject);
  }
}

// Helper to fetch just the first line of a CSV
function fetchFirstLine(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (targetUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        return reject(new Error('Too many redirects'));
      }

      https.get(targetUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return makeRequest(response.headers.location, redirectCount + 1);
        }

        let data = '';
        response.on('data', chunk => {
          data += chunk;
          // Stop after getting first line
          if (data.includes('\n')) {
            response.destroy();
            resolve(data.split('\n')[0]);
          }
        });
        response.on('end', () => resolve(data.split('\n')[0]));
        response.on('error', reject);
      }).on('error', reject);
    };

    makeRequest(url);
  });
}

// Fetch Google Sheet as CSV and parse into calendar data
async function fetchSheetData(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

  const fetchWithRedirects = (targetUrl, maxRedirects = 5) => {
    return new Promise((resolve, reject) => {
      if (maxRedirects <= 0) {
        return reject(new Error('Too many redirects'));
      }

      const protocol = targetUrl.startsWith('https') ? https : require('http');
      protocol.get(targetUrl, (response) => {
        // Handle redirects (301, 302, 307, 308)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`Redirect ${response.statusCode} to: ${response.headers.location}`);
          return fetchWithRedirects(response.headers.location, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
        response.on('error', reject);
      }).on('error', reject);
    });
  };

  return fetchWithRedirects(url);
}

// Parse CSV into calendar structure
function parseScheduleCSV(csv, monthName, year) {
  const lines = csv.split('\n').map(line => {
    // Parse CSV properly handling quoted fields
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  // Find the header row with days of week
  let headerRowIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i];
    const rowText = row.join(' ').toLowerCase();
    if (rowText.includes('sunday') && rowText.includes('monday')) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.error('Could not find header row');
    return null;
  }

  console.log('Found header row at index:', headerRowIndex);
  console.log('Header row:', lines[headerRowIndex]);

  // Map column indices to days of week
  // The CSV has format: Sunday,,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,,,,,,,,Saturday
  // Days are at columns 0, 2, 4, 6, 8, 10, and Saturday around 18
  const dayColumns = {};
  const headerRow = lines[headerRowIndex];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  headerRow.forEach((cell, index) => {
    const cellLower = cell.toLowerCase().trim();
    dayNames.forEach((day, dayIndex) => {
      if (cellLower === day) {
        dayColumns[index] = { name: day, dayIndex };
        console.log(`Found ${day} at column ${index}`);
      }
    });
  });

  console.log('Day columns:', dayColumns);

  // Parse calendar data - track current day numbers for each column
  const calendar = {};
  const currentDayByColumn = {}; // Track which day number each column is currently showing

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const row = lines[i];

    // First pass: find day numbers in this row (they appear in the day columns)
    Object.keys(dayColumns).forEach(colIndex => {
      const cell = (row[colIndex] || '').replace(/["\r]/g, '').trim();
      const dayMatch = cell.match(/^(\d{1,2})$/);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1]);
        if (dayNum >= 1 && dayNum <= 31) {
          currentDayByColumn[colIndex] = dayNum;
          if (!calendar[dayNum]) {
            const dayInfo = dayColumns[colIndex];
            calendar[dayNum] = { dayOfWeek: dayInfo.name, dayIndex: dayInfo.dayIndex, providers: [] };
          }
        }
      }
    });

    // Second pass: find provider names in the same columns (non-numeric text)
    Object.keys(dayColumns).forEach(colIndex => {
      const cell = (row[colIndex] || '').replace(/["\r]/g, '').trim();

      // Skip if empty, is a number, or is a known non-provider string
      if (!cell || cell.match(/^\d+$/) || cell.length < 2) return;
      if (cell.match(/^(7A-7P|10A-10P|7P-7A|Revised|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|January|February|March|April|May|June|July|August|September|October|November|December)/i)) return;

      // This looks like a provider name - assign to current day in this column
      const dayNum = currentDayByColumn[colIndex];
      if (dayNum && calendar[dayNum]) {
        // Avoid duplicates
        if (!calendar[dayNum].providers.includes(cell)) {
          calendar[dayNum].providers.push(cell);
        }
      }
    });
  }

  // Generate verification data for debugging
  const verification = {
    totalDays: Object.keys(calendar).length,
    daysWithProviders: Object.keys(calendar).filter(d => calendar[d].providers.length > 0).length,
    sampleData: {}
  };

  // Include sample of first 5 days with providers for verification
  const daysWithData = Object.keys(calendar)
    .map(Number)
    .sort((a, b) => a - b)
    .filter(d => calendar[d].providers.length > 0)
    .slice(0, 5);
  daysWithData.forEach(d => {
    verification.sampleData[d] = calendar[d].providers;
  });

  console.log('Parsed calendar days:', Object.keys(calendar).length);
  console.log('Sample verification:', verification.sampleData);

  return {
    month: monthName,
    year: year,
    calendar: calendar,
    verification: verification
  };
}

// API endpoint to get available months
app.get('/api/schedule-months', async (req, res) => {
  try {
    const tabs = await fetchSheetTabs();
    const months = Object.keys(tabs).map(key => {
      const [month, year] = key.split(' ');
      return { month, year: parseInt(year), label: key };
    });

    // Sort by year and month
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    months.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    res.json({ months });
  } catch (error) {
    console.error('Error fetching months:', error);
    res.status(500).json({ error: 'Failed to fetch available months' });
  }
});

// Debug endpoint to get raw CSV (for verification)
app.get('/api/schedule-debug', async (req, res) => {
  const { month, year } = req.query;
  const key = `${month} ${year}`;

  try {
    const tabs = await fetchSheetTabs();
    const gid = tabs[key];

    if (!gid) {
      return res.status(404).json({ error: 'Month not available', availableMonths: Object.keys(tabs) });
    }

    const csv = await fetchSheetData(gid);
    res.type('text/plain').send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get schedule data
app.get('/api/schedule-data', async (req, res) => {
  const { month, year } = req.query;
  const key = `${month} ${year}`;

  try {
    const tabs = await fetchSheetTabs();
    const gid = tabs[key];

    if (!gid) {
      return res.status(404).json({ error: 'Month not available', availableMonths: Object.keys(tabs) });
    }

    // Check cache
    const cached = scheduleCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    console.log(`Fetching schedule data for ${key}...`);
    const csv = await fetchSheetData(gid);
    const data = parseScheduleCSV(csv, month, parseInt(year));

    if (!data) {
      return res.status(500).json({ error: 'Failed to parse schedule data' });
    }

    // Cache the result
    scheduleCache.set(key, { data, timestamp: Date.now() });

    console.log(`Schedule data fetched for ${key}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule data' });
  }
});

// ============================================
// Hospitalist Pager (SNPP)
// ============================================

function sendSNPP(pagerNumber, message) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let phase = 'greeting';
    let buffer = '';
    let settled = false;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (err) reject(err);
      else resolve(result);
    };

    const timer = setTimeout(() => {
      finish(new Error('SNPP connection timed out after 15 seconds'));
    }, 15000);

    socket.connect(444, 'snpp.amsmsg.net', () => {
      // connected — wait for greeting
    });

    socket.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\r\n');
      buffer = lines.pop(); // keep incomplete tail

      for (const line of lines) {
        if (!line.trim()) continue;
        const code = parseInt(line.substring(0, 3), 10);

        if (phase === 'greeting') {
          if (code === 220) {
            phase = 'page';
            socket.write(`PAGE ${pagerNumber}\r\n`);
          } else {
            finish(new Error(`Unexpected greeting (${code}): ${line}`));
          }
        } else if (phase === 'page') {
          if (code === 250) {
            phase = 'mess';
            socket.write(`MESS ${message}\r\n`);
          } else {
            finish(new Error(`PAGE command failed (${code}): ${line}`));
          }
        } else if (phase === 'mess') {
          if (code === 250) {
            phase = 'send';
            socket.write('SEND\r\n');
          } else {
            finish(new Error(`MESS command failed (${code}): ${line}`));
          }
        } else if (phase === 'send') {
          if (code === 250) {
            phase = 'quit';
            socket.write('QUIT\r\n');
            finish(null, { statusCode: 250, detail: line });
          } else {
            finish(new Error(`SEND command failed (${code}): ${line}`));
          }
        } else if (phase === 'quit') {
          // 221 goodbye — already resolved
        }
      }
    });

    socket.on('error', (err) => {
      finish(new Error(`TCP connection error: ${err.message}`));
    });

    socket.on('close', () => {
      finish(new Error('Connection closed unexpectedly before page was confirmed'));
    });
  });
}

app.post('/api/page-hospitalist', async (req, res) => {
  try {
    const pagerNumber = process.env.HOSPITALIST_PAGER_NUMBER;
    if (!pagerNumber) {
      return res.status(500).json({
        success: false,
        error: 'Hospitalist pager number is not configured. Contact the administrator.'
      });
    }

    const { senderName, message } = req.body;

    if (!senderName || !senderName.trim()) {
      return res.status(400).json({ success: false, error: 'Sender name is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    if (message.length > 240) {
      return res.status(400).json({ success: false, error: 'Message exceeds 240 character limit.' });
    }

    console.log(`[Pager] Sending page from: ${senderName.trim()} at ${new Date().toISOString()}`);

    const result = await sendSNPP(pagerNumber, message);
    res.json({ success: true, statusCode: result.statusCode });
  } catch (error) {
    console.error('[Pager] Send failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ED Dashboard Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);

  // Preload sheet tabs cache on startup for faster initial load
  console.log('Preloading Google Sheets tabs cache...');
  fetchSheetTabs()
    .then(tabs => console.log(`Sheet tabs preloaded: ${Object.keys(tabs).length} months available`))
    .catch(err => console.error('Failed to preload sheet tabs:', err.message));
});
