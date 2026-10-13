# Plano de entrega — InfroPay v2

Você escolheu os 4 blocos. Vou entregá-los em 4 rodadas sequenciais (uma por mensagem) para manter qualidade — não cabe tudo numa única resposta sem virar código superficial.

**Constantes já confirmadas**

- Comissão venda: **2%**
- Comissão saque: **8%**
- Saque mínimo: **5.000 Kz**
- Moeda: **AOA (Kz)**
- Pagamentos Angola: Multicaixa Express, Referência Bancária, Transferência Bancária

---

## Rodada 1 — Financeiro + Saques (Fase 3) ⬅️ começo aqui

**Schema (migration)**

- `sales` — comprador (nullable p/ compra sem conta), producer_id, product_id, valores brutos/líquidos/taxa, método pagamento, status (`pendente|pago|reembolsado|cancelado`), release_at (D+7)
- `wallets` — producer_id, `available_cents`, `pending_cents`
- `bank_accounts` — producer_id, titular, banco, IBAN, telefone, is_default
- `withdrawals` — producer_id, bank_account_id, valor bruto/taxa 8%/líquido, status (`em_analise|aprovado|pago|recusado`), reason, processed_at
- Triggers: ao inserir venda paga → soma em `pending`; ao passar release_at → move p/ `available`. Trigger de saque bloqueia se `> available` ou `< 5000`.
- RLS: produtor vê o seu; admin vê tudo.

**Server functions**

- `getFinance` (KPIs: hoje/semana/mês, ticket médio, líquido, taxas)
- `listMyBankAccounts`, `upsertBankAccount`, `deleteBankAccount`
- `requestWithdrawal`, `listMyWithdrawals`
- Admin: `listPendingWithdrawals`, `approveWithdrawal`, `payWithdrawal`, `rejectWithdrawal(reason)`

**UI**

- `/produtor` — dashboard financeiro completo com gráficos (recharts) faturamento/crescimento, KPIs, top produtos
- `/produtor/financeiro` — saldo disponível/bloqueado + histórico transações
- `/produtor/saques` — cadastro banco, solicitar saque, histórico
- `/adm/saques` — fila de aprovação
- Banners de transparência 2%/8% no dashboard e no fluxo de saque

## Rodada 2 — Home + institucionais

- Home refeita: hero premium, banners "Ganhe Online", "Área de Afiliados", "Plataforma Segura", "Infraestrutura Moderna", categorias reorganizadas, animações Framer Motion, secção "Como funciona", depoimentos, CTA produtor/afiliado
- Substituir ícones genéricos pelo logo/mark onde couber
- Novas rotas públicas: `/sobre`, `/termos`, `/privacidade`, `/faq`, `/contactos`
- Banners informativos de comissão (2%/8%) na Home e no Sobre
- Footer atualizado com todos os links
- Imagens premium geradas (marketing digital, dashboard, empreendedorismo)

## Rodada 3 — Checkout + Pedidos

- Cadastro de produtos ampliado: upload de vídeo, subcategoria, tags, SEO title/desc, URL slug custom, promoção, order bump, upsell, downsell, comissão de afiliado, painel de pré-visualização lado a lado
- `/checkout/$slug` público (sem login) — layout persuasivo com fundo dashboard, selos, garantia, FAQ, depoimentos, contador urgência, escolha entre Multicaixa Express / Referência / Transferência, geração de instrução de pagamento
- Após pagar (marcar como pago manualmente por admin no MVP) → cria `sales` + envia link do produto
- `/pedidos/$token` — página pública do comprador (via link no email) com detalhes, download comprovativo, botão WhatsApp do vendedor
- `/produtor/pedidos` — lista com filtros, pesquisa, status, exportação CSV
- `/adm/vendas` — global

## Rodada 4 — InfroPay Legends

- Tabela `legends` (view materializada) com faturamento agregado por produtor
- 10 níveis com placas (Bronze → Infinity) com design/cor únicos, animações CSS/Framer
- Página pública `/legends` mostrando apenas: nome, avatar, faturamento total, nº vendas, posição, nível, data conquista
- Página privada `/produtor/conquistas` — barra de progresso, Kz até próximo nível, certificado digital (PDF simples via jsPDF)
- RLS estrita para não vazar dados por produto

---

## Detalhes técnicos

- Server functions em `src/lib/finance.functions.ts`, `withdrawals.functions.ts`, `orders.functions.ts`, `legends.functions.ts`
- Gráficos: `recharts` (já no shadcn)
- PDF certificado: `jspdf` (rodada 4)
- Sem gateway real de pagamento — status "pendente" até admin marcar como pago (a integração real vem numa fase futura, quando indicar o provider angolano)
- Todas as tabelas com GRANTs corretos + RLS + triggers de `updated_at`

**Confirma que arranco pela Rodada 1 (Financeiro + Saques) agora?** Se sim, respondo já com a migration + código. Se quiser trocar a ordem (ex.: começar pela Home ou pelo Checkout), diga só qual.
