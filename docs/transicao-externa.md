# Transição do RBR local para uso externo

## Objetivo

Este documento define como transformar o RBR, hoje uma aplicação local com usuário fixo e SQLite, em uma aplicação externa com contas individuais, verificação de e-mail, dados isolados por usuário, ambiente de produção e base de segurança adequada.

A transição deve preservar o motor financeiro atual. O cálculo Price, SAC e amortizações extraordinárias não será reescrito como parte da autenticação ou da migração de infraestrutura. A mudança deve substituir a identidade e a persistência sem alterar a matemática que já possui testes.

## Decisão arquitetural

A arquitetura aprovada é:

```text
React/Vite
  ├── Firebase Authentication
  │     └── e-mail, senha, verificação e recuperação
  │
  └── token de identidade
          ↓
Express
  ├── Firebase Admin SDK
  │     └── valida token e obtém uid
  ├── autorização por uid
  └── camada de dados
          ↓
PostgreSQL gerenciado

Motor financeiro compartilhado
  └── continua em shared/finance.ts
```

O Firebase Authentication será responsável pela identidade. O Express continuará sendo responsável pelas regras de acesso da aplicação. O PostgreSQL substituirá o SQLite quando o backend estiver pronto para múltiplas instâncias e armazenamento persistente de produção.

A separação entre identidade e dados é intencional. Um token válido prova quem está fazendo a requisição; ele não autoriza automaticamente a leitura de qualquer financiamento. Cada consulta deverá filtrar pelo identificador do usuário autenticado.

## Estado inicial e riscos

A versão atual cria um usuário local fixo no primeiro start e associa todos os registros a esse usuário. Isso é aceitável para uso pessoal, mas não para exposição pública.

Os riscos principais são:

| Risco | Consequência | Tratamento |
|---|---|---|
| Usuário fixo | Usuários diferentes poderiam compartilhar dados | Substituir por identidade verificada e `firebase_uid`. |
| SQLite local | Perda de dados ou concorrência limitada em hospedagem | Migrar para PostgreSQL persistente. |
| Login apenas visual | Falsa sensação de proteção | Validar o token no Express em todas as rotas privadas. |
| Segredo no frontend | Comprometimento da conta ou do banco | Manter credenciais administrativas somente no backend. |
| Dados sem origem | Dificuldade para auditoria futura | Introduzir eventos, timestamps e origem dos registros. |
| CORS aberto | Requisições de origens não autorizadas | Restringir origens por ambiente. |
| Ausência de limites | Abuso de endpoints e custos inesperados | Rate limiting e limites de payload. |

## Fases de execução

### Fase 0 — Preparação e contrato técnico

**Objetivo:** congelar o comportamento financeiro e preparar os ambientes antes da autenticação.

**Movimentos:**

1. Registrar o estado atual da `main`, incluindo testes e build aprovados.
2. Separar variáveis de desenvolvimento, teste e produção.
3. Criar um contrato de identidade que use `uid` como identificador externo estável.
4. Definir que o frontend nunca decide sozinho se um usuário está autorizado.
5. Manter o cálculo local como fallback apenas para indisponibilidade da persistência, não como bypass de autorização.

**Critério de conclusão:** o projeto tem uma especificação clara de identidade, ambiente e limites. Nenhuma tela de login é considerada segurança até o backend validar o token.

### Fase 1 — Firebase Authentication

**Objetivo:** permitir cadastro e login por e-mail com confirmação da conta.

**Configuração no Firebase Console:**

1. Criar ou selecionar um projeto Firebase.
2. Ativar Authentication.
3. Ativar o provedor Email/Password.
4. Configurar os domínios autorizados do frontend local, staging e produção.
5. Configurar o template de e-mail de verificação e recuperação de senha.
6. Criar um aplicativo Web e guardar apenas as configurações públicas do cliente nas variáveis `VITE_FIREBASE_*`.
7. Criar uma credencial administrativa para o servidor por mecanismo seguro de secrets, nunca em arquivo versionado.

