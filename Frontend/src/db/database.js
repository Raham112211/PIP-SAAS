import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { get, set, del } from 'idb-keyval';

const DB_STORE_KEY = 'pip_sqlite_db_clean_v12';
let dbInstance = null;
let initPromise = null;

async function saveDbToStorage() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  await set(DB_STORE_KEY, data);
}

export async function initDatabase() {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl,
    });

    const savedBinary = await get(DB_STORE_KEY);
    if (savedBinary && savedBinary.length > 0) {
      dbInstance = new SQL.Database(savedBinary);
    } else {
      dbInstance = new SQL.Database();
      createTables(dbInstance);
      await saveDbToStorage();
    }
    return dbInstance;
  })();

  return initPromise;
}

function createTables(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      organizationName TEXT,
      phone TEXT,
      role TEXT,
      mustResetPassword INTEGER DEFAULT 0,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      website TEXT,
      registrationNumber TEXT,
      industry TEXT
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      staffCount INTEGER DEFAULT 0,
      code TEXT,
      connectionCount INTEGER DEFAULT 0,
      createdAt TEXT,
      refNo TEXT,
      disco TEXT DEFAULT 'LESCO',
      billStartDate TEXT,
      billEndDate TEXT,
      autoScrapeEnabled INTEGER DEFAULT 1,
      lastScrapeResult TEXT DEFAULT 'Scheduled'
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      refNo TEXT UNIQUE NOT NULL,
      branchId TEXT,
      branchName TEXT,
      disco TEXT NOT NULL,
      meterNo TEXT NOT NULL,
      address TEXT,
      status TEXT DEFAULT 'active',
      lastBillAmount REAL DEFAULT 0,
      lastBillDate TEXT,
      dueDate TEXT
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      connectionId TEXT,
      refNo TEXT NOT NULL,
      consumerId TEXT NOT NULL,
      disco TEXT NOT NULL,
      branchId TEXT,
      branchName TEXT NOT NULL,
      billingMonth TEXT NOT NULL,
      issueDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      currentAmount REAL DEFAULT 0,
      fpaAmount REAL DEFAULT 0,
      gstTaxes REAL DEFAULT 0,
      incomeTax REAL DEFAULT 0,
      otherCharges REAL DEFAULT 0,
      totalPayable REAL DEFAULT 0,
      prevReading INTEGER DEFAULT 0,
      currReading INTEGER DEFAULT 0,
      unitsConsumed INTEGER DEFAULT 0,
      tariff TEXT DEFAULT 'A-2 Commercial',
      status TEXT DEFAULT 'pending',
      scrapeStatus TEXT DEFAULT 'success',
      scrapeTime TEXT,
      historySeries TEXT DEFAULT 'v2.0'
    );

    CREATE TABLE IF NOT EXISTS scraping_jobs (
      id TEXT PRIMARY KEY,
      connectionRef TEXT NOT NULL,
      disco TEXT NOT NULL,
      branchName TEXT,
      status TEXT NOT NULL,
      runAt TEXT NOT NULL,
      duration TEXT,
      billFetched INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      branchId TEXT,
      branchName TEXT,
      status TEXT DEFAULT 'active',
      joinDate TEXT,
      salary REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      permissionsCount INTEGER DEFAULT 0,
      usersCount INTEGER DEFAULT 0,
      isSystem INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      roleId TEXT NOT NULL,
      permissionId TEXT NOT NULL,
      PRIMARY KEY (roleId, permissionId)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      time TEXT NOT NULL
    );
  `);
}

// Exec SQL Query returning Array of Objects
export async function dbSelect(sql, params = []) {
  const db = await initDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export async function dbSelectOne(sql, params = []) {
  const rows = await dbSelect(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function dbRun(sql, params = []) {
  const db = await initDatabase();
  db.run(sql, params);
  await saveDbToStorage();
}

export async function resetDatabase() {
  await del(DB_STORE_KEY);
  dbInstance = null;
  initPromise = null;
  return initDatabase();
}
