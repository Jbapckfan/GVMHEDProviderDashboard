const { createClient } = require('@libsql/client');

// Create Turso client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

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
  const result = await db.execute('SELECT * FROM provider_charts ORDER BY provider_name');
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
  return await db.execute({
    sql: 'DELETE FROM messages WHERE id=?',
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

module.exports = {
  initializeDatabase,
  getProviders,
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
  addNews,
  updateNews,
  deleteNews,
  getProviderCharts,
  addProviderChart,
  updateProviderChart,
  deleteProviderChart,
  getKPIGoals,
  addKPIGoal,
  updateKPIGoal,
  deleteKPIGoal,
  getMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  saveFile,
  getFile,
  deleteFile
};
