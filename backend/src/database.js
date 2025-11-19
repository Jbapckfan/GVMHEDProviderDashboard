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

  // ED Status table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ed_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_patients INTEGER DEFAULT 0,
      waiting_room INTEGER DEFAULT 0,
      beds_available INTEGER DEFAULT 0,
      avg_wait_time INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Protocols table
  db.exec(`
    CREATE TABLE IF NOT EXISTS protocols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      steps TEXT
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

    // Seed ED Status
    const insertStatus = db.prepare('INSERT INTO ed_status (current_patients, waiting_room, beds_available, avg_wait_time) VALUES (?, ?, ?, ?)');
    insertStatus.run(12, 5, 8, 45);

    // Seed protocols
    const insertProtocol = db.prepare('INSERT INTO protocols (title, category, description, steps) VALUES (?, ?, ?, ?)');
    insertProtocol.run(
      'Chest Pain Protocol',
      'Cardiac',
      'Standard evaluation for chest pain patients',
      JSON.stringify([
        'Immediate ECG within 10 minutes',
        'Obtain vitals and cardiac monitoring',
        'Start IV access',
        'Draw cardiac biomarkers (Troponin, BNP)',
        'Aspirin 325mg if no contraindications',
        'Notify attending physician'
      ])
    );
    insertProtocol.run(
      'Stroke Alert Protocol',
      'Neuro',
      'Time-sensitive stroke evaluation',
      JSON.stringify([
        'Note exact time of symptom onset',
        'Activate stroke team immediately',
        'NPO status',
        'Obtain CT head without contrast',
        'Check blood glucose',
        'Establish large bore IV access'
      ])
    );
    insertProtocol.run(
      'Sepsis Protocol',
      'Infectious Disease',
      'Early sepsis management',
      JSON.stringify([
        'Obtain blood cultures x2',
        'Lactate level',
        'Start broad-spectrum antibiotics within 1 hour',
        'IV fluid resuscitation 30mL/kg',
        'Repeat lactate if initial >2',
        'Consider ICU consultation'
      ])
    );
    insertProtocol.run(
      'Trauma Alert',
      'Trauma',
      'Major trauma activation criteria',
      JSON.stringify([
        'Activate trauma team',
        'Ensure airway patency',
        'C-spine precautions',
        'Two large bore IVs',
        'FAST exam',
        'Trauma labs including type and cross'
      ])
    );

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
const getEDStatus = () => db.prepare('SELECT * FROM ed_status ORDER BY updated_at DESC LIMIT 1').get();
const getProtocols = () => db.prepare('SELECT * FROM protocols ORDER BY category, title').all();
const getQuickLinks = () => db.prepare('SELECT * FROM quick_links ORDER BY category, title').all();

const updateEDStatus = (data) => {
  const stmt = db.prepare(`
    INSERT INTO ed_status (current_patients, waiting_room, beds_available, avg_wait_time)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(data.current_patients, data.waiting_room, data.beds_available, data.avg_wait_time);
};

module.exports = {
  initializeDatabase,
  getProviders,
  getShifts,
  getEDStatus,
  getProtocols,
  getQuickLinks,
  updateEDStatus
};
