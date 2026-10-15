# InfroPay — Checkout Personalizado, Funil com Order Bump, Pulseira Primeira Venda e Suporte Oficial

Plano de arquitetura e implementação para capacitar os produtores a editarem os checkouts com a sua própria marca, ativar o funcionamento do funil de vendas (order bump e cupões no checkout), lançar a campanha da pulseira comemorativa da primeira venda e estruturar o atendimento oficial de suporte via Instagram e WhatsApp.

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas com base nas suas respostas:
>
> - **Localização do Editor de Checkout**: Página dedicada no painel do produtor acessível por produto (`/produtor/checkout/$id`), permitindo customização profunda sem poluir a tela básica de edição do produto.
> - **Campanha da Pulseira Primeira Venda**: Exibição em destaque duplo — banner atrativo no topo do painel do produtor (`/produtor`) e bloco de incentivo na página inicial (`/`), com arte realista gerada da pulseira de silicone com marca InfroPay.
> - **Canais de Suporte**: Modal moderno e direto disparado ao clicar em "Falar com suporte", apresentando o Instagram oficial `@infropay.ao` e o botão direto para atendimento no WhatsApp.
> - **Order Bump & Funil Funcional**: Ativação imediata no checkout público (`/checkout/$slug`), carregando as ofertas ativas de bump vinculadas ao produto, permitindo ao comprador adicionar com 1 clique antes do pagamento e recalculando o valor total em Kwanza (AOA).

---

### 1. Overview & Core Concept

- **O que faz**:
  1. **Editor de Checkout Personalizado**: Permite aos vendedores personalizar a identidade visual do checkout de cada infoproduto (nome da marca, logotipo do produtor, banner de topo, tema de cores, mensagem de garantia e cronómetro/urgência promocional), com visualização prévia em tempo real (preview ao vivo).
  2. **Ativação Real de Order Bump e Funil**: Corrige a desconexão do funil no checkout. As ofertas criadas em `/produtor/funil` passam a ser carregadas no `/checkout/$slug`, renderizando a caixa de Order Bump interativa com checkbox de adição imediata ao pedido, somando o valor ao total e registrando a venda composta.
  3. **Campanha "Pulseira Primeira Venda"**: Criação de banner de incentivo e gamificação para produtores, com imagem fotorrealista da pulseira de silicone preta/azul e dourada da InfroPay ("Faça a sua primeira venda e receba a pulseira oficial de Primeira Venda em casa").
  4. **Central de Atendimento Oficial**: Modal de suporte elegante que centraliza o Instagram `@infropay.ao` e o link do WhatsApp para atendimento humanizado sem duplicidades ou ícones soltos redundantes.

- **Público-Alvo**:
  - _Produtores/Vendedores_: Podem criar checkouts com aparência profissional e única da sua própria marca para aumentar a conversão, além de aumentar o ticket médio através de Order Bumps.
  - _Compradores_: Experiência de compra segura, transparente, com opção de levar complementos promocionais em oferta exclusiva com 1 clique.

---

### 2. User Experience & Visual Design

#### A. Editor de Checkout Personalizado (`/produtor/checkout/$id`)

- **Layout de Duas Colunas (Desktop)**:
  - _Coluna Esquerda (Controles do Vendedor)_:
    - **Identidade da Marca**: Nome comercial/marca do vendedor (`checkout_brand_name`) e upload/URL do logótipo (`checkout_logo_url`).
    - **Banner de Topo Opcional**: Imagem de cabeçalho promocional (`checkout_banner_url`).
    - **Tema de Cores**: Seletor de esquema visual (Padrão InfroPay Dark, Safira Noturno, Dourado Luxo, Esmeralda Pro, Minimalista Claro).
    - **Gatilhos de Conversão**: Cronómetro de contagem regressiva promocional (ex.: 15 minutos), selo de garantia de satisfação (7, 15 ou 30 dias) e texto promocional customizável.
  - _Coluna Direita (Preview Interativo em Tempo Real)_:
    - Réplica fiel e responsiva do checkout exatamente como o comprador final o verá, atualizando-se instantaneamente a cada tecla ou cor selecionada.
- **Botão de Acesso Rápido**:
  - Inserido no menu de ações de cada produto em `/produtor/produtos` ("Personalizar Checkout") e atalho direto na página de edição do produto.

#### B. Order Bump Funcional no Checkout (`/checkout/$slug`)

- **Posicionamento Estratégico**: Localizado logo abaixo dos dados do comprador e acima da escolha do método de pagamento (zona de máxima conversão).
- **Design de Alta Conversão**:
  - Caixa com borda destacada e fundo sutil (`border-gold/40 bg-gold/5`).
  - Checkbox interativo com texto chamativo: _"SIM! Quero adicionar [Título do Bump] por apenas [Preço Promocional em Kz]"_.
  - Miniatura da capa do produto complementar e breve explicação do benefício.
  - Ao marcar/desmarcar, o resumo do pedido (Subtotal, Oferta Adicional, Total Final) é recalculado dinamicamente com animação suave e números tabulares (`tabular-nums`).