**Implementação no frontend:**

- Criar um módulo único para inicializar o Firebase Client SDK.
- Criar um `AuthProvider` que observa o estado do usuário.
- Expor estados de carregamento, usuário autenticado e e-mail verificado.
- Criar telas de cadastro, login, reenvio de verificação, recuperação de senha e logout.
- Após cadastro, enviar o e-mail de verificação e impedir acesso ao dashboard até a confirmação.
- Nunca armazenar senha, token administrativo ou chave privada no código.

**Implementação no backend:**

- Inicializar o Firebase Admin SDK somente no servidor.
- Ler o token Bearer do header `Authorization`.
- Validar o token com `verifyIdToken`.
- Colocar o `uid` em `req.user` somente após validação.
- Responder `401` quando o token estiver ausente, expirado ou inválido.
- Responder `403` quando a conta existir, mas ainda não estiver verificada, caso a rota exija verificação.
- Remover gradualmente o uso do usuário local das rotas protegidas.

**Critério de conclusão:** um usuário não verificado consegue criar a conta, recebe o e-mail e permanece fora da área privada; um usuário verificado acessa apenas seus próprios recursos; requisições sem token falham.

### Fase 2 — Modelo de usuário e isolamento

**Objetivo:** relacionar os registros do RBR ao usuário autenticado.

**Mudanças de dados:**

- Adicionar `firebase_uid` único na tabela de usuários.
- Manter um identificador interno do banco para relações locais.
- Guardar e-mail e nome como dados de perfil, sem usá-los como chave.
- Criar ou atualizar o usuário local na primeira requisição autenticada.
- Trocar filtros baseados em `local` por filtros baseados no usuário resolvido pelo token.
- Criar índices em `firebase_uid`, `user_id` e `financing_id`.

**Por que não usar e-mail como chave:** o usuário pode alterar o e-mail, e comparações de texto são mais frágeis do que um identificador estável emitido pelo provedor.

**Migração dos dados locais:**

1. Fazer cópia do SQLite.
2. Exportar os registros do usuário local.
3. Criar uma conta de migração com o e-mail do proprietário.
4. Associar os registros ao novo `firebase_uid`.
5. Conferir quantidade, valores e amortizações.
6. Manter o backup original somente até a conferência.

A migração nunca deve sobrescrever a base original antes da validação.

### Fase 3 — Banco de produção

**Objetivo:** substituir o arquivo SQLite por PostgreSQL gerenciado.

**Movimentos:**

1. Escolher um provedor PostgreSQL com backups e conexão TLS.
2. Reproduzir o schema atual com chaves, índices e `ON DELETE CASCADE`.
3. Criar migrações versionadas.
4. Adaptar `server/db.ts` por trás das mesmas operações usadas pelo Express.
5. Criar ambientes separados para desenvolvimento, staging e produção.
6. Executar importação idempotente dos dados locais.
7. Validar contagens e totais antes de liberar a troca.
8. Manter o SQLite em modo de leitura para rollback curto.

O motor financeiro não deve depender do banco. Ele continua recebendo objetos tipados e produzindo resultados determinísticos.

### Fase 4 — Segurança da aplicação

**Objetivo:** reduzir riscos antes da publicação ampla.

**API:**

- Validar corpo, parâmetros e limites numéricos em todas as rotas.
- Rejeitar campos desconhecidos quando isso for seguro para o contrato.
- Usar `helmet` ou headers equivalentes.
- Configurar CORS apenas para domínios conhecidos.
- Aplicar rate limiting em autenticação e rotas sensíveis.
- Limitar tamanho do JSON recebido.
- Evitar mensagens de erro que revelem detalhes internos.
- Não registrar tokens, senhas, documentos ou dados financeiros completos em logs.

**Sessões e tokens:**

- Preferir token curto no cliente conforme o fluxo oficial do SDK.
- Nunca confiar em `uid` enviado no corpo da requisição.
- Validar o token no backend em cada requisição privada.
- Revogar sessões quando houver necessidade de resposta a incidente.

