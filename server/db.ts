import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import type { AmortizationGoal, AmortizationMethod, ExtraordinaryPayment, FinancingInput } from "@shared/finance";

// O usuário local permanece como fallback durante a migração para autenticação externa.
const LOCAL_USER_ID = "local";

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

type UserRow = { id: string; email: string; name: string; created_at: string };

const schema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
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

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "data", "rbr.sqlite")) {
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(schema);
  return database;
}

export function createUser(database: Database, id: string, email: string, name: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = { id, email: normalizedEmail, name: name.trim() || normalizedEmail.split("@")[0], createdAt: new Date().toISOString() };
  database.prepare(`INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)`).run(user.id, user.email, user.name, user.createdAt);
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

// Garante que o usuário local exista e devolve seu id. Chamar uma vez no
// start do servidor; todas as rotas de financiamento usam esse id.
export function ensureLocalUser(database: Database) {
  const existing = database.prepare(`SELECT id, email, name, created_at FROM users WHERE id = ?`).get(LOCAL_USER_ID) as UserRow | undefined;
  if (existing) return toUser(existing);
  return createUser(database, LOCAL_USER_ID, "local@rbr.app", "Você");
}

export function createFinancing(database: Database, userId: string, input: FinancingInput, name = "Meu financiamento") {
  const now = new Date().toISOString();
  const id = randomUUID();
  database.prepare(`INSERT INTO financings (id, user_id, name, principal, annual_rate, term_months, method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, userId, name.trim() || "Meu financiamento", input.principal, input.annualRate, input.termMonths, input.method, now, now);
  return getFinancing(database, userId, id)!;
}

export function updateFinancing(database: Database, userId: string, id: string, input: FinancingInput, extraPayments: ExtraordinaryPayment[], goal: AmortizationGoal, name?: string) {
  if (!getFinancing(database, userId, id)) return null;
  const now = new Date().toISOString();
  database.exec("BEGIN");
  try {
    database.prepare(`UPDATE financings SET name = COALESCE(?, name), principal = ?, annual_rate = ?, term_months = ?, method = ?, updated_at = ? WHERE id = ? AND user_id = ?`).run(name?.trim() || null, input.principal, input.annualRate, input.termMonths, input.method, now, id, userId);
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

export function deleteFinancing(database: Database, userId: string, id: string) {
  const result = database.prepare(`DELETE FROM financings WHERE id = ? AND user_id = ?`).run(id, userId);
  return result.changes > 0;
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

export function ensureFirebaseUser(database: Database, uid: string, email?: string, name?: string) {
  const now = new Date().toISOString();
  database.prepare(`INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET email = COALESCE(excluded.email, users.email), name = COALESCE(excluded.name, users.name)`).run(uid, email ?? `${uid}@firebase.local`, name ?? "Usuário RBR", now);
  return database.prepare(`SELECT id, email, name, created_at as createdAt FROM users WHERE id = ?`).get(uid) as { id: string; email: string; name: string; createdAt: string };
}
