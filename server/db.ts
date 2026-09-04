import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { createRequire } from "node:module";
import type { AmortizationGoal, AmortizationMethod, ExtraordinaryPayment, FinancingInput } from "@shared/finance";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
type Database = InstanceType<typeof DatabaseSync>;

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface FinancingRecord extends FinancingInput {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AmortizationRecord extends ExtraordinaryPayment {
  id: string;
  financingId: string;
  goal: AmortizationGoal;
  createdAt: string;
}

export interface FinancingWithAmortizations extends FinancingRecord {
  amortizations: AmortizationRecord[];
}

type FinancingRow = {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  annual_rate: number;
  term_months: number;
  method: AmortizationMethod;
  created_at: string;
  updated_at: string;
};

type AmortizationRow = {
  id: string;
  financing_id: string;
  month: number;
  amount: number;
  goal: AmortizationGoal;
  created_at: string;
};

type UserRow = { id: string; email: string; name: string; password_hash: string; created_at: string };
type SessionRow = { user_id: string; expires_at: string };

const schema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS financings (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    principal REAL NOT NULL CHECK (principal > 0),
    annual_rate REAL NOT NULL CHECK (annual_rate >= 0),
    term_months INTEGER NOT NULL CHECK (term_months > 0),
    method TEXT NOT NULL CHECK (method IN ('price', 'sac')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS amortizations (
    id TEXT PRIMARY KEY,
    financing_id TEXT NOT NULL REFERENCES financings(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month > 0),
    amount REAL NOT NULL CHECK (amount > 0),
    goal TEXT NOT NULL CHECK (goal IN ('term', 'payment')),
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS amortizations_financing_id_idx ON amortizations(financing_id);
  CREATE INDEX IF NOT EXISTS financings_user_id_idx ON financings(user_id);
`;

function toUser(row: UserRow): UserRecord {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}

function toFinancing(row: FinancingRow): FinancingRecord {
  return { id: row.id, userId: row.user_id, name: row.name, principal: row.principal, annualRate: row.annual_rate, termMonths: row.term_months, method: row.method, createdAt: row.created_at, updatedAt: row.updated_at };
}

function toAmortization(row: AmortizationRow): AmortizationRecord {
  return { id: row.id, financingId: row.financing_id, month: row.month, amount: row.amount, goal: row.goal, createdAt: row.created_at };
}

function sessionId(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "data", "rbr.sqlite")) {
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(schema);
  const columns = database.prepare(`PRAGMA table_info(financings)`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "user_id")) database.exec(`ALTER TABLE financings ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE`);
  return database;
}

export function createUser(database: Database, email: string, name: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const salt = randomBytes(16).toString("hex");
  const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  const user = { id: randomUUID(), email: normalizedEmail, name: name.trim() || normalizedEmail.split("@")[0], passwordHash, createdAt: new Date().toISOString() };
  database.prepare(`INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`).run(user.id, user.email, user.name, user.passwordHash, user.createdAt);
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export function claimOrphanedFinancings(database: Database, userId: string) {
  const users = database.prepare(`SELECT COUNT(*) AS count FROM users`).get() as { count: number };
  if (users.count === 1) database.prepare(`UPDATE financings SET user_id = ? WHERE user_id IS NULL`).run(userId);
}

export function findUserByEmail(database: Database, email: string) {
  const row = database.prepare(`SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?`).get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ?? null;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSession(database: Database, userId: string, days = 30) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  database.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`).run(sessionId(token), userId, expiresAt);
  return { token, expiresAt };
}

export function getUserBySession(database: Database, token: string) {
  const row = database.prepare(`SELECT u.id, u.email, u.name, u.created_at, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`).get(sessionId(token)) as (UserRow & { expires_at: string }) | undefined;
  if (!row) return null;
  if (new Date(row.expires_at) <= new Date()) {
    database.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId(token));
    return null;
  }
  return toUser(row);
}

export function deleteSession(database: Database, token: string) {
  database.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId(token));
}