**Banco:**

- Usar usuário de banco com menor privilégio.
- Exigir TLS na conexão externa.
- Configurar backups e retenção.
- Evitar SQL montado por concatenação.
- Testar isolamento entre dois usuários.

**Frontend:**

- Não colocar credenciais administrativas no bundle.
- Não exibir dados privados antes do estado de autenticação ser resolvido.
- Mostrar estados de carregamento e erro sem vazar detalhes.
- Usar HTTPS em produção.

### Fase 5 — Deploy e operação

**Objetivo:** publicar com ambientes reproduzíveis.

A aplicação deverá ter pelo menos:

- desenvolvimento local;
- staging para validação;
- produção para usuários reais.

Cada ambiente terá suas próprias variáveis, domínios autorizados e banco. O CI deverá executar check, testes e build em pull requests. O deploy de produção deverá exigir branch protegida e revisão.

O servidor deverá expor um health check que confirme apenas disponibilidade básica, sem retornar segredos ou dados privados.

### Fase 6 — Auditoria e documentação completa

**Objetivo:** preparar o RBR para comparar o esperado com o realizado.

Antes de integrações bancárias, criar um modelo de eventos com:

- financiamento relacionado;
- tipo do evento;
- data de ocorrência;
- data de registro;
- valor anterior e posterior quando aplicável;
- origem do dado;
- usuário responsável pelo registro;
- documento relacionado;
- observação e status de revisão.

O futuro fluxo Expected vs Actual deverá mostrar a diferença e a fonte, mas não declarar fraude automaticamente. Explicações jurídicas ou regulatórias devem permanecer fora do cálculo determinístico.

A documentação final deverá explicar arquitetura, decisões, banco, autenticação, endpoints, variáveis, testes, deploy, backup, incidentes e limites do produto.

## Contrato de variáveis

As variáveis do frontend serão públicas apenas no sentido de configuração do cliente Firebase. Elas não são autorização administrativa.

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

O backend deverá receber a credencial administrativa por secret manager ou variável protegida. A chave privada nunca deve aparecer no GitHub, no bundle ou em logs.

Para PostgreSQL:

```text
DATABASE_URL
```

O projeto deve fornecer apenas um `.env.example` sem valores reais. Arquivos `.env` devem permanecer ignorados pelo Git.

## Testes obrigatórios

A transição não estará concluída sem os seguintes testes:

| Grupo | Casos mínimos |
|---|---|
| Autenticação | cadastro, login, e-mail não verificado, token inválido, logout e recuperação. |
| Autorização | usuário A não lê, altera ou exclui dados do usuário B. |
| Persistência | criação, atualização, exclusão, cascata e migração idempotente. |
| API | payload inválido, limites, `401`, `403`, `404` e erros internos controlados. |
| Motor | Price, SAC, taxa zero, múltiplos aportes, arredondamentos e prazos extremos. |
| Frontend | estados de carregamento, conta não verificada, sessão expirada e logout. |

## Rollback

Cada migração deve ter um plano de retorno. Antes de trocar o banco, gerar backup e registrar a versão do schema. Antes de publicar a autenticação, manter uma branch estável e um ambiente de staging.

Se a autenticação falhar, o retorno deve desativar o deploy novo e preservar o banco. Não se deve reativar o usuário local em produção sem uma decisão explícita, porque isso poderia expor dados entre contas.

## Critérios de pronto para a primeira publicação

- Cadastro e login funcionam com e-mail.
- Verificação de e-mail é obrigatória para a área privada.
- Recuperação de senha funciona.
- Backend valida tokens reais.
- Cada financiamento possui dono inequívoco.
- Dois usuários não conseguem acessar os dados um do outro.
- Banco de produção possui backup e TLS.
- Segredos não estão no repositório.
- CI passa em pull request.
- Política de privacidade e termos de uso estão publicados.
- Limitações do simulador estão visíveis ao usuário.
