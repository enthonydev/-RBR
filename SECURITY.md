# Segurança

O RBR atual é uma aplicação local de uso pessoal, com persistência em SQLite e usuário local fixo. Ele não deve ser exposto publicamente sem uma camada adequada de autenticação, autorização, proteção de dados e gerenciamento de segredos.

## Comunicação de vulnerabilidades

Não publique credenciais, arquivos de banco, dados pessoais ou detalhes exploráveis em issues públicas. Para comunicar uma vulnerabilidade, abra uma comunicação privada ao mantenedor do repositório antes de divulgar o problema publicamente.

Inclua uma descrição objetiva, o impacto observado, os passos mínimos para reprodução e uma sugestão de correção quando possível.

## Práticas esperadas

- Não versionar `.env`, bancos SQLite locais ou credenciais.
- Não colocar tokens em código frontend ou no histórico Git.
- Validar entradas recebidas pela API antes de persistir dados.
- Manter dependências e lockfile atualizados de forma controlada.
- Não tratar diferenças financeiras como fraude ou ilegalidade sem análise especializada.

## Dependências

O CI e as revisões locais devem executar `pnpm audit --prod`. A base atual não possui vulnerabilidades críticas ou altas após a atualização das dependências. Permanece um alerta moderado transitivo de `uuid@9` trazido pelo Firebase Admin por uma cadeia do Google Cloud; o caminho usado pelo RBR valida tokens e não utiliza as APIs de UUID vulneráveis. A dependência deve ser reavaliada quando o fornecedor publicar a atualização compatível.
