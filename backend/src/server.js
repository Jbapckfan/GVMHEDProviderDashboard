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

// Google Sheets configuration
const SHEET_ID = '1eFtQiknDOiQSwJkYs-jC-w1_K0byKB5I9qkIE9xnnpU';

// Cache for schedule data and sheet tabs
const scheduleCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let sheetTabsCache = null;
let sheetTabsCacheTime = 0;
const TABS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for tabs

// Fetch and parse available sheet tabs dynamically
async function fetchSheetTabs() {
  // Check cache first
  if (sheetTabsCache && Date.now() - sheetTabsCacheTime < TABS_CACHE_DURATION) {
    return sheetTabsCache;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          // Parse the HTML to find sheet tabs
          // Looking for patterns like: {"name":"January 2026","gid":1997148602}
          const tabMatches = data.matchAll(/"name"\s*:\s*"([^"]+)"\s*,\s*"gid"\s*:\s*(\d+)/g);
          const tabs = {};

          // Month pattern to match schedule tabs
          const monthPattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/;

          for (const match of tabMatches) {
            const name = match[1];
            const gid = match[2];
            if (monthPattern.test(name)) {
              tabs[name] = gid;
              console.log(`Found sheet tab: ${name} (gid: ${gid})`);
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
    }).on('error', reject);
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ED Dashboard Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
