# Plano de Correção e Estabilização da Câmera (v2.9)

Este plano visa resolver a falha na abertura da câmera, a leitura de códigos e o funcionamento do flash, garantindo que o motor nativo (ML Kit) seja inicializado corretamente.

## Pesquisa e Diagnóstico
- **Causa Provável**: O motor de escaneamento do Google (ML Kit) pode não estar instalado ou atualizado no dispositivo Android, ou a chamada `startScan` está bloqueando a renderização.
- **Flash/Luz**: Se o scanner nativo não "prender" a câmera com sucesso, o comando de ligar o flash falha silenciosamente.
- **Transparência**: Verificamos que o CSS está correto, mas a inicialização do hardware precisa de mais robustez.

## Proposta de Mudanças

### 1. Robustez na Inicialização (`CameraScanner.tsx`)
- Adicionar a verificação e instalação do módulo Google Barcode Scanner (`installGoogleBarcodeScanner`).
- Separar a lógica de permissões da lógica de inicialização de hardware.
- Refinar a chamada de `startScan` para usar formatos explícitos em vez de um array vazio, aumentando a compatibilidade.

### 2. Correção do Flash
- Ajustar a função `toggleFlash` para garantir que ela seja chamada apenas quando o scanner estiver ativo e pronto.

### 3. Melhoria no Lifecycle
- Garantir que `stopScan` seja executado de forma limpa ao sair de qualquer tela de câmera, liberando o hardware para a próxima abertura.

## Plano de Execução

- `[ ]` **Refatorar** `CameraScanner.tsx`:
    - Injetar `ensureScannerHardware` no início da ativação.
    - Atualizar `BarcodeScanner.startScan({ formats: [BarcodeFormat.QrCode, BarcodeFormat.Ean13, BarcodeFormat.Code128] })`.
    - Adicionar log de erro detalhado caso o hardware falhe.
- `[ ]` **Validar** telas dependentes:
    - `VerificationScanScreen.tsx`
    - `BatchScanScreen.tsx`
    - `SequentialScanScreen.tsx`
    - `QrImportScannerScreen.tsx`

## Plano de Verificação

### Automated Tests
- Executar `npm run build` para garantir que não há erros de tipagem.

### Manual Verification
1. Abrir a Leitura Rápida e verificar se a câmera liga instantaneamente.
2. Testar o botão de Flash (Zap) em um ambiente escuro.
3. Bipar um QR Code e um Código de Barras (EAN-13) para validar o reconhecimento.
4. Navegar entre abas e voltar para a câmera para garantir que o hardware não "trava" ocupado.
