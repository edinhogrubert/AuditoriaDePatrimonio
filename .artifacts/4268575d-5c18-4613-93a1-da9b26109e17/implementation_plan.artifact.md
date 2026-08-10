# Plano de Correção do "Black Screen" na Câmera (v2.10)

Este plano resolve o problema onde a câmera funciona (lê códigos) mas a tela permanece preta, impedindo a visualização do preview.

## Diagnóstico
O plugin `barcode-scanning` do Capacitor renderiza a câmera nativa **atrás** do WebView. Se qualquer elemento HTML tiver uma cor de fundo sólida (como preto ou cinza escuro), ele cobrirá a câmera.

Principais causas identificadas:
1. **`CameraScanner.tsx`**: O container principal possui a classe `bg-black`, que bloqueia a visão da câmera nativa.
2. **`App.tsx`**: A lógica de transparência condicional não inclui todas as telas que usam câmera.
3. **`index.css`**: As regras de transparência global precisam ser mais precisas.

## Proposta de Mudanças

### 1. Refinamento de Transparência (`index.css`)
- Garantir que `html`, `body` e `#root` fiquem 100% transparentes quando o scanner estiver ativo.
- Criar uma classe específica `.camera-view-through` para ser usada nos containers das telas de scan.

### 2. Correção do Componente de Scanner (`CameraScanner.tsx`)
- Alterar `bg-black` para `bg-transparent` quando o scanner nativo estiver ativo.
- Manter o fundo preto apenas no modo de "fallback" (webcam) ou quando a câmera estiver desligada.

### 3. Ajuste de Telas de Scan (`VerificationScanScreen.tsx`, `BatchScanScreen.tsx`, etc.)
- Garantir que o layout "repartido" (split screen) funcione: a parte do scanner fica transparente para mostrar a câmera no fundo, enquanto o cabeçalho e o rodapé mantêm suas cores para legibilidade.
- Adicionar `batch_scan` e `qr_import` na lógica de transparência do `App.tsx`.

## Plano de Execução

- `[ ]` **Refinar** `index.css` para transparência cirúrgica.
- `[ ]` **Remover** fundos sólidos no `CameraScanner.tsx`.
- `[ ]` **Atualizar** `App.tsx` com as novas rotas transparentes.
- `[ ]` **Verificar** cada tela de scan no dispositivo físico.

## Plano de Verificação

### Manual Verification
1. Abrir a **Leitura Rápida** e verificar se o preview da câmera aparece.
2. Abrir a **Auditoria (Conferência)** e verificar se o preview aparece no centro, com o rodapé de progresso visível.
3. Testar a **Importação via QR Code** e garantir que a janela da câmera não esteja preta.
