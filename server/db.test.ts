import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { addAmortization, createFinancing, createUser, ensureLocalUser, getFinancingWithAmortizations, listFinancings, openDatabase, removeAmortization } from "./db";

describe("financing database", () => {
  it("garante o usuário local de forma idempotente", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));

    const first = ensureLocalUser(database);
    const second = ensureLocalUser(database);
    expect(first.id).toBe(second.id);
    expect(first.email).toBe(second.email);

    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("persiste financiamento e amortização vinculada ao usuário", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const user = ensureLocalUser(database);

    const financing = createFinancing(database, user.id, { principal: 270000, annualRate: 12.5, termMonths: 360, method: "price" }, "Casa");
    const amortization = addAmortization(database, user.id, financing.id, { month: 10, amount: 20000 }, "term");

    expect(listFinancings(database, user.id)).toHaveLength(1);
    expect(amortization).toMatchObject({ financingId: financing.id, month: 10, amount: 20000, goal: "term" });
    expect(getFinancingWithAmortizations(database, user.id, financing.id)?.amortizations).toHaveLength(1);

    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("não permite que um dono leia ou remova o financiamento de outro", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const owner = createUser(database, randomUUID(), "owner@example.com", "Owner");
    const other = createUser(database, randomUUID(), "other@example.com", "Other");
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
