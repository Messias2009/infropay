# Limpeza do Dashboard do Produtor & Centralização das Notificações Push no Perfil

Plano para desobstruir a página principal do Dashboard do Produtor (`/produtor`), removendo o banner de notificações push e o card da pulseira da primeira venda, e transferindo a gestão e teste das notificações push para a página de Configurações de Perfil (`/perfil`).

## Decisões Confirmadas com o Utilizador

> [!IMPORTANT]
> - **Remoção no Dashboard Principal (`/produtor`)**: Remoção total do banner de notificações push e do card da pulseira de primeira venda da tela inicial do painel financeiro, mantendo o dashboard 100% focado em métricas financeiras, gráficos e operação de vendas.
> - **Localização do Controlo de Notificações Push**: Centralizado na página de **Configurações de Perfil** (`/perfil`), além de mantido no menu do sino do topo (`NotificationBell`) e em Conquistas (`/produtor/conquistas`).
> - **Preservação da Pulseira de 1ª Venda**: Continua em destaque na página dedicada de Conquistas & Prémios Físicos (`/produtor/conquistas`).

---

## 1. Visão Geral & Experiência do Produtor

### A. Dashboard Limpo e Focado (`/produtor`)
- O topo do dashboard apresentará diretamente o cabeçalho financeiro com botões de ação ("Saques" e "Novo produto").
- Imediatamente a seguir, o utilizador verá a grelha de cartões de indicadores (faturamento bruto, saldo disponível, retenções e taxas).
- Remove os dois cards promocionais/informativos que ocupavam o terço superior da visualização, proporcionando uma experiência analítica premium, rápida e sem poluição visual.

### B. Gestão de Notificações no Perfil (`/perfil`)
- Adição da secção "Notificações de Vendas (Push & Alertas)" na página de perfil do produtor.
- Inclui o componente `PushSalesNotificationBanner`:
  - Indicador de status (Ativo / Pendente).
  - Interruptor do som característico de venda ("Ka-ching!").
  - Botão de ativação e teste de entrega em 5 segundos em segundo plano.

---

## 2. Diagrama de Arquitetura & Fluxo

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PAINEL DO PRODUTOR                              │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Dashboard (/produtor)       │ • Métricas financeiras em tempo real  │
│    (Foco analítico limpo)      │ • Gráficos de receita e volume        │
│                                │ • Lista de produtos e atividades      │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Perfil (/perfil)            │ • Dados cadastrais e biografia        │
│    (Definições & Preferências) │ • [NOVO] Controlo de Notificações     │
│                                │   Push (permissões, som, teste 5s)    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Conquistas (/conquistas)    │ • Pulseira oficial de 1ª venda        │
│    (Prémios físicos)           │ • 5 Níveis de placas fotorrealistas   │
│                                │ • Prévia e celebração de troféus      │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Plano de Modificações por Ficheiro

### 1. `src/routes/_authenticated/produtor.index.tsx`
- Remover o bloco JSX do card da pulseira de primeira venda (`Pulseira da Primeira Venda`).
- Remover o bloco JSX `<PushSalesNotificationBanner variant="card" />`.
- Limpar importações não mais utilizadas (`PushSalesNotificationBanner`, imagens não usadas).
- Manter o observador de placas em segundo plano (`usePlaqueWatcher`) para garantir que toasts de desbloqueio continuem a disparar automaticamente se o produtor bater uma meta.

### 2. `src/routes/_authenticated/perfil.tsx`
- Importar e renderizar o componente `<PushSalesNotificationBanner variant="card" />` abaixo do formulário de perfil.
- Fornecer título de secção claro: "Notificações & Alertas no Navegador".

---

## 4. Verificação & Validação

1. **Validação Estática**:
   - Executar `lint_applet` para assegurar 0 erros de linting e TypeScript.
2. **Validação de Compilação**:
   - Executar `compile_applet` para validar o build de produção no Vite/TanStack Start.
3. **Validação Visual**:
   - Aceder a `/produtor` e confirmar que a página inicia diretamente nos KPIs financeiros sem banners intrusivos.
   - Aceder a `/perfil` e testar a ativação e o som das notificações push.
   - Aceder a `/produtor/conquistas` e confirmar que a pulseira de primeira venda e as 5 placas permanecem intactas.
