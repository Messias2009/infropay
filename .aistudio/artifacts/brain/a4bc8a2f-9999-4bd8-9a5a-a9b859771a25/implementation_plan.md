# InfroPay — Otimização de Interface, Checkout Focado e PWA

Plano de refinamento da experiência do utilizador na plataforma InfroPay, eliminando sobreposições visuais, focando o checkout na conversão direta e implementando suporte a Progressive Web App (PWA).

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas com base nas suas preferências:
>
> - **Botão de Instalação PWA**: Integrado discretamente no topo da barra de navegação (`Header`), com deteção automática de modo instalado e guia visual para utilizadores iOS Safari.
> - **Fundo da Secção Principal**: Substituição da imagem com texto por um gradiente escuro premium com luz de fundo suave em azul ultramarino (#1565C0) e dourado (#F9A825), garantindo legibilidade perfeita.
> - **Rodapé do Checkout**: Estrutura minimalista e blindada contendo selos de segurança SSL, direitos reservados, e links acessíveis para Termos de Uso e Política de Privacidade, sem menus institucionais ou atalhos para perfil.

- **Visibilidade de Produtos na Loja**: O produtor terá controle total na criação e edição do produto (`store_visible: true/false`), permitindo manter infoprodutos ocultos da vitrine geral enquanto continuam funcionais para venda via link direto.
- **Página Inicial sem Lista Direta de Produtos**: A homepage foca-se na proposta de valor, taxas e entrada para produtores e compradores, direcionando o catálogo completo para a página `/loja`.

---

### 1. Overview & Core Concept

- **O que faz**: Transforma a InfroPay numa plataforma de alta conversão para o mercado angolano, com métricas sem quebras, banner destacado de taxas, navegação limpa, checkout isolado e focado sem fugas de conversão, e capacidade de instalação como aplicativo (PWA).
- **Público-Alvo**:
  1. _Produtores e Criadores Digitais_: Precisam de facilidade para publicar, vender por links diretos ou na loja pública, e acompanhar recebimentos em Kwanza.
  2. _Compradores Finais_: Precisam de um fluxo de checkout rápido, seguro e sem distrações que não exija criação forçada de conta.
- **Valor Principal**: Experiência fluida e confiável com pagamentos Multicaixa Express e Referência em AOA, com visual premium e compatibilidade móvel nativa via PWA.

---

### 2. User Experience & Visual Design

#### A. Secção Superior (Hero) e Banner de Taxas

- **Fundo Limpo & Legível**: Remoção de imagens com texto pré-renderizado. Uso de tela de fundo com gradiente escuro de alto contraste (`oklch(0.18 0.03 265)`) com iluminação ambiente sutil em tons de safira e ouro.
- **Banner de Taxas em Destaque**:
  - `2% por venda` (a menor taxa de plataforma em Angola)
  - `8% por saque` (transparência total sem surpresas)
  - `Saque em 1 hora` (liberação expressa após aprovação)
  - Layout em fita horizontal elegante com ícones funcionais e visual metálico dourado.

#### B. Métricas e Faturamento sem Quebras

- **Correção Numérica**:
  - Adição de `whitespace-nowrap tabular-nums` em todos os cartões de estatísticas e no componente `CountUp`.
  - Tratamento responsivo dos dígitos para evitar quebras de linha em ecrãs móveis (ex.: `128 540 000 Kz` mantém-se em linha única com escalonamento de texto `text-lg sm:text-xl md:text-2xl`).

#### C. Catálogo e Gestão de Visibilidade do Produtor

- **Homepage Focada**: Remoção dos blocos repetidos de produtos ("Populares" e "Lançamentos") e das categorias em formato estático no rodapé da homepage. O botão principal "Comprar na loja" conduz à vitrine `/loja`.
- **Controle de Ocultação/Exibição**:
  - Campo interruptor (Switch) no formulário do produtor (`produtor.novo.tsx` e `produtor.editar.$id.tsx`): "Exibir na loja pública".
  - Se desativado, o produto fica oculto na vitrine geral `/loja`, mas seu link de checkout (`/checkout/$slug` ou `/p/$slug`) continua plenamente ativo para vendas em redes sociais, anúncios ou páginas próprias.

#### D. Checkout Blindado e Focado

- **Cabeçalho Dedicado**: Apenas o logótipo da InfroPay acompanhado do selo "Checkout Seguro & Criptografado", sem barra de navegação, sem botão de login e sem carrinho.
- **Sem Botão de Voltar**: Eliminação do link "Voltar ao produto" e de atalhos de perfil. O comprador que recebe o link direto foca-se exclusivamente em concluir o pagamento.
- **Rodapé Minimalista**: Exibe apenas os selos de segurança (Multicaixa, SSL 256-bit), direitos reservados da InfroPay e atalhos discretos para abrir a Política de Privacidade e os Termos de Uso.

#### E. Progressive Web App (PWA)

- **Instalabilidade Completa**: `manifest.webmanifest`, ícones de alta resolução (192x192, 512x512, maskable e apple-touch-icon), service worker ativo com cache estático.
- **Botão de Instalação no Topo**: Botão "Instalar App" no `Header`, que abre o prompt nativo em navegadores compatíveis (Chrome/Edge/Android) ou um modal amigável com instruções no iOS Safari.

---

### 3. Key Product Decisions & Trade-Offs

- **Checkout Desacoplado do SiteLayout Geral**:
  - _Abordagem_: Criar um layout dedicado `CheckoutLayout` para `/checkout/$slug` em vez de partilhar o `SiteLayout` institucional.
  - _Porquê_: Evita vazamento de tráfego. Compradores vindos de links de campanhas não se perdem no site institucional e têm taxas de conversão muito maiores.
- **Visibilidade de Loja como Propriedade do Produto**:
  - _Abordagem_: Integrar o campo booleano `store_visible` na criação e edição do produto, respeitando o filtro já existente no catálogo (`.eq("store_visible", true)`).
  - _Porquê_: Dá aos produtores liberdade de criar ofertas exclusivas, promoções privadas ou produtos fechados para mentorias sem poluir a loja pública.
- **Formatação Numérica com Espaço Insecável**:
  - _Abordagem_: Formatar moeda com `\u00A0` (non-breaking space) e classe CSS `whitespace-nowrap font-mono tabular-nums`.
  - _Porquê_: O padrão numérico em português utiliza espaços como separador de milhar; forçar espaços insecáveis resolve definitivamente as quebras de linha em ecrãs móveis.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             INFROPAY APP RUNTIME                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌─────────────────────────────────┐                         ┌─────────────────────────────────┐
│     PUBLIC & STORE SURFACES     │                         │        FOCUSED CHECKOUT         │
│  - Home (Hero limpo + Banner)   │                         │  - CheckoutLayout isolado       │
│  - Loja (/loja: filtros + grid) │                         │  - Sem links de retorno         │
│  - TopBar com botão PWA Install │                         │  - Formulário + Resumo + SSL    │
│  - Rodapé institucional limpo   │                         │  - Termos & Privacidade         │
└────────────────┬────────────────┘                         └────────────────┬────────────────┘
                 │                                                           │
                 ▼                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRODUTOR & CATALOG STATE                                    │
│  - produtor.novo & produtor.editar: Toggle "Visível na Loja" (store_visible)                │
│  - catalog.functions.ts: Filtra produtos onde status='publicado' AND store_visible=true     │
│  - checkout.functions.ts: Permite compra direta mesmo se store_visible=false                │
└────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PWA & OFFLINE LAYER                                       │
│  - public/manifest.webmanifest (standalone, tema #0F172A, ícones 192/512)                   │
│  - public/sw.js (Service Worker para cache de assets)                                       │
│  - hooks/usePWAInstall.ts (captura 'beforeinstallprompt', suporte iOS)                      │
│  - components/site/PWAInstallButton.tsx (integrado no Header e navegação móvel)              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Mapeamento de Ficheiros e Componentes:

1. `src/components/CountUp.tsx` & `src/routes/index.tsx`: Aplicação de `whitespace-nowrap tabular-nums` e espaçamento insecável para evitar quebras no faturado.
2. `src/routes/index.tsx`:
   - Remoção da imagem de fundo com texto; aplicação de gradiente escuro com iluminação radial subtil.
   - Novo `FeeBanner` horizontal em destaque (2% por venda, 8% por saque, saque em 1 hora).
   - Remoção dos blocos diretos de produtos ("Populares" e "Lançamentos") e da lista de categorias estáticas no fim da página.
3. `src/routes/_authenticated/produtor.novo.tsx` & `src/routes/_authenticated/produtor.editar.$id.tsx`:
   - Inclusão do campo Switch/Checkbox `store_visible` ("Visível na vitrine da loja").
   - Envio da propriedade `store_visible` na criação e atualização do produto.
4. `src/routes/checkout.$slug.tsx`:
   - Remoção do `SiteLayout` genérico; implementação de cabeçalho e rodapé focados e seguros.
   - Remoção do botão "Voltar ao produto" e links externos.
   - Exibição limpa de dados do pedido, pagamento, selos de segurança, direitos reservados e modais/links diretos para Termos e Privacidade.
5. `public/manifest.webmanifest`, `public/sw.js`, `src/hooks/usePWAInstall.ts`, `src/components/site/PWAInstallButton.tsx`, `src/routes/__root.tsx`:
   - Configuração completa do PWA e posicionamento do botão de instalação na barra de navegação superior.
