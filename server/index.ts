import express, { type Request, type Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { type AmortizationGoal, type AmortizationMethod, type ExtraordinaryPayment, type FinancingInput } from "@shared/finance";
import { addAmortization, claimOrphanedFinancings, createFinancing, createSession, createUser, deleteSession, findUserByEmail, getFinancingWithAmortizations, getUserBySession, listFinancings, openDatabase, removeAmortization, updateFinancing, verifyPassword } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionCookie = "rbr_session";
const loginAttempts = new Map<string, { failures: number; blockedUntil: number }>();
const loginWindowMs = 15 * 60 * 1000;
const maxLoginFailures = 5;

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

function parseCookies(header: string | undefined) {
  return Object.fromEntries((header ?? "").split(";").filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

function currentUser(request: Request, database: ReturnType<typeof openDatabase>) {
  const token = parseCookies(request.headers.cookie)[sessionCookie];
  return token ? getUserBySession(database, token) : null;
}

function requireUser(request: Request, response: Response, database: ReturnType<typeof openDatabase>) {
  const user = currentUser(request, database);
  if (!user) {
    response.status(401).json({ error: "Autenticação necessária." });
    return null;
  }
  return user;
}

function setSession(response: Response, token: string, expiresAt: string) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`);
}

function clearSession(response: Response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function loginKey(request: Request, email: string) {
  return `${request.ip}:${email.trim().toLowerCase()}`;
}

function blockedUntil(key: string) {
  const attempt = loginAttempts.get(key);
  if (!attempt) return 0;
  if (attempt.blockedUntil > 0 && attempt.blockedUntil <= Date.now()) {
    loginAttempts.delete(key);
    return 0;
  }
  return attempt.blockedUntil;
}

function registerLoginFailure(key: string) {
  const current = loginAttempts.get(key);
  const failures = (current?.failures ?? 0) + 1;
  loginAttempts.set(key, { failures, blockedUntil: failures >= maxLoginFailures ? Date.now() + loginWindowMs : current?.blockedUntil ?? 0 });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const database = openDatabase();
  app.use(express.json());

  app.post("/api/auth/register", (req, res) => {
    try {
      const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const name = typeof req.body.name === "string" ? req.body.name : "";
      const password = typeof req.body.password === "string" ? req.body.password : "";
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres." });
      const user = createUser(database, email, name, password);
      claimOrphanedFinancings(database, user.id);
      const session = createSession(database, user.id);
      setSession(res, session.token, session.expiresAt);
      return res.status(201).json(user);
    } catch (error) {
      const message = error instanceof Error && error.message.includes("UNIQUE") ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta.";
      return res.status(400).json({ error: message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const key = loginKey(req, email);
    const blocked = blockedUntil(key);
    if (blocked) {
      res.setHeader("Retry-After", Math.ceil((blocked - Date.now()) / 1000));
      return res.status(429).json({ error: "Muitas tentativas. Tente novamente mais tarde." });
    }
    const user = findUserByEmail(database, email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      registerLoginFailure(key);
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }
    loginAttempts.delete(key);
    const session = createSession(database, user.id);
    setSession(res, session.token, session.expiresAt);
    return res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.created_at });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = currentUser(req, database);
    return user ? res.json(user) : res.status(401).json({ error: "Não autenticado." });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = parseCookies(req.headers.cookie)[sessionCookie];
    if (token) deleteSession(database, token);
    clearSession(res);
    return res.status(204).send();
  });

  app.get("/api/financings", (req, res) => {
    const user = requireUser(req, res, database);
    return user ? res.json(listFinancings(database, user.id)) : undefined;
  });

  app.post("/api/financings", (req, res) => {
    const user = requireUser(req, res, database);
    if (!user) return undefined;
    try {
      const input = readFinancingInput(req.body as Record<string, unknown>);
      const name = typeof req.body.name === "string" ? req.body.name : "Meu financiamento";
      const goal = req.body.goal ?? "term";
      if (!isGoal(goal)) throw new Error("Objetivo de amortização inválido.");
      const financing = createFinancing(database, user.id, input, name);
      const amortizations = readAmortizations(req.body.extraPayments ?? [], goal);
      return res.status(201).json(updateFinancing(database, user.id, financing.id, input, amortizations, goal));
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível salvar o financiamento." });
    }
  });

  app.put("/api/financings/:id", (req, res) => {
    const user = requireUser(req, res, database);
    if (!user) return undefined;
    try {
      const input = readFinancingInput(req.body as Record<string, unknown>);
      const goal = req.body.goal ?? "term";
      if (!isGoal(goal)) throw new Error("Objetivo de amortização inválido.");
      const amortizations = readAmortizations(req.body.extraPayments, goal);
      const financing = updateFinancing(database, user.id, req.params.id, input, amortizations, goal);
      return financing ? res.json(financing) : res.status(404).json({ error: "Financiamento não encontrado." });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o financiamento." });
    }
  });

  app.get("/api/financings/:id", (req, res) => {
    const user = requireUser(req, res, database);
    if (!user) return undefined;
    const financing = getFinancingWithAmortizations(database, user.id, req.params.id);
    return financing ? res.json(financing) : res.status(404).json({ error: "Financiamento não encontrado." });
  });

  app.post("/api/financings/:id/amortizations", (req, res) => {
    const user = requireUser(req, res, database);
    if (!user) return undefined;
    try {
      const { payment, goal } = readAmortization(req.body as Record<string, unknown>);
      const amortization = addAmortization(database, user.id, req.params.id, payment, goal);
      return amortization ? res.status(201).json(amortization) : res.status(404).json({ error: "Financiamento não encontrado." });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível salvar a amortização." });
    }
  });

  app.delete("/api/financings/:id/amortizations/:amortizationId", (req, res) => {
    const user = requireUser(req, res, database);
    if (!user) return undefined;
    const removed = removeAmortization(database, user.id, req.params.id, req.params.amortizationId);
    return removed ? res.status(204).send() : res.status(404).json({ error: "Amortização não encontrada." });
  });

  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
