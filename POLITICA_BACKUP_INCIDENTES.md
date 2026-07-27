# Política de backup e resposta a incidentes — Angell

Versão 1.0 — 27/07/2026

## Objetivos

- **RPO:** no máximo 24 horas de dados perdidos.
- **RTO:** restaurar o serviço essencial em até 8 horas.
- Responsável primário: proprietário técnico da Angell.
- Substituto e contatos de emergência devem ser preenchidos antes da produção.

## Backup

1. Executar `ops/backup-postgres.sh` diariamente por agendador externo.
2. Manter arquivos criptografados por 30 dias, com ao menos uma cópia em armazenamento fora do servidor principal.
3. Guardar a senha de criptografia em gerenciador de segredos, separada dos backups.
4. Restringir leitura à conta de backup e habilitar versionamento/imutabilidade no armazenamento externo.
5. Monitorar ausência, tamanho anormal e falha do backup; alertar o responsável no mesmo dia.
6. Executar restauração em banco isolado todo mês com `ops/restore-postgres.sh`, registrar duração e resultado.
7. Nunca testar restauração sobre o banco de produção.

Exemplo de agendamento diário às 03:15:

```cron
15 3 * * * /caminho/angel-leo/ops/backup-postgres.sh
```

O agendador deve receber `DATABASE_URL`, `BACKUP_DIR`, `BACKUP_ENCRYPTION_PASSWORD` e, opcionalmente, `BACKUP_RETENTION_DAYS`. O diretório deve ser sincronizado para S3/R2 ou outro destino externo. O script local sozinho não constitui uma política de backup completa.

## Resposta a incidentes

1. **Detectar e registrar:** horário, fonte, sistemas, dados possivelmente afetados e código de correlação.
2. **Conter:** revogar sessões/tokens, bloquear vetor de ataque, preservar logs e restringir acessos; não apagar evidências.
3. **Avaliar:** confirmar natureza e volume de dados pessoais, titulares, consequências e risco/dano relevante.
4. **Erradicar e recuperar:** corrigir a causa, rotacionar segredos, restaurar cópia validada quando necessário e monitorar recorrência.
5. **Comunicar:** acionar responsável jurídico/encarregado. Quando aplicável, comunicar ANPD e titulares pelos canais e prazos legais vigentes, com fatos confirmados e medidas adotadas.
6. **Pós-incidente:** registrar decisões, linha do tempo, causa raiz e ações preventivas; revisar este plano.

## Registro mínimo

Cada incidente deve possuir identificador, datas de detecção/contenção/recuperação, responsável, sistemas afetados, categorias e volume estimado de dados, titulares, evidências preservadas, avaliação de risco, comunicações realizadas e ações corretivas.

## Exercícios

- Teste mensal de restauração.
- Simulação semestral de vazamento.
- Revisão trimestral de acessos, destinos de backup, alertas e contatos.
- Revisão anual de RPO/RTO ou após mudança relevante de infraestrutura.

Referência: [Guia orientativo de segurança da informação da ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-vf.pdf).
