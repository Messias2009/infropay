# Renovação Visual das Premiações & Upload Direto no Checkout Personalizado

Plano para modernizar a experiência de premiações físicas (pulseira e placas oficiais) e transformar os campos de marca e banner do checkout personalizado em carregamento direto de ficheiros locais com pré-visualização instantânea.

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas pelo utilizador na etapa de alinhamento:
>
> - **Exibição da Pulseira de 1ª Venda**: Em vez de permanecer fixa ocupando espaço na página, será exibida como um **Modal Popup centralizado na tela** com botão "X" de fechar, memorizando o fechamento na sessão para não incomodar a navegação.
> - **Estilo das 5 Placas de Premiação**: Troféus metálicos premium tridimensionais com acabamento em acrílico lapidado e detalhes em ouro/metais nobres (afastando-se completamente do formato de "botão de inscritos do YouTube").
> - **Carregamento de Imagens no Checkout**: Upload direto de ficheiro local do computador/telemóvel com leitura imediata e pré-visualização instantânea, eliminando a necessidade de colar links ou URLs externos.

---

## 1. Visão Geral & Conceito Central

- **O que faz**:
  1. Converte a divulgação da pulseira de primeira venda num modal popup elegante que o utilizador pode fechar clicando no "X" ou no fundo da tela, limpando o topo da seção de premiações.
  2. Apresenta 5 placas oficiais de conquista de faturamento (Prata 100k, Ouro 500k, Platina 1M, Diamante 5M e Black Elite 10M) com novas ilustrações fotorrealistas em estilo troféu de alta gama.
  3. No personalizador de checkout do produtor, substitui os campos de texto com links por caixas de upload de arquivo (com suporte a drag & drop, seleção de ficheiro, compressão/leitura em tempo real e botão de remover).
- **Público-Alvo**: Criadores e produtores digitais que configuram a sua loja e checkout próprio na InfroPay, bem como visitantes da landing page.
- **Valor Principal**: Aumento da conversão e facilidade de personalização da marca sem atrito técnico de hospedagem de imagens, com uma experiência visual sofisticada de reconhecimento de vendas.

---

## 2. Experiência do Utilizador & Design Visual

### Fluxos Chave de Interação

1. **Modal Popup da Pulseira da 1ª Venda**:
   - Ao navegar pela página, o popup surge com transição suave (`opacity` e `scale`), destacando a imagem da pulseira, chamada de incentivo e botão de fechar "X" no canto superior direito.
   - O botão "X" fecha imediatamente o modal e guarda o estado no `sessionStorage`/`localStorage`.
   - Na seção de premiações da página inicial, a grade foca-se nas 5 placas oficiais, mantendo um botão discreto caso o utilizador queira rever a pulseira.
2. **Exibição das 5 Placas de Premiação**:
   - Grade harmônica de 5 colunas (responsiva para mobile/tablet) exibindo cada troféu com acabamento espelhado, bordas chanfradas em acrílico, metas claras em Kwanzas (`100k Kz`, `500k Kz`, `1M Kz`, `5M Kz`, `10M Kz`) e tipografia tabular sem badges excessivos.
3. **Upload de Imagens no Checkout Personalizado**:
   - Área de carregamento para o **Logótipo** (proporção quadrada / ícone) e **Banner** (proporção panorâmica 3:1).
   - O produtor clica ou arrasta uma imagem do seu dispositivo.
   - Pré-visualização instantânea no painel e na maquete do checkout em tempo real.
   - Opção para substituir ou remover com um clique.

### Identidade Visual & Diretrizes Anti-Slop

- Sem botões estilo YouTube ou reproduções de botões de play.
- Tipografia limpa com `Plus Jakarta Sans` e numerais tabulares para os valores de faturamento.
- Modais com backdrop escuro translúcido com desfoque suave (`backdrop-blur-sm bg-black/60`).

---

## 3. Decisões de Produto & Arquitetura Técnica

```
┌────────────────────────────────────────────────────────┐
│                   Experiência Visual                   │
├─────────────────────────┬──────────────────────────────┤
│ Landing Page            │ Checkout Personalizado       │
│ ├─ Modal Pulseira (X)   │ ├─ Upload Direto de Logo     │
│ └─ Grade de 5 Placas    │ ├─ Upload Direto de Banner   │
│    (Prata, Ouro,        │ └─ Prévia Instantânea        │
│     Platina, Diamante,  │    (Base64 Data URL)         │
│     Black Elite)        │                              │
└─────────────────────────┴──────────────────────────────┘
```

- **Geração de Imagens Fotorrealistas (Batch)**:
  - `generate_image` será invocado em lote paralelo para produzir:
    1. `infropay_wristband_first_sale` (Pulseira moderna gravada com detalhes dourados)
    2. `infropay_plaque_silver_100k` (Troféu metálico prata com bloco acrílico)
    3. `infropay_plaque_gold_500k` (Troféu metálico ouro polido e vidro temperado)
    4. `infropay_plaque_platinum_1m` (Troféu platina com reflexos cromados)
    5. `infropay_plaque_diamond_5m` (Troféu cristal diamante lapidado com metal nobre)
    6. `infropay_plaque_black_10m` (Troféu obsidiana preta fosca com ouro 24k)
- **Persistência de Upload do Checkout**:
  - Leitura de arquivo via `FileReader` para `data:image/...;base64,...` com otimização/redimensionamento automático em canvas no navegador para garantir carregamento leve e armazenamento direto no campo de perfil do checkout (`checkout_logo_url` e `checkout_banner_url`).
- **Controle de Estado do Modal**:
  - Estado local `isOpen` com verificação de fechamento prévio (`sessionStorage.getItem('infropay_dismissed_wristband')`).

---

## 4. Etapas de Execução

1. **Geração dos Ativos Visuais (Turno de Imagens em Paralelo)**:
   - Disparar todas as 6 imagens com descrições detalhadas e proporções exatas (1:1 e 4:3).
2. **Implementação do Modal da Pulseira**:
   - Criar componente de modal elegante com backdrop, botão "X" visível e acessível via teclado (`Esc`), e persistência de fechamento.
   - Ajustar a seção de conquistas na página inicial (`src/routes/index.tsx`) e produtores (`src/routes/_authenticated/produtor.conquistas.tsx`).
3. **Atualização da Grade de 5 Placas**:
   - Integrar as novas 5 placas geradas, removendo qualquer semelhança com ícones do YouTube.
4. **Implementação do Upload de Ficheiros no Checkout**:
   - Atualizar `src/routes/_authenticated/produtor.checkout.$id.tsx` e `src/routes/_authenticated/produtor.editar.$id.tsx` com componente de upload de imagem interativo com prévia.
5. **Verificação & Compilação**:
   - Executar `lint_applet` e `compile_applet` para assegurar integridade completa sem regressões.
