import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import type { AmortizationGoal, AmortizationMethod, ExtraordinaryPayment, FinancingInput } from "@shared/finance";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
type Database = InstanceType<typeof DatabaseSync>;

export interface FinancingRecord extends FinancingInput {
  id: string;
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

const schema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS financings (
    id TEXT PRIMARY KEY,
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
`;

function toFinancing(row: FinancingRow): FinancingRecord {
  return {
    id: row.id,
    name: row.name,
    principal: row.principal,
    annualRate: row.annual_rate,
    termMonths: row.term_months,
    method: row.method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAmortization(row: AmortizationRow): AmortizationRecord {
  return {
    id: row.id,
    financingId: row.financing_id,
    month: row.month,
    amount: row.amount,
    goal: row.goal,
    createdAt: row.created_at,
  };
}

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "data", "rbr.sqlite")) {
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(schema);
  return database;
}

export function createFinancing(database: Database, input: FinancingInput, name = "Meu financiamento") {
  const now = new Date().toISOString();
  const id = randomUUID();
  database.prepare(`INSERT INTO financings (id, name, principal, annual_rate, term_months, method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, name.trim() || "Meu financiamento", input.principal, input.annualRate, input.termMonths, input.method, now, now);
  return getFinancing(database, id)!;
}

export function updateFinancing(database: Database, id: string, input: FinancingInput, extraPayments: ExtraordinaryPayment[], goal: AmortizationGoal) {
  if (!getFinancing(database, id)) return null;
  const now = new Date().toISOString();
  database.exec("BEGIN");
  try {
    database.prepare(`UPDATE financings SET principal = ?, annual_rate = ?, term_months = ?, method = ?, updated_at = ? WHERE id = ?`).run(input.principal, input.annualRate, input.termMonths, input.method, now, id);
    database.prepare(`DELETE FROM amortizations WHERE financing_id = ?`).run(id);
    const insert = database.prepare(`INSERT INTO amortizations (id, financing_id, month, amount, goal, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    for (const payment of extraPayments) insert.run(randomUUID(), id, payment.month, payment.amount, goal, now);
    database.exec("COMMIT");
    return getFinancingWithAmortizations(database, id);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function listFinancings(database: Database) {
  const rows = database.prepare(`SELECT id, name, principal, annual_rate, term_months, method, created_at, updated_at FROM financings ORDER BY updated_at DESC`).all() as unknown as FinancingRow[];
  return rows.map(toFinancing);
}

export function getFinancing(database: Database, id: string): FinancingRecord | null {
  const row = database.prepare(`SELECT id, name, principal, annual_rate, term_months, method, created_at, updated_at FROM financings WHERE id = ?`).get(id) as FinancingRow | undefined;
  return row ? toFinancing(row) : null;
}

export function getFinancingWithAmortizations(database: Database, id: string): FinancingWithAmortizations | null {
  const financing = getFinancing(database, id);
  if (!financing) return null;
  const rows = database.prepare(`SELECT id, financing_id, month, amount, goal, created_at FROM amortizations WHERE financing_id = ? ORDER BY month ASC, created_at ASC`).all(id) as unknown as AmortizationRow[];
  return { ...financing, amortizations: rows.map(toAmortization) };
}

export function addAmortization(database: Database, financingId: string, payment: ExtraordinaryPayment, goal: AmortizationGoal) {
  const financing = getFinancing(database, financingId);
  if (!financing) return null;
  const id = randomUUID();
  const now = new Date().toISOString();
  database.prepare(`INSERT INTO amortizations (id, financing_id, month, amount, goal, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(id, financingId, payment.month, payment.amount, goal, now);
  database.prepare(`UPDATE financings SET updated_at = ? WHERE id = ?`).run(now, financingId);
  const row = database.prepare(`SELECT id, financing_id, month, amount, goal, created_at FROM amortizations WHERE id = ?`).get(id) as AmortizationRow;
  return toAmortization(row);
}

export function removeAmortization(database: Database, financingId: string, amortizationId: string) {
  const result = database.prepare(`DELETE FROM amortizations WHERE id = ? AND financing_id = ?`).run(amortizationId, financingId);
  if (result.changes > 0) database.prepare(`UPDATE financings SET updated_at = ? WHERE id = ?`).run(new Date().toISOString(), financingId);
  return result.changes > 0;
}
