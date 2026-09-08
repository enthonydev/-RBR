export type AmortizationMethod = "price" | "sac";
export type AmortizationGoal = "term" | "payment";

export interface FinancingInput {
  principal: number;
  annualRate: number;
  termMonths: number;
  method: AmortizationMethod;
}

export interface ExtraordinaryPayment {
  month: number;
  amount: number;
}

export interface ScheduleRow {
  month: number;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  extraordinary: number;
  closingBalance: number;
}

export interface FinancingSimulation {
  monthlyRate: number;
  scheduledPayment: number;
  totalInterest: number;
  totalPaid: number;
  payoffMonth: number;
  schedule: ScheduleRow[];
}

export interface SimulationComparison {
  baseline: FinancingSimulation;
  scenario: FinancingSimulation;
  interestSavings: number;
  monthsReduced: number;
}

const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function validateInput(input: FinancingInput) {
  if (!Number.isFinite(input.principal) || input.principal <= 0) throw new Error("O valor financiado deve ser maior que zero.");
  if (!Number.isFinite(input.annualRate) || input.annualRate < 0) throw new Error("A taxa de juros não pode ser negativa.");
  if (!Number.isInteger(input.termMonths) || input.termMonths <= 0) throw new Error("O prazo deve ser um número inteiro maior que zero.");
}

function monthlyRateFromAnnual(annualRate: number) {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
}

function pricePayment(balance: number, monthlyRate: number, months: number) {
  if (monthlyRate === 0) return cents(balance / months);
  const factor = Math.pow(1 + monthlyRate, months);
  return cents(balance * (monthlyRate * factor) / (factor - 1));
}

function calculateScheduledPayment(method: AmortizationMethod, balance: number, monthlyRate: number, remainingMonths: number, originalPrincipal: number, originalTerm: number) {
  if (method === "price") return pricePayment(balance, monthlyRate, remainingMonths);
  const principal = originalPrincipal / originalTerm;
  return cents(principal + balance * monthlyRate);
}

function paymentsByMonth(payments: ExtraordinaryPayment[] = []) {
  const map = new Map<number, number>();
  for (const payment of payments) {
    if (!Number.isInteger(payment.month) || payment.month <= 0) throw new Error("O mês da amortização deve ser um número inteiro positivo.");
    if (!Number.isFinite(payment.amount) || payment.amount <= 0) throw new Error("A amortização deve ser maior que zero.");
    map.set(payment.month, cents((map.get(payment.month) ?? 0) + payment.amount));
  }
  return map;
}

export function simulateFinancing(input: FinancingInput, extraPayments: ExtraordinaryPayment[] = [], goal: AmortizationGoal = "term"): FinancingSimulation {
  validateInput(input);
  const monthlyRate = monthlyRateFromAnnual(input.annualRate);
  const extras = paymentsByMonth(extraPayments);
  const rows: ScheduleRow[] = [];
  let balance = cents(input.principal);
  let paymentAfterExtra = 0;
  let sacPrincipalAfterExtra = 0;
  const basePayment = pricePayment(input.principal, monthlyRate, input.termMonths);

  for (let month = 1; month <= input.termMonths && balance > 0; month += 1) {
    const openingBalance = balance;
    const remainingMonths = input.termMonths - month + 1;
    const interest = cents(openingBalance * monthlyRate);
    const scheduled = goal === "payment" && paymentAfterExtra > 0
      ? input.method === "sac"
        ? cents(sacPrincipalAfterExtra + interest)
        : paymentAfterExtra
      : input.method === "price" && goal === "term"
        ? basePayment
        : calculateScheduledPayment(input.method, openingBalance, monthlyRate, remainingMonths, input.principal, input.termMonths);
    const principal = cents(Math.min(openingBalance, Math.max(0, scheduled - interest)));
    const extra = cents(Math.min(Math.max(0, openingBalance - principal), extras.get(month) ?? 0));
    const closingBalance = cents(Math.max(0, openingBalance - principal - extra));
    const payment = cents(interest + principal + extra);

    rows.push({ month, openingBalance, payment, interest, principal, extraordinary: extra, closingBalance });
    balance = closingBalance;

    if (goal === "payment" && extra > 0 && balance > 0) {
      const remainingAfterExtra = Math.max(1, input.termMonths - month);
      if (input.method === "price") {
        paymentAfterExtra = pricePayment(balance, monthlyRate, remainingAfterExtra);
      } else {
        sacPrincipalAfterExtra = cents(balance / remainingAfterExtra);
        paymentAfterExtra = sacPrincipalAfterExtra;
      }
    }
  }

  const totalInterest = cents(rows.reduce((sum, row) => sum + row.interest, 0));
  const totalPaid = cents(rows.reduce((sum, row) => sum + row.payment, 0));
  const scheduledPayment = scheduledPaymentForResult(input, monthlyRate);
  return { monthlyRate, scheduledPayment, totalInterest, totalPaid, payoffMonth: rows.length, schedule: rows };
}

function scheduledPaymentForResult(input: FinancingInput, monthlyRate: number) {
  return input.method === "price"
    ? pricePayment(input.principal, monthlyRate, input.termMonths)
    : calculateScheduledPayment(input.method, input.principal, monthlyRate, input.termMonths, input.principal, input.termMonths);
}

export function compareFinancing(input: FinancingInput, extraPayments: ExtraordinaryPayment[], goal: AmortizationGoal = "term"): SimulationComparison {
  const baseline = simulateFinancing(input);
  const scenario = simulateFinancing(input, extraPayments, goal);
  return {
    baseline,
    scenario,
    interestSavings: cents(baseline.totalInterest - scenario.totalInterest),
    monthsReduced: baseline.payoffMonth - scenario.payoffMonth,
  };
}

export function parseCurrency(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error("Valor monetário inválido.");
  return parsed;
}
