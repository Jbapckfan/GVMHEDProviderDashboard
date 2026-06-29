const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Determine database path - use persistent volume in production
const isProduction = process.env.NODE_ENV === 'production';
const dbDir = isProduction ? '/data/db' : __dirname;
const defaultDbPath = isProduction ? 'file:/data/db/local.db' : 'file:local.db';

// Ensure database directory exists before connecting (skip if using Turso remote DB)
if (!process.env.TURSO_DATABASE_URL && !fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  } catch (err) {
    console.warn(`Could not create directory ${dbDir}: ${err.message}`);
  }
}

// Create Turso client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || defaultDbPath,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log(`Database connecting to: ${process.env.TURSO_DATABASE_URL || defaultDbPath}`);
console.log(`Database directory: ${dbDir}`);

// Initialize database schema
async function initializeDatabase() {
  // Providers table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'available'
    )
  `);

  // Shifts table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT NOT NULL,
      shift_type TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);

  // KPI Metrics table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kpi_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      target_value REAL,
      unit TEXT,
      category TEXT NOT NULL,
      period TEXT DEFAULT 'current',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Quick links table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS quick_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT
    )
  `);

  // Phone directory table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS phone_directory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      extension TEXT,
      department TEXT,
      display_order INTEGER DEFAULT 0
    )
  `);

  // Schedule requests and shift swap board
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schedule_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'cover',
      provider_name TEXT NOT NULL,
      date TEXT NOT NULL,
      shift TEXT DEFAULT '',
      swap_date TEXT DEFAULT '',
      target_provider TEXT DEFAULT '',
      note TEXT DEFAULT '',
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // News table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'low',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);

  // Order set suggestions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_set_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion TEXT NOT NULL,
      author TEXT DEFAULT 'Anonymous',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Provider chart status table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS provider_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT NOT NULL,
      outstanding_charts INTEGER DEFAULT 0,
      delinquent_charts INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // KPI goals table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kpi_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_name TEXT NOT NULL,
      current_value REAL DEFAULT 0,
      target_value REAL NOT NULL,
      unit TEXT,
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Message board table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Uploaded files table (for persistent file storage)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_key TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      mimetype TEXT,
      data TEXT NOT NULL,
      size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // KPI Documents table (for multiple document uploads with custom titles)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kpi_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      mimetype TEXT,
      data TEXT NOT NULL,
      size INTEGER,
      display_order INTEGER DEFAULT 0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Provider chart history table (for trend tracking)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS provider_chart_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT NOT NULL,
      outstanding_charts INTEGER DEFAULT 0,
      delinquent_charts INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Message replies table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS message_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // KPI Document Annotations table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kpi_document_annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT DEFAULT 'Anonymous',
      annotation_type TEXT DEFAULT 'comment',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Day notes table — operator-authored notes attached to a calendar day
  await db.execute(`
    CREATE TABLE IF NOT EXISTS day_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      body TEXT NOT NULL,
      author TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_day_notes_date ON day_notes(date)`);

  // Published schedules — snapshot per (month, year) per publish
  await db.execute(`
    CREATE TABLE IF NOT EXISTS published_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      snapshot_json TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_published_my ON published_schedules(year, month, published_at DESC)`);

  // Page logs table (hospitalist pager history)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS page_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      beds TEXT,
      sent_at DATETIME NOT NULL,
      completed_at DATETIME,
      status TEXT NOT NULL,
      error_message TEXT
    )
  `);

  // Seed initial data if tables are empty
  await seedData();
}

