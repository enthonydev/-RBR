import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { type AmortizationGoal, type AmortizationMethod, type ExtraordinaryPayment, type FinancingInput } from "@shared/finance";
import { addAmortization, createFinancing, deleteFinancing, ensureLocalUser, getFinancingWithAmortizations, listFinancings, openDatabase, removeAmortization, updateFinancing } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isMethod(value: unknown): value is AmortizationMethod {
  return value === "price" || value === "sac";
}

function isGoal(value: unknown): value is AmortizationGoal {
  return value === "term" || value === "payment";
}

function readFinancingInput(body: Record<string, unknown>): FinancingInput {
  const input = { principal: Number(body.principal), annualRate: Number(body.annualRate), termMonths: Number(body.termMonths), method: body.method };
  if (!Number.isFinite(input.principal) || input.principal <= 0 || !Number.isFinite(input.annualRate) || input.annualRate < 0 || !Number.isInteger(input.termMonths) || input.termMonths <= 0 || !isMethod(input.method)) throw new Error("Dados do financiamento inválidos.");
  return input as FinancingInput;
}

function readAmortization(body: Record<string, unknown>) {
  const payment = { month: Number(body.month), amount: Number(body.amount) };
  const goal = body.goal ?? "term";
  if (!Number.isInteger(payment.month) || payment.month <= 0 || !Number.isFinite(payment.amount) || payment.amount <= 0 || !isGoal(goal)) throw new Error("Dados da amortização inválidos.");
  return { payment, goal } as { payment: ExtraordinaryPayment; goal: AmortizationGoal };
}

function readAmortizations(value: unknown, goal: AmortizationGoal) {
  if (!Array.isArray(value)) throw new Error("Lista de amortizações inválida.");
  return value.map((item) => readAmortization({ ...(item as Record<string, unknown>), goal }).payment);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const database = openDatabase();
  const localUser = ensureLocalUser(database);
  app.use(express.json());

  app.get("/api/financings", (_req, res) => {
    res.json(listFinancings(database, localUser.id));
  });

  app.post("/api/financings", (req, res) => {
    try {
      const input = readFinancingInput(req.body as Record<string, unknown>);
      const name = typeof req.body.name === "string" ? req.body.name : "Meu financiamento";
      const goal = req.body.goal ?? "term";
      if (!isGoal(goal)) throw new Error("Objetivo de amortização inválido.");
      const financing = createFinancing(database, localUser.id, input, name);
      const amortizations = readAmortizations(req.body.extraPayments ?? [], goal);
      return res.status(201).json(updateFinancing(database, localUser.id, financing.id, input, amortizations, goal));
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível salvar o financiamento." });
    }
  });

  app.put("/api/financings/:id", (req, res) => {
    try {
      const input = readFinancingInput(req.body as Record<string, unknown>);
      const goal = req.body.goal ?? "term";
      if (!isGoal(goal)) throw new Error("Objetivo de amortização inválido.");
      const amortizations = readAmortizations(req.body.extraPayments, goal);
      const name = typeof req.body.name === "string" ? req.body.name : undefined;
      const financing = updateFinancing(database, localUser.id, req.params.id, input, amortizations, goal, name);
      return financing ? res.json(financing) : res.status(404).json({ error: "Financiamento não encontrado." });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o financiamento." });
    }
  });

  app.get("/api/financings/:id", (req, res) => {
    const financing = getFinancingWithAmortizations(database, localUser.id, req.params.id);
    return financing ? res.json(financing) : res.status(404).json({ error: "Financiamento não encontrado." });
  });

  app.delete("/api/financings/:id", (req, res) => {
    return deleteFinancing(database, localUser.id, req.params.id) ? res.status(204).send() : res.status(404).json({ error: "Financiamento não encontrado." });
  });

  app.post("/api/financings/:id/amortizations", (req, res) => {
    try {
      const { payment, goal } = readAmortization(req.body as Record<string, unknown>);
      const amortization = addAmortization(database, localUser.id, req.params.id, payment, goal);
      return amortization ? res.status(201).json(amortization) : res.status(404).json({ error: "Financiamento não encontrado." });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível salvar a amortização." });
    }
  });

  app.delete("/api/financings/:id/amortizations/:amortizationId", (req, res) => {
    const removed = removeAmortization(database, localUser.id, req.params.id, req.params.amortizationId);
    return removed ? res.status(204).send() : res.status(404).json({ error: "Amortização não encontrada." });
  });



  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
