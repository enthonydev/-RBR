# Contribuindo com o RBR

Obrigado pelo interesse em contribuir com o RBR. O projeto prioriza cálculos reproduzíveis, alterações pequenas e documentação compatível com o comportamento real da aplicação.

## Antes de abrir uma alteração

Leia o `README.md` e a documentação em `docs/`. Confirme se a proposta pertence ao escopo atual ou se deve ser registrada como evolução futura.

Não apresente integrações bancárias, acompanhamento em tempo real ou resultados de auditoria como funcionalidades prontas sem implementação e fonte verificável.

## Desenvolvimento local

```bash
pnpm install
pnpm dev
```

Antes de enviar uma alteração, execute:

```bash
pnpm check
pnpm test
pnpm build
```

## Alterações financeiras

Toda alteração no motor em `shared/finance.ts` deve incluir testes correspondentes em `shared/finance.test.ts`. Os testes devem cobrir o resultado esperado, arredondamentos relevantes e casos de borda quando aplicável.

Alterações de persistência devem incluir cobertura em `server/db.test.ts`. Mudanças de API devem atualizar o README quando afetarem endpoints, payloads ou limites de uso.

## Commits e pull requests

Use mensagens de commit curtas e descritivas em português. Um pull request deve explicar o problema, a solução, os arquivos afetados e as verificações executadas.

Evite misturar refatorações amplas com mudanças de comportamento. Preserve a separação entre interface, API, persistência e motor financeiro.
