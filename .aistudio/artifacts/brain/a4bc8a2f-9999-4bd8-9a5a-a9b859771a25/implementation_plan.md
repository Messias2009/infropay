# Checkout Personalizado, Gestão de Segurança no Perfil & Conquistas Aprimoradas

Plano de implementação para ativar os atalhos de Checkout Personalizado com upload de imagens e identidade visual, mover as configurações de notificações e alteração de palavra-passe para o Perfil, e refinar a página de Conquistas com a nova pulseira de borracha azul InfroPay, selos especiais ilustrados, acompanhamento percentual de metas e remoção de prévias.

## Decisões Confirmadas com o Utilizador

> [!IMPORTANT]
> - **Checkout Personalizado**: Atalho visível e direto "Personalizar Checkout" nos cards de produtos (`/produtor/produtos`) e na tela de edição de produto (`/produtor/editar/$id`), levando à tela de personalização completa com upload de logo, banner, temas e temporizadores.
> - **Notificações & Segurança no Perfil (`/perfil`)**:
>   - Removido de Conquistas e adicionado na tela de perfil.
>   - Adição de formulário seguro para alteração de palavra-passe (`Nova palavra-passe` e `Confirmar palavra-passe`).
>   - Gestão de notificações push e áudio "Ka-ching!".
> - **Página de Conquistas (`/produtor/conquistas`)**:
>   - Nova fotografia oficial de estúdio da **pulseira de borracha de silicone azul** com logotipo em relevo `InfroPay`.
>   - Nova imagem premium e medalhas em alta resolução para os **Selos Especiais**.
>   - **Remoção de todas as prévias**: eliminados botões de prévia/teste de notificação das placas e do topo.
>   - **Acompanhamento de Nível em Tempo Real**: barra de progresso calculando exatamente quanto falta em percentual e Kwanzas (ex: *"Faltam 7% (35.000 Kz) para a Placa de Ouro"*).

---

## 1. Visão Geral das Funcionalidades

### A. Checkout Personalizado com Imagens e Marca
- O produtor tem acesso ao editor completo em `/produtor/checkout/$id`:
  - **Upload de Logo da Marca**: upload de logotipo personalizado exibido no topo do checkout.
  - **Banner de Topo / Capa**: proporções 16:9 ou 3:1 para promoção de autoridade.
  - **Seletor de Temas de Cores**: Azul InfroPay, Dourado Imperial, Verde Esmeralda, Roxo Creator e Preto Minimalista.
  - **Temporizador de Escassez**: contagem decrescente regressiva para impulsionar conversões.
  - **Garantia & Depoimentos**: textos de garantia e selos de segurança SSL / Multicaixa GPO.
  - **Pré-visualização em Tempo Real**: alternância instantânea entre visualização Mobile e Desktop.

### B. Perfil com Segurança e Notificações (`/perfil`)
- **Alteração de Palavra-Passe**:
  - Campos: Nova palavra-passe e Confirmação.
  - Validação de correspondência e comprimento mínimo de 6 caracteres.
  - Atualização direta via `supabase.auth.updateUser`.
- **Notificações Push & Sons de Venda**:
  - Painel de controlo integrado ao perfil para ativação de alertas e som de caixa registadora.

### C. Conquistas Limpas e Gamificadas (`/produtor/conquistas`)
- **Pulseira Oficial de Silicone Azul**: exibição da nova fotografia de alta qualidade da pulseira azul da InfroPay.
- **Rastreador de Nível de Faturamento**:
  - Faturamento total e quantidade de vendas.
  - Percentual dinâmico do nível atual até à próxima placa.
  - Destaque claro: *"Faltam apenas X% (Y Kz) para desbloquear a [Próxima Placa]"*.
- **5 Placas Oficiais Físicas**: exibição focada das placas de reconhecimento (Prata, Ouro, Platina, Diamante, Black Elite) sem botões de prévia desnecessários.
- **Selos Especiais Ilustrados**: selos em alta definição para conquistas como Primeira Venda, 10 Vendas, 100 Vendas, Milionário, Top Vendedor e Escala.

---

## 2. Diagrama de Navegação & Ações

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ECOSSISTEMA INFROPAY                            │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Produtos (/produtor/produtos│ • Botão "Personalizar Checkout"       │
│    e /produtor/editar/$id)     │ • Edição de logo, capas e tema visual │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Perfil (/perfil)            │ • Dados cadastrais do produtor        │
│    (Definições & Segurança)    │ • [NOVO] Alterar palavra-passe        │
│                                │ • [NOVO] Preferências de notificações │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Conquistas (/conquistas)    │ • Pulseira oficial de borracha azul   │
│    (100% focado em mérito)     │ • Acompanhamento: "Faltam X% para..." │
│                                │ • 5 Placas Oficiais (sem prévias)     │
│                                │ • Galeria de Selos Especiais 8K       │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Plano de Modificações por Ficheiro

### 1. `src/routes/_authenticated/produtor.produtos.tsx`
- Adicionar botão com ícone de paleta `Personalizar Checkout` apontando para `/produtor/checkout/$id` em cada produto da lista.

### 2. `src/routes/_authenticated/produtor.editar.$id.tsx`
- Adicionar botão de atalho `Personalizar Checkout` no topo da tela de edição do produto.

### 3. `src/routes/_authenticated/perfil.tsx`
- Adicionar formulário de **Alteração de Palavra-Passe** com campos protegidos, indicador de força e chamada a `supabase.auth.updateUser`.
- Adicionar o bloco de **Preferências de Notificações de Vendas** (`PushSalesNotificationBanner`).

### 4. `src/routes/_authenticated/produtor.conquistas.tsx`
- Substituir a imagem da pulseira pela nova imagem oficial gerada da pulseira de borracha azul (`infropay_blue_rubber_wristband_1792339247732.jpg`).
- Adicionar a imagem de alta definição para a secção de Selos Especiais (`infropay_special_seals_badge_1792339262403.jpg`).
- Remover todos os botões de prévia de notificações (`Testar Notificação da Minha Placa` e `Ver Notificação / Prévia Notificação`).
- Implementar o indicador de acompanhamento do nível com a barra e a contagem de percentual restante (ex: *"Faltam 7% (X Kz) para a Placa de Ouro"*).

---

## 4. Verificação & Validação

1. **Validação Estática**: `lint_applet` para garantir zero erros de TypeScript e formatação.
2. **Validação de Compilação**: `compile_applet` garantindo integridade de build.
3. **Verificação Funcional**:
   - Abrir a personalização de checkout a partir da lista de produtos e verificar uploads e temas.
   - Testar o formulário de alteração de senha no perfil.
   - Verificar a nova pulseira de borracha azul e o cálculo de percentual restante em Conquistas.
