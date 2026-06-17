const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'bank.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    username TEXT NOT NULL,
    cash INTEGER DEFAULT 1000,
    bank INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    job TEXT DEFAULT NULL,
    job_level INTEGER DEFAULT 1,
    last_salary INTEGER DEFAULT 0,
    last_weekly INTEGER DEFAULT 0,
    last_monthly INTEGER DEFAULT 0,
    last_bonus INTEGER DEFAULT 0,
    last_work INTEGER DEFAULT 0,
    last_crime INTEGER DEFAULT 0,
    last_fish INTEGER DEFAULT 0,
    last_mine INTEGER DEFAULT 0,
    last_chop INTEGER DEFAULT 0,
    last_farm INTEGER DEFAULT 0,
    last_gather INTEGER DEFAULT 0,
    last_dig INTEGER DEFAULT 0,
    prison_until INTEGER DEFAULT 0,
    married_to TEXT DEFAULT NULL,
    guild_name TEXT DEFAULT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    UNIQUE(user_id, guild_id, item_name)
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    property_name TEXT NOT NULL,
    bought_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_rent INTEGER DEFAULT 0,
    UNIQUE(user_id, guild_id, property_name)
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    invested_at INTEGER DEFAULT (strftime('%s', 'now')),
    return_rate REAL DEFAULT 0.0
  );

  CREATE TABLE IF NOT EXISTS stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    last_updated INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS user_stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    avg_price INTEGER NOT NULL,
    UNIQUE(user_id, guild_id, symbol)
  );

  CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    pet_name TEXT NOT NULL,
    pet_type TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    hunger INTEGER DEFAULT 100,
    happiness INTEGER DEFAULT 100,
    last_feed INTEGER DEFAULT 0,
    last_play INTEGER DEFAULT 0,
    UNIQUE(user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS guilds_config (
    guild_id TEXT PRIMARY KEY,
    bank_channel TEXT DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS game_guilds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    leader_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    members TEXT DEFAULT '[]',
    treasury INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(name, guild_id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    achievement TEXT NOT NULL,
    earned_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(user_id, guild_id, achievement)
  );

  CREATE TABLE IF NOT EXISTS daily_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    data TEXT DEFAULT '{}',
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

const defaultStocks = [
  { symbol: 'TECH', name: 'شركة التقنية', price: 500 },
  { symbol: 'GOLD', name: 'شركة الذهب', price: 1200 },
  { symbol: 'OIL', name: 'شركة النفط', price: 800 },
  { symbol: 'FOOD', name: 'شركة الغذاء', price: 300 },
  { symbol: 'BANK', name: 'البنك المركزي', price: 2000 },
  { symbol: 'AUTO', name: 'شركة السيارات', price: 650 },
  { symbol: 'MED', name: 'شركة الدواء', price: 950 },
  { symbol: 'REAL', name: 'العقارات المتحدة', price: 1500 },
];

for (const stock of defaultStocks) {
  db.prepare(`INSERT OR IGNORE INTO stocks (symbol, name, price) VALUES (?, ?, ?)`)
    .run(stock.symbol, stock.name, stock.price);
}

module.exports = db;