async function seedData() {
  const result = await db.execute('SELECT COUNT(*) as count FROM providers');
  const providerCount = result.rows[0].count;

  if (providerCount === 0) {
    // Seed providers
    await db.execute({
      sql: 'INSERT INTO providers (name, role, phone, email, status) VALUES (?, ?, ?, ?, ?)',
      args: ['Dr. Sarah Johnson', 'Attending Physician', '555-0101', 'sjohnson@hospital.com', 'on-duty']
    });
    await db.execute({
      sql: 'INSERT INTO providers (name, role, phone, email, status) VALUES (?, ?, ?, ?, ?)',
      args: ['Dr. Michael Chen', 'Attending Physician', '555-0102', 'mchen@hospital.com', 'available']
    });

    // Seed phone directory with sample data
    await db.execute({
      sql: 'INSERT INTO phone_directory (name, number, extension, department, display_order) VALUES (?, ?, ?, ?, ?)',
      args: ['Hospital Operator', '555-1000', null, 'Main', 1]
    });
    await db.execute({
      sql: 'INSERT INTO phone_directory (name, number, extension, department, display_order) VALUES (?, ?, ?, ?, ?)',
      args: ['Emergency Department', '555-1100', '1100', 'ED', 2]
    });
    await db.execute({
      sql: 'INSERT INTO phone_directory (name, number, extension, department, display_order) VALUES (?, ?, ?, ?, ?)',
      args: ['Laboratory', '555-1200', '1200', 'Lab', 3]
    });

    // Seed news
    const now = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO news (title, content, priority, created_at) VALUES (?, ?, ?, ?)',
      args: ['Welcome to GVMH ED Dashboard', 'This dashboard helps ED providers stay informed and connected.', 'medium', now]
    });

    console.log('Database seeded with initial data');
  }
}

// API functions - all async now
const getProviders = async () => {
  const result = await db.execute('SELECT * FROM providers ORDER BY name');
  return result.rows;
};

const getShifts = async (date) => {
  const result = await db.execute({
    sql: 'SELECT * FROM shifts WHERE date = ? ORDER BY start_time',
    args: [date]
  });
  return result.rows;
};

const getKPIMetrics = async () => {
  const result = await db.execute('SELECT * FROM kpi_metrics ORDER BY category, metric_name');
  return result.rows;
};

const getQuickLinks = async () => {
  const result = await db.execute('SELECT * FROM quick_links ORDER BY category, title');
  return result.rows;
};

const getPhoneDirectory = async () => {
  const result = await db.execute('SELECT * FROM phone_directory ORDER BY display_order, name');
  return result.rows;
};

const getScheduleRequests = async () => {
  const result = await db.execute(`
    SELECT * FROM schedule_requests
    ORDER BY
      CASE status WHEN 'open' THEN 0 WHEN 'claimed' THEN 1 ELSE 2 END,
      date,
      created_at DESC
  `);
  return result.rows;
};

const getNews = async () => {
  const result = await db.execute("SELECT * FROM news WHERE expires_at IS NULL OR expires_at > datetime('now') ORDER BY created_at DESC");
  return result.rows;
};

const getOrderSetSuggestions = async () => {
  const result = await db.execute('SELECT * FROM order_set_suggestions ORDER BY created_at DESC');
  return result.rows;
};

const updateKPIMetric = async (data) => {
  return await db.execute({
    sql: 'UPDATE kpi_metrics SET metric_value = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_name = ?',
    args: [data.metric_value, data.metric_name]
  });
};

const createOrderSetSuggestion = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO order_set_suggestions (suggestion, author) VALUES (?, ?)',
    args: [data.suggestion, data.author || 'Anonymous']
  });
};

const updateOrderSetSuggestion = async (id, data) => {
  return await db.execute({
    sql: 'UPDATE order_set_suggestions SET suggestion=?, author=? WHERE id=?',
    args: [data.suggestion, data.author || 'Anonymous', id]
  });
};

const deleteOrderSetSuggestion = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM order_set_suggestions WHERE id=?',
    args: [id]
  });
};

const addPhoneNumber = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO phone_directory (name, number, extension, department, display_order) VALUES (?, ?, ?, ?, ?)',
    args: [data.name, data.number, data.extension || '', data.department, data.display_order || 0]
  });
};

const updatePhoneNumber = async (id, data) => {
  return await db.execute({
    sql: 'UPDATE phone_directory SET name=?, number=?, extension=?, department=?, display_order=? WHERE id=?',
    args: [data.name, data.number, data.extension || '', data.department, data.display_order || 0, id]
  });
};

