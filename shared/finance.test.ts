import { describe, expect, it } from "vitest";
import { compareFinancing, simulateFinancing } from "./finance";

describe("simulateFinancing", () => {
  it("calcula Price sem juros com parcelas iguais", () => {
    const result = simulateFinancing({ principal: 1200, annualRate: 0, termMonths: 12, method: "price" });

    expect(result.scheduledPayment).toBe(100);
    expect(result.payoffMonth).toBe(12);
    expect(result.totalInterest).toBe(0);
    expect(result.schedule[0]).toMatchObject({ payment: 100, principal: 100, interest: 0, closingBalance: 1100 });
  });

  it("calcula a primeira parcela SAC com amortização constante", () => {
    const result = simulateFinancing({ principal: 100000, annualRate: 12, termMonths: 12, method: "sac" });
    const first = result.schedule[0];

    expect(first.principal).toBeCloseTo(8333.33, 2);
    expect(first.interest).toBeCloseTo(948.88, 2);
    expect(first.payment).toBeCloseTo(9282.21, 2);
    expect(result.schedule[1].principal).toBeCloseTo(8333.33, 2);
    expect(result.schedule.at(-1)?.closingBalance).toBe(0);
  });

  it("reduz prazo e juros ao aplicar amortização extraordinária", () => {
    const comparison = compareFinancing(
      { principal: 270000, annualRate: 12.5, termMonths: 360, method: "price" },
      [{ month: 12, amount: 20000 }],
      "term",
    );

    expect(comparison.scenario.payoffMonth).toBeLessThan(comparison.baseline.payoffMonth);
    expect(comparison.interestSavings).toBeGreaterThan(0);
    expect(comparison.scenario.schedule[11].extraordinary).toBe(20000);
  });

  it("recalcula a parcela após amortização quando o objetivo é reduzir parcela", () => {
    const comparison = compareFinancing(
      { principal: 100000, annualRate: 10, termMonths: 120, method: "price" },
      [{ month: 12, amount: 10000 }],
      "payment",
    );

    expect(comparison.scenario.schedule[11].extraordinary).toBe(10000);
    expect(comparison.scenario.schedule[12].payment).toBeLessThan(comparison.scenario.schedule[10].payment);
    expect(comparison.scenario.payoffMonth).toBe(comparison.baseline.payoffMonth);
  });
});
