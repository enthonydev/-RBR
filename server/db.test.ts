import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addAmortization, createFinancing, createSession, createUser, deleteSession, getFinancingWithAmortizations, getUserBySession, listFinancings, openDatabase, removeAmortization, verifyPassword } from "./db";

describe("financing database", () => {
  it("cria usuário, verifica senha e controla a sessão", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const user = createUser(database, "auth@example.com", "Auth", "password123");
    const stored = database.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(user.id) as { password_hash: string };
    const session = createSession(database, user.id);

    expect(verifyPassword("password123", stored.password_hash)).toBe(true);
    expect(verifyPassword("wrong-password", stored.password_hash)).toBe(false);
    expect(getUserBySession(database, session.token)?.id).toBe(user.id);
    deleteSession(database, session.token);
    expect(getUserBySession(database, session.token)).toBeNull();

    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("persiste financiamento e amortização vinculada ao usuário", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const user = createUser(database, "owner@example.com", "Owner", "password123");

    const financing = createFinancing(database, user.id, { principal: 270000, annualRate: 12.5, termMonths: 360, method: "price" }, "Casa");
    const amortization = addAmortization(database, user.id, financing.id, { month: 10, amount: 20000 }, "term");

    expect(listFinancings(database, user.id)).toHaveLength(1);
    expect(amortization).toMatchObject({ financingId: financing.id, month: 10, amount: 20000, goal: "term" });
    expect(getFinancingWithAmortizations(database, user.id, financing.id)?.amortizations).toHaveLength(1);

    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("não permite que um usuário leia ou remova o financiamento de outro", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const owner = createUser(database, "owner@example.com", "Owner", "password123");
    const other = createUser(database, "other@example.com", "Other", "password123");
    const financing = createFinancing(database, owner.id, { principal: 100000, annualRate: 10, termMonths: 120, method: "sac" });
    const amortization = addAmortization(database, owner.id, financing.id, { month: 12, amount: 5000 }, "payment")!;

    expect(listFinancings(database, other.id)).toEqual([]);
    expect(getFinancingWithAmortizations(database, other.id, financing.id)).toBeNull();
    expect(removeAmortization(database, other.id, financing.id, amortization.id)).toBe(false);
    expect(getFinancingWithAmortizations(database, owner.id, financing.id)?.amortizations).toHaveLength(1);

    database.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