#### C. Campanha "Pulseira Primeira Venda"

- **Arte Visual Dedicada**: Geração via `generate_image` de imagem de produto de alta definição: pulseira de silicone resistente em preto fosco/azul profundo com gravação em relevo dourado "InfroPay — 1ª Venda".
- **No Painel do Produtor (`/produtor`)**: Card premium com badge "Marco Inicial", progresso de faturamento, imagem da pulseira e CTA "Criar Oferta & Vender".
- **Na Página Inicial (`/`)**: Bloco comemorativo dentro da jornada do produtor mostrando a premiação física de reconhecimento que todo criador recebe ao iniciar na InfroPay.

#### D. Modal de Atendimento e Suporte Oficial

- **Abertura Suave**: Ao clicar no botão de suporte (no rodapé, cabeçalho ou página de contactos), abre-se um modal focado com:
  - Canal 1: **Instagram Oficial** (`@infropay.ao`) com link direto para o perfil/página da InfroPay.
  - Canal 2: **WhatsApp de Suporte** com link direto pré-formatado para abertura no aplicativo móvel ou web.
  - Informação de horário e atendimento humanizado em Angola.

---

### 3. Key Product Decisions & Trade-Offs

- **Persistência de Dados de Checkout**:
  - _Decisão_: Utilizar as colunas já existentes na tabela `products` (`checkout_brand_name`, `checkout_logo_url`, `checkout_banner_url`, `checkout_theme`, `guarantee_days`) e estendê-las com segurança nas server functions.
  - _Porquê_: Preserva compatibilidade total com o Supabase sem requerer migrações perigosas em tempo de execução.
- **Order Bump com Suporte a Ofertas Reais**:
  - _Decisão_: Conectar o checkout à função `getCheckoutOffers` existente em `src/lib/funnel.functions.ts` e estender `createOrder` em `src/lib/checkout.functions.ts` para processar a venda do produto principal + itens de bump selecionados.
  - _Porquê_: O produtor já cria bumps em `/produtor/funil`, bastando fechar o ciclo de carregamento e cobrança no checkout público.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INFROPAY FUNNEL & CHECKOUT                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│ PRODUTOR CHECKOUT EDIT  │ │    PUBLIC CHECKOUT      │ │    SUPPORT & BRACELET   │
│ - /produtor/checkout/$id│ │ - /checkout/$slug       │ │ - SupportModal          │
│ - Theme / Brand / Logo  │ │ - Loads product details │ │   (Instagram + WhatsApp)│
│ - Banner / Urgency / Gar│ │ - Loads getCheckoutOffer│ │ - Pulseira 1ª Venda     │
│ - Live Interactive Prev │ │ - Order Bump Checkbox   │ │   (Dashboard + Hero)    │
│ - updateProductCheckout │ │ - Dynamic Total Calc    │ │ - Generated Asset       │
└────────────┬────────────┘ └────────────┬────────────┘ └────────────┬────────────┘
             │                           │                           │
             ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API & SERVER FUNCTIONS                          │
│ - checkout.functions.ts: createOrder (with order bump & coupons)            │
│ - funnel.functions.ts: getCheckoutOffers, listMyOffers, createOffer         │
│ - products.functions.ts: getMyProduct, updateProductCheckoutSettings        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SUPABASE POSTGRES                               │
│ - products (checkout_brand_name, checkout_logo_url, checkout_theme, etc.)   │
│ - product_offers (kind='order_bump', active=true, offer_price_cents)        │
│ - sales & order tracking                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Passos de Implementação:

1. **Geração de Imagem**:
   - Gerar a imagem em alta definição da pulseira de silicone da InfroPay (`infropay_first_sale_bracelet`) via `generate_image`.
2. **Backend & Funções de Servidor**:
   - Atualizar `src/lib/checkout.functions.ts` para receber `bump_offer_ids` e calcular corretamente o total com os order bumps adicionados.
   - Garantir que a função de atualizar configurações de checkout do produto esteja disponível e tipada.
3. **Editor de Checkout do Produtor**:
   - Criar a rota `src/routes/_authenticated/produtor.checkout.$id.tsx` com formulário de configuração e preview interativo ao vivo.
   - Adicionar o botão "Personalizar Checkout" em `src/routes/_authenticated/produtor.produtos.tsx` e no menu do produtor.
4. **Checkout com Order Bump**:
   - Integrar `getCheckoutOffers` em `src/routes/checkout.$slug.tsx`.
   - Renderizar o componente de Order Bump interativo com cálculo em tempo real e visual personalizado da marca do vendedor se configurada.
5. **Campanha da Pulseira Primeira Venda**:
   - Inserir o card da conquista no topo de `src/routes/_authenticated/produtor.index.tsx` e seção correspondente em `src/routes/index.tsx`.
6. **Central de Suporte Unificada**:
   - Criar `src/components/site/SupportModal.tsx` com atalhos para Instagram (`@infropay.ao`) e WhatsApp, integrando-o ao Header, Footer e botões de suporte.
7. **Verificação & Testes**:
   - Executar `lint_applet` e `compile_applet` para assegurar compilação limpa sem erros.
