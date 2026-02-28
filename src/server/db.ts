import Database from 'better-sqlite3';

const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    monthlyIncome REAL,
    savingsGoal REAL,
    riskScore REAL,
    totalSpent REAL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    amount REAL,
    category TEXT,
    merchant TEXT,
    timestamp TEXT,
    isImpulsive INTEGER,
    recipient TEXT,
    upiId TEXT,
    note TEXT,
    mood TEXT,
    prePaymentMemoryShown INTEGER,
    prePaymentAction TEXT
  );

  CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    message TEXT,
    severity TEXT,
    category TEXT,
    triggeredAt TEXT,
    wasAcknowledged INTEGER
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    name TEXT,
    icon TEXT,
    isDefault INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS dreams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    name TEXT,
    cost REAL,
    saved REAL DEFAULT 0,
    targetDate TEXT,
    createdAt TEXT
  );
`);

// Seed demo user
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (userId, monthlyIncome, savingsGoal, riskScore, totalSpent)
  VALUES (?, ?, ?, ?, ?)
`);
insertUser.run('demo_user', 50000, 10000, 0, 0);

// Seed default categories for demo user
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (userId, name, icon, isDefault)
  VALUES (?, ?, ?, ?)
`);

const DEFAULT_CATEGORIES = [
  { name: 'FOOD', icon: '🍔' },
  { name: 'SHOPPING', icon: '🛍️' },
  { name: 'ENTERTAINMENT', icon: '🎬' },
  { name: 'TRANSPORT', icon: '🚕' },
  { name: 'BILLS', icon: '📱' },
  { name: 'GAMBLING', icon: '🎲' },
  { name: 'LUXURY', icon: '💎' }
];

const existingCats = db.prepare(`SELECT count(*) as count FROM categories WHERE userId = ?`).get('demo_user') as { count: number };
if (existingCats.count === 0) {
  DEFAULT_CATEGORIES.forEach(c => insertCategory.run('demo_user', c.name, c.icon, 1));
}

export default db;