export function createFinancing(database: Database, userId: string, input: FinancingInput, name = "Meu financiamento") {
  const now = new Date().toISOString();
  const id = randomUUID();
  database.prepare(`INSERT INTO financings (id, user_id, name, principal, annual_rate, term_months, method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, userId, name.trim() || "Meu financiamento", input.principal, input.annualRate, input.termMonths, input.method, now, now);
  return getFinancing(database, userId, id)!;
}

export function updateFinancing(database: Database, userId: string, id: string, input: FinancingInput, extraPayments: ExtraordinaryPayment[], goal: AmortizationGoal) {
  if (!getFinancing(database, userId, id)) return null;
  const now = new Date().toISOString();
  database.exec("BEGIN");
  try {
    database.prepare(`UPDATE financings SET principal = ?, annual_rate = ?, term_months = ?, method = ?, updated_at = ? WHERE id = ? AND user_id = ?`).run(input.principal, input.annualRate, input.termMonths, input.method, now, id, userId);
    database.prepare(`DELETE FROM amortizations WHERE financing_id = ?`).run(id);
    const insert = database.prepare(`INSERT INTO amortizations (id, financing_id, month, amount, goal, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    for (const payment of extraPayments) insert.run(randomUUID(), id, payment.month, payment.amount, goal, now);
    database.exec("COMMIT");
    return getFinancingWithAmortizations(database, userId, id);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function listFinancings(database: Database, userId: string) {
  const rows = database.prepare(`SELECT id, user_id, name, principal, annual_rate, term_months, method, created_at, updated_at FROM financings WHERE user_id = ? ORDER BY updated_at DESC`).all(userId) as unknown as FinancingRow[];
  return rows.map(toFinancing);
}

export function getFinancing(database: Database, userId: string, id: string): FinancingRecord | null {
  const row = database.prepare(`SELECT id, user_id, name, principal, annual_rate, term_months, method, created_at, updated_at FROM financings WHERE id = ? AND user_id = ?`).get(id, userId) as FinancingRow | undefined;
  return row ? toFinancing(row) : null;
}

export function getFinancingWithAmortizations(database: Database, userId: string, id: string): FinancingWithAmortizations | null {
  const financing = getFinancing(database, userId, id);
  if (!financing) return null;
  const rows = database.prepare(`SELECT id, financing_id, month, amount, goal, created_at FROM amortizations WHERE financing_id = ? ORDER BY month ASC, created_at ASC`).all(id) as unknown as AmortizationRow[];
  return { ...financing, amortizations: rows.map(toAmortization) };
}

export function addAmortization(database: Database, userId: string, financingId: string, payment: ExtraordinaryPayment, goal: AmortizationGoal) {
  if (!getFinancing(database, userId, financingId)) return null;
  const id = randomUUID();
  const now = new Date().toISOString();
  database.prepare(`INSERT INTO amortizations (id, financing_id, month, amount, goal, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(id, financingId, payment.month, payment.amount, goal, now);
  database.prepare(`UPDATE financings SET updated_at = ? WHERE id = ? AND user_id = ?`).run(now, financingId, userId);
  const row = database.prepare(`SELECT id, financing_id, month, amount, goal, created_at FROM amortizations WHERE id = ?`).get(id) as AmortizationRow;
  return toAmortization(row);
}

export function removeAmortization(database: Database, userId: string, financingId: string, amortizationId: string) {
  if (!getFinancing(database, userId, financingId)) return false;
  const result = database.prepare(`DELETE FROM amortizations WHERE id = ? AND financing_id = ?`).run(amortizationId, financingId);
  if (result.changes > 0) database.prepare(`UPDATE financings SET updated_at = ? WHERE id = ? AND user_id = ?`).run(new Date().toISOString(), financingId, userId);
  return result.changes > 0;
}
