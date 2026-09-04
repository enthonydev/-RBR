import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { compareFinancing, type AmortizationGoal, type AmortizationMethod, type ExtraordinaryPayment } from "@shared/finance";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isMethod(value: unknown): value is AmortizationMethod {
  return value === "price" || value === "sac";
}

function isGoal(value: unknown): value is AmortizationGoal {
  return value === "term" || value === "payment";
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  app.post("/api/simulations", (req, res) => {
    try {
      const { principal, annualRate, termMonths, method, extraPayments = [], goal = "term" } = req.body as {
        principal?: unknown;
        annualRate?: unknown;
        termMonths?: unknown;
        method?: unknown;
        extraPayments?: unknown;
        goal?: unknown;
      };

      if (!isMethod(method) || !isGoal(goal) || !Array.isArray(extraPayments)) {
        return res.status(400).json({ error: "Parâmetros de simulação inválidos." });
      }

      const result = compareFinancing(
        { principal: Number(principal), annualRate: Number(annualRate), termMonths: Number(termMonths), method },
        extraPayments as ExtraordinaryPayment[],
        goal,
      );
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível calcular a simulação.";
      return res.status(400).json({ error: message });
    }
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
