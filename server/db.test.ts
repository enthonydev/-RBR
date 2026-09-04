import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addAmortization, createFinancing, getFinancingWithAmortizations, listFinancings, openDatabase, removeAmortization } from "./db";

describe("financing database", () => {
  it("persiste financiamento e amortização vinculada", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));

    const financing = createFinancing(database, { principal: 270000, annualRate: 12.5, termMonths: 360, method: "price" }, "Casa");
    const amortization = addAmortization(database, financing.id, { month: 10, amount: 20000 }, "term");

    expect(listFinancings(database)).toHaveLength(1);
    expect(amortization).toMatchObject({ financingId: financing.id, month: 10, amount: 20000, goal: "term" });
    expect(getFinancingWithAmortizations(database, financing.id)?.amortizations).toHaveLength(1);

    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("remove somente a amortização do financiamento informado", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "rbr-"));
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const financing = createFinancing(database, { principal: 100000, annualRate: 10, termMonths: 120, method: "sac" });
    const amortization = addAmortization(database, financing.id, { month: 12, amount: 5000 }, "payment")!;

    expect(removeAmortization(database, financing.id, amortization.id)).toBe(true);
    expect(getFinancingWithAmortizations(database, financing.id)?.amortizations).toEqual([]);
    expect(removeAmortization(database, financing.id, amortization.id)).toBe(false);

    database.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
