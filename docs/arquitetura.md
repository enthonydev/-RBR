# Arquitetura do RBR

## Escopo atual

O RBR é uma aplicação local de planejamento e simulação de financiamentos imobiliários. A versão atual calcula um modelo esperado a partir dos dados informados pelo usuário. Ela não acompanha a realidade de um contrato bancário e não acessa fontes externas.

Essa distinção orienta as decisões do projeto:

- o cálculo financeiro deve ser determinístico e reproduzível;
- a interface deve apresentar hipóteses, resultados e limitações com clareza;
- persistência não deve ser confundida com acompanhamento em tempo real;
- futuras integrações devem preservar a origem, a autorização e o contexto de cada dado.

## Camadas

```text
Interface React/Vite
        ↓
API Express
        ↓
Persistência SQLite

Motor financeiro compartilhado
        ├── usado pelo frontend para cálculo local
        └── disponível para evolução do backend
```

### Interface

O frontend está em `client/`. A navegação e o estado principal estão em `client/src/pages/Home.tsx`. A interface contém dashboard, nova simulação, resultado, tabela de amortização, cenários e histórico de financiamentos.

### API

O servidor está em `server/index.ts` e expõe rotas REST para persistir financiamentos e amortizações. A API não possui uma rota separada de simulação porque o frontend calcula o resultado diretamente pelo módulo compartilhado.

### Persistência

`server/db.ts` cria e acessa um banco SQLite local usando `node:sqlite`. O schema relaciona usuários locais, financiamentos e amortizações. A exclusão de um financiamento remove seus registros dependentes.

### Domínio financeiro

`shared/finance.ts` concentra tipos e regras para Price, SAC, pagamentos extraordinários e comparação de cenários. O módulo não depende de React, Express ou SQLite.

## Decisões relevantes

### Motor separado da interface

As regras matemáticas ficam fora dos componentes de tela. Essa separação permite testar cálculos sem navegador e reduz o risco de divergência entre telas.

### Persistência local

A versão atual usa um usuário local fixo e um arquivo SQLite configurável por `DATABASE_PATH`. Essa decisão atende ao uso pessoal atual sem criar uma camada de autenticação incompleta.

### Expected e Actual

O modelo atual cobre apenas o lado **Expected**, isto é, o que deveria acontecer segundo os parâmetros informados. O lado **Actual** deverá ser criado separadamente para representar pagamentos, extratos, documentos e eventos observados.

A futura comparação entre Expected e Actual deve registrar a fonte dos dados, tolerâncias, contexto contratual e evidências. Uma divergência não deve ser tratada automaticamente como fraude ou ilegalidade.

## Evolução planejada

A evolução técnica deve seguir esta ordem:

1. Expandir os testes do motor para cenários de borda.
2. Criar configurações versionadas para parâmetros e preferências.
3. Criar uma linha do tempo de eventos financeiros.
4. Adicionar documentos com metadados e rastreabilidade.
5. Implementar comparação entre cronograma esperado e dados observados.
6. Avaliar integrações oficiais e Open Finance com consentimento e segurança.

Regras habitacionais, subsídios e uso de FGTS devem ser representados como regras e eventos versionados, com fonte e vigência. Não devem ser codificados como valores fixos sem contexto.

## Limites atuais

A aplicação não oferece login multiusuário, sincronização bancária, importação documental, extração de dados, notificações de vencimento, consulta em tempo real ou parecer jurídico. Esses limites devem permanecer explícitos na interface e na documentação até que as respectivas capacidades existam.
