# RBR — Simulação de financiamento

Aplicação de planejamento e simulação de financiamento imobiliário com interface React/Vite, servidor Express, motor financeiro compartilhado e persistência local em SQLite.

## Funcionalidades atuais

- Cadastro e atualização de um financiamento.
- Sistemas Price e SAC no motor financeiro.
- Simulação de juros, parcela, amortização e saldo.
- Amortizações extraordinárias com redução de prazo ou parcela.
- Resultado comparativo, tabela de amortização e cenários.
- Persistência de financiamentos e amortizações no SQLite.
- Fallback para cálculo local quando a API não está disponível.

## Execução local

```bash
pnpm install
pnpm dev
```

O comando `pnpm dev` inicia o Vite. Para usar a persistência e as rotas da API, execute o servidor compilado:

```bash
pnpm build
DATABASE_PATH=./data/rbr.sqlite pnpm start
```

`DATABASE_PATH` é opcional. O padrão é `./data/rbr.sqlite`.

## API principal

- `GET /api/financings` — lista financiamentos salvos.
- `POST /api/financings` — cria um financiamento e suas amortizações.
- `GET /api/financings/:id` — recupera um financiamento com amortizações.
- `PUT /api/financings/:id` — atualiza o contrato e substitui suas amortizações.
- `POST /api/financings/:id/amortizations` — adiciona uma amortização.
- `DELETE /api/financings/:id/amortizations/:amortizationId` — remove uma amortização.
- `POST /api/simulations` — calcula uma comparação sem persistir.

## Verificações

```bash
pnpm check
pnpm test
pnpm build
```

O banco usa SQLite nativo do Node 22. Nesta etapa não há autenticação nem separação de dados por usuário.