const deletePhoneNumber = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM phone_directory WHERE id=?',
    args: [id]
  });
};

const addScheduleRequest = async (data) => {
  return await db.execute({
    sql: `
      INSERT INTO schedule_requests
        (type, provider_name, date, shift, swap_date, target_provider, note, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.type || 'cover',
      data.provider_name || data.providerName || '',
      data.date || '',
      data.shift || '',
      data.swap_date || data.swapDate || '',
      data.target_provider || data.targetProvider || '',
      data.note || '',
      data.status || 'open',
    ]
  });
};

const updateScheduleRequest = async (id, data) => {
  return await db.execute({
    sql: `
      UPDATE schedule_requests
      SET type=?, provider_name=?, date=?, shift=?, swap_date=?, target_provider=?, note=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `,
    args: [
      data.type || 'cover',
      data.provider_name || data.providerName || '',
      data.date || '',
      data.shift || '',
      data.swap_date || data.swapDate || '',
      data.target_provider || data.targetProvider || '',
      data.note || '',
      data.status || 'open',
      id,
    ]
  });
};

const deleteScheduleRequest = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM schedule_requests WHERE id=?',
    args: [id]
  });
};

const addNews = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO news (title, content, priority, expires_at) VALUES (?, ?, ?, ?)',
    args: [data.title, data.content, data.priority || 'low', data.expires_at || null]
  });
};

const updateNews = async (id, data) => {
  return await db.execute({
    sql: 'UPDATE news SET title=?, content=?, priority=?, expires_at=? WHERE id=?',
    args: [data.title, data.content, data.priority || 'low', data.expires_at || null, id]
  });
};

const deleteNews = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM news WHERE id=?',
    args: [id]
  });
};

const getProviderCharts = async () => {
  const result = await db.execute('SELECT * FROM provider_charts ORDER BY delinquent_charts DESC, outstanding_charts DESC');
  return result.rows;
};

const addProviderChart = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO provider_charts (provider_name, outstanding_charts, delinquent_charts) VALUES (?, ?, ?)',
    args: [data.provider_name, data.outstanding_charts || 0, data.delinquent_charts || 0]
  });
};

const updateProviderChart = async (id, data) => {
  return await db.execute({
    sql: 'UPDATE provider_charts SET provider_name=?, outstanding_charts=?, delinquent_charts=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [data.provider_name, data.outstanding_charts || 0, data.delinquent_charts || 0, id]
  });
};

const deleteProviderChart = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM provider_charts WHERE id=?',
    args: [id]
  });
};

const upsertProviderChart = async (data) => {
  // Check if provider already exists (case-insensitive)
  const existing = await db.execute({
    sql: 'SELECT id FROM provider_charts WHERE LOWER(provider_name) = LOWER(?)',
    args: [data.provider_name]
  });

  if (existing.rows.length > 0) {
    // Update existing
    await db.execute({
      sql: 'UPDATE provider_charts SET provider_name=?, outstanding_charts=?, delinquent_charts=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      args: [data.provider_name, data.outstanding_charts || 0, data.delinquent_charts || 0, existing.rows[0].id]
    });
  } else {
    // Insert new
    await db.execute({
      sql: 'INSERT INTO provider_charts (provider_name, outstanding_charts, delinquent_charts) VALUES (?, ?, ?)',
      args: [data.provider_name, data.outstanding_charts || 0, data.delinquent_charts || 0]
    });
  }

  // Record history snapshot
  await db.execute({
    sql: 'INSERT INTO provider_chart_history (provider_name, outstanding_charts, delinquent_charts) VALUES (?, ?, ?)',
    args: [data.provider_name, data.outstanding_charts || 0, data.delinquent_charts || 0]
  });
};

const bulkUpsertProviderCharts = async (entries) => {
  let count = 0;
  for (const entry of entries) {
    await upsertProviderChart(entry);
    count++;
  }
  return count;
};

const getProviderChartHistory = async (providerName, limit = 10) => {
  const result = await db.execute({
    sql: 'SELECT * FROM provider_chart_history WHERE LOWER(provider_name) = LOWER(?) ORDER BY recorded_at DESC LIMIT ?',
    args: [providerName, limit]
  });
  return result.rows;
};

const getAllProviderChartHistory = async () => {
  // Get latest 2 records per provider for trend comparison
  const result = await db.execute(`
    SELECT h1.provider_name, h1.outstanding_charts, h1.delinquent_charts, h1.recorded_at,
           h2.outstanding_charts as prev_outstanding, h2.delinquent_charts as prev_delinquent
    FROM provider_chart_history h1
    LEFT JOIN provider_chart_history h2 ON LOWER(h1.provider_name) = LOWER(h2.provider_name)
      AND h2.recorded_at = (
        SELECT MAX(recorded_at) FROM provider_chart_history
        WHERE LOWER(provider_name) = LOWER(h1.provider_name) AND recorded_at < h1.recorded_at
      )
    WHERE h1.recorded_at = (
      SELECT MAX(recorded_at) FROM provider_chart_history
      WHERE LOWER(provider_name) = LOWER(h1.provider_name)
    )
  `);
  return result.rows;
};

const getKPIGoals = async () => {
  const result = await db.execute('SELECT * FROM kpi_goals ORDER BY created_at DESC');
  return result.rows;
};

const addKPIGoal = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO kpi_goals (goal_name, current_value, target_value, unit, deadline) VALUES (?, ?, ?, ?, ?)',
    args: [data.goal_name, data.current_value || 0, data.target_value, data.unit || '', data.deadline || null]
  });
};

const updateKPIGoal = async (id, data) => {
  return await db.execute({
    sql: 'UPDATE kpi_goals SET goal_name=?, current_value=?, target_value=?, unit=?, deadline=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [data.goal_name, data.current_value || 0, data.target_value, data.unit || '', data.deadline || null, id]
  });
};

const deleteKPIGoal = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM kpi_goals WHERE id=?',
    args: [id]
  });
};

const getMessages = async () => {
  const result = await db.execute('SELECT * FROM messages ORDER BY created_at DESC');
  return result.rows;
};

const addMessage = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO messages (message, author) VALUES (?, ?)',
    args: [data.message, data.author || 'Anonymous']
  });
};

const updateMessage = async (id, data) => {
  return await db.execute({
    sql: 'UPDATE messages SET message=?, author=? WHERE id=?',
    args: [data.message, data.author || 'Anonymous', id]
  });
};

const deleteMessage = async (id) => {
  // Delete replies first, then the message
  await db.execute({
    sql: 'DELETE FROM message_replies WHERE message_id=?',
    args: [id]
  });
  return await db.execute({
    sql: 'DELETE FROM messages WHERE id=?',
    args: [id]
  });
};

const getReplies = async (messageId) => {
  const result = await db.execute({
    sql: 'SELECT * FROM message_replies WHERE message_id=? ORDER BY created_at ASC',
    args: [messageId]
  });
  return result.rows;
};

const addReply = async (messageId, data) => {
  return await db.execute({
    sql: 'INSERT INTO message_replies (message_id, message, author) VALUES (?, ?, ?)',
    args: [messageId, data.message, data.author || 'Anonymous']
  });
};

const deleteReply = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM message_replies WHERE id=?',
    args: [id]
  });
};

// File storage functions
const saveFile = async (fileKey, filename, mimetype, base64Data, size) => {
  // Upsert - replace if exists
  await db.execute({
    sql: 'DELETE FROM uploaded_files WHERE file_key = ?',
    args: [fileKey]
  });
  return await db.execute({
    sql: 'INSERT INTO uploaded_files (file_key, filename, mimetype, data, size) VALUES (?, ?, ?, ?, ?)',
    args: [fileKey, filename, mimetype, base64Data, size]
  });
};

const getFile = async (fileKey) => {
  const result = await db.execute({
    sql: 'SELECT * FROM uploaded_files WHERE file_key = ?',
    args: [fileKey]
  });
  return result.rows[0] || null;
};

const deleteFile = async (fileKey) => {
  return await db.execute({
    sql: 'DELETE FROM uploaded_files WHERE file_key = ?',
    args: [fileKey]
  });
};

// KPI Documents functions (multiple file support)
const getKPIDocuments = async () => {
  const result = await db.execute('SELECT id, title, filename, mimetype, size, display_order, uploaded_at FROM kpi_documents ORDER BY display_order, uploaded_at DESC');
  return result.rows;
};

const getKPIDocument = async (id) => {
  const result = await db.execute({
    sql: 'SELECT * FROM kpi_documents WHERE id = ?',
    args: [id]
  });
  return result.rows[0] || null;
};

const addKPIDocument = async (title, filename, mimetype, base64Data, size) => {
  // Get max display_order
  const orderResult = await db.execute('SELECT MAX(display_order) as maxOrder FROM kpi_documents');
  const maxOrder = orderResult.rows[0]?.maxOrder || 0;

  return await db.execute({
    sql: 'INSERT INTO kpi_documents (title, filename, mimetype, data, size, display_order) VALUES (?, ?, ?, ?, ?, ?)',
    args: [title, filename, mimetype, base64Data, size, maxOrder + 1]
  });
};

const updateKPIDocumentTitle = async (id, title) => {
  return await db.execute({
    sql: 'UPDATE kpi_documents SET title = ? WHERE id = ?',
    args: [title, id]
  });
};

const updateKPIDocumentOrder = async (id, displayOrder) => {
  return await db.execute({
    sql: 'UPDATE kpi_documents SET display_order = ? WHERE id = ?',
    args: [displayOrder, id]
  });
};

const deleteKPIDocument = async (id) => {
  // Also delete associated annotations
  await db.execute({
    sql: 'DELETE FROM kpi_document_annotations WHERE document_id = ?',
    args: [id]
  });
  return await db.execute({
    sql: 'DELETE FROM kpi_documents WHERE id = ?',
    args: [id]
  });
};

// KPI Document Annotations functions
const getAnnotations = async (documentId) => {
  const result = await db.execute({
    sql: 'SELECT * FROM kpi_document_annotations WHERE document_id = ? ORDER BY created_at DESC',
    args: [documentId]
  });
  return result.rows;
};

const addAnnotation = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO kpi_document_annotations (document_id, content, author, annotation_type) VALUES (?, ?, ?, ?)',
    args: [data.document_id, data.content, data.author || 'Anonymous', data.annotation_type || 'comment']
  });
};

const updateAnnotation = async (id, data) => {
  return await db.execute({
    sql: 'UPDATE kpi_document_annotations SET content = ?, author = ?, annotation_type = ? WHERE id = ?',
    args: [data.content, data.author || 'Anonymous', data.annotation_type || 'comment', id]
  });
};

const deleteAnnotation = async (id) => {
  return await db.execute({
    sql: 'DELETE FROM kpi_document_annotations WHERE id = ?',
    args: [id]
  });
};

const getStorageStats = async () => {
  const kpiDocs = await db.execute('SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as totalSize, COALESCE(SUM(LENGTH(data)), 0) as totalBase64Size FROM kpi_documents');
  const uploadedFiles = await db.execute('SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as totalSize, COALESCE(SUM(LENGTH(data)), 0) as totalBase64Size FROM uploaded_files');
  return {
    kpiDocuments: {
      count: Number(kpiDocs.rows[0].count),
      originalSize: Number(kpiDocs.rows[0].totalSize),
      base64Size: Number(kpiDocs.rows[0].totalBase64Size),
    },
    uploadedFiles: {
      count: Number(uploadedFiles.rows[0].count),
      originalSize: Number(uploadedFiles.rows[0].totalSize),
      base64Size: Number(uploadedFiles.rows[0].totalBase64Size),
    },
  };
};

// Day notes
const getDayNotes = async ({ from, to } = {}) => {
  if (from && to) {
    const result = await db.execute({
      sql: 'SELECT * FROM day_notes WHERE date >= ? AND date <= ? ORDER BY date, created_at',
      args: [from, to],
    });
    return result.rows;
  }
  const result = await db.execute('SELECT * FROM day_notes ORDER BY date, created_at');
  return result.rows;
};

const addDayNote = async ({ date, body, author }) => {
  const result = await db.execute({
    sql: 'INSERT INTO day_notes (date, body, author) VALUES (?, ?, ?)',
    args: [date, body, author || 'Admin'],
  });
  return Number(result.lastInsertRowid);
};

const updateDayNote = async (id, { body }) => {
  await db.execute({
    sql: 'UPDATE day_notes SET body = ? WHERE id = ?',
    args: [body, id],
  });
};

const deleteDayNote = async (id) => {
  await db.execute({ sql: 'DELETE FROM day_notes WHERE id = ?', args: [id] });
};

// Published schedules
const getLatestPublishedSchedule = async (month, year) => {
  const result = await db.execute({
    sql: 'SELECT * FROM published_schedules WHERE month = ? AND year = ? ORDER BY published_at DESC LIMIT 1',
    args: [month, year],
  });
  return result.rows[0] || null;
};

const insertPublishedSchedule = async ({ month, year, snapshotJson }) => {
  const result = await db.execute({
    sql: 'INSERT INTO published_schedules (month, year, snapshot_json) VALUES (?, ?, ?)',
    args: [month, year, snapshotJson],
  });
  return Number(result.lastInsertRowid);
};

// Page log functions (hospitalist pager history)
const addPageLog = async (data) => {
  return await db.execute({
    sql: 'INSERT INTO page_logs (sender_name, message, beds, sent_at, completed_at, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [data.sender_name, data.message, data.beds || null, data.sent_at, data.completed_at || null, data.status, data.error_message || null]
  });
};

const getRecentPageLogs = async (limit = 5) => {
  const result = await db.execute({
    sql: 'SELECT * FROM page_logs ORDER BY sent_at DESC LIMIT ?',
    args: [limit]
  });
  return result.rows;
};

const getAllPageLogs = async (limit = 50) => {
  const result = await db.execute({
    sql: 'SELECT * FROM page_logs ORDER BY sent_at DESC LIMIT ?',
    args: [limit]
  });
  return result.rows;
};

module.exports = {
  initializeDatabase,
  getProviders,
  getDayNotes,
  addDayNote,
  updateDayNote,
  deleteDayNote,
  getLatestPublishedSchedule,
  insertPublishedSchedule,
  getShifts,
  getKPIMetrics,
  getQuickLinks,
  getPhoneDirectory,
  getNews,
  getOrderSetSuggestions,
  updateKPIMetric,
  createOrderSetSuggestion,
  updateOrderSetSuggestion,
  deleteOrderSetSuggestion,
  addPhoneNumber,
  updatePhoneNumber,
  deletePhoneNumber,
  getScheduleRequests,
  addScheduleRequest,
  updateScheduleRequest,
  deleteScheduleRequest,
  addNews,
  updateNews,
  deleteNews,
  getProviderCharts,
  addProviderChart,
  updateProviderChart,
  deleteProviderChart,
  upsertProviderChart,
  bulkUpsertProviderCharts,
  getProviderChartHistory,
  getAllProviderChartHistory,
  getKPIGoals,
  addKPIGoal,
  updateKPIGoal,
  deleteKPIGoal,
  getMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  getReplies,
  addReply,
  deleteReply,
  saveFile,
  getFile,
  deleteFile,
  getKPIDocuments,
  getKPIDocument,
  addKPIDocument,
  updateKPIDocumentTitle,
  updateKPIDocumentOrder,
  deleteKPIDocument,
  getAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  getStorageStats,
  addPageLog,
  getRecentPageLogs,
  getAllPageLogs
};
