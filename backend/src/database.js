const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dashboard.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // Providers table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS quick_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT
    )
  `);

  // Seed initial data if tables are empty
  seedData();
}

function seedData() {
  const providerCount = db.prepare('SELECT COUNT(*) as count FROM providers').get();

  if (providerCount.count === 0) {
    // Seed providers
    const insertProvider = db.prepare('INSERT INTO providers (name, role, phone, email, status) VALUES (?, ?, ?, ?, ?)');
    insertProvider.run('Dr. Sarah Johnson', 'Attending Physician', '555-0101', 'sjohnson@hospital.com', 'on-duty');
    insertProvider.run('Dr. Michael Chen', 'Attending Physician', '555-0102', 'mchen@hospital.com', 'available');
    insertProvider.run('Dr. Emily Rodriguez', 'Resident', '555-0103', 'erodriguez@hospital.com', 'on-duty');
    insertProvider.run('Nurse Jessica Williams', 'Charge Nurse', '555-0104', 'jwilliams@hospital.com', 'on-duty');
    insertProvider.run('Dr. David Martinez', 'Attending Physician', '555-0105', 'dmartinez@hospital.com', 'off-duty');

    // Seed shifts for today and tomorrow
    const insertShift = db.prepare('INSERT INTO shifts (provider_name, shift_type, start_time, end_time, date) VALUES (?, ?, ?, ?, ?)');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    insertShift.run('Dr. Sarah Johnson', 'Day Shift', '07:00', '19:00', today);
    insertShift.run('Dr. Emily Rodriguez', 'Day Shift', '07:00', '19:00', today);
    insertShift.run('Nurse Jessica Williams', 'Day Shift', '07:00', '19:00', today);
    insertShift.run('Dr. Michael Chen', 'Night Shift', '19:00', '07:00', today);
    insertShift.run('Dr. David Martinez', 'Day Shift', '07:00', '19:00', tomorrow);

    // Seed KPI Metrics
    const insertKPI = db.prepare('INSERT INTO kpi_metrics (metric_name, metric_value, target_value, unit, category) VALUES (?, ?, ?, ?, ?)');

    // Patient Flow Metrics
    insertKPI.run('Average Length of Stay', 3.2, 3.0, 'hours', 'Patient Flow');
    insertKPI.run('Door-to-Doctor Time', 28, 30, 'minutes', 'Patient Flow');
    insertKPI.run('Left Without Being Seen', 2.1, 2.0, 'percent', 'Patient Flow');
    insertKPI.run('Patient Throughput', 145, 150, 'patients/day', 'Patient Flow');

    // Quality Metrics
    insertKPI.run('Patient Satisfaction Score', 4.3, 4.5, 'out of 5', 'Quality');
    insertKPI.run('72-Hour Return Rate', 4.8, 5.0, 'percent', 'Quality');
    insertKPI.run('Admission Rate', 18.5, 20.0, 'percent', 'Quality');
    insertKPI.run('Discharge Rate', 81.5, 80.0, 'percent', 'Quality');

    // Operational Metrics
    insertKPI.run('Staff Utilization', 87, 85, 'percent', 'Operational');
    insertKPI.run('Bed Occupancy Rate', 78, 80, 'percent', 'Operational');
    insertKPI.run('Average Wait Time', 42, 45, 'minutes', 'Operational');
    insertKPI.run('Patient Per Provider Ratio', 8.5, 10.0, 'patients', 'Operational');

    // Financial Metrics
    insertKPI.run('Cost Per Visit', 420, 450, 'dollars', 'Financial');
    insertKPI.run('Revenue Per Patient', 685, 650, 'dollars', 'Financial');
    insertKPI.run('Collection Rate', 92.3, 90.0, 'percent', 'Financial');

    // Seed quick links
    const insertLink = db.prepare('INSERT INTO quick_links (title, url, category) VALUES (?, ?, ?)');
    insertLink.run('UpToDate', 'https://www.uptodate.com', 'Reference');
    insertLink.run('MDCalc', 'https://www.mdcalc.com', 'Clinical Tools');
    insertLink.run('Hospital EMR', '#', 'Internal');
    insertLink.run('Radiology PACS', '#', 'Internal');
    insertLink.run('Lab Results Portal', '#', 'Internal');
    insertLink.run('Pharmacy Reference', '#', 'Reference');
  }
}

// API functions
const getProviders = () => db.prepare('SELECT * FROM providers ORDER BY name').all();
const getShifts = (date) => db.prepare('SELECT * FROM shifts WHERE date = ? ORDER BY start_time').all(date);
const getKPIMetrics = () => db.prepare('SELECT * FROM kpi_metrics ORDER BY category, metric_name').all();
const getQuickLinks = () => db.prepare('SELECT * FROM quick_links ORDER BY category, title').all();

const updateKPIMetric = (data) => {
  const stmt = db.prepare(`
    UPDATE kpi_metrics
    SET metric_value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE metric_name = ?
  `);
  return stmt.run(data.metric_value, data.metric_name);
};

module.exports = {
  initializeDatabase,
  getProviders,
  getShifts,
  getKPIMetrics,
  getQuickLinks,
  updateKPIMetric
};
