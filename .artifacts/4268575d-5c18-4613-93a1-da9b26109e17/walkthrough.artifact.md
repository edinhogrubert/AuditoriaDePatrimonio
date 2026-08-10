# Estabilização da Câmera e Lanterna (Universal)

Implementei uma série de correções críticas para garantir que a câmera abra instantaneamente e reconheça qualquer tipo de código de barras ou QR Code no seu dispositivo Android.

## Alterações Realizadas

### 1. Garantia de Hardware (Google ML Kit)
- **Instalação Automática**: Adicionei um verificador que detecta se o motor de escaneamento do Google está presente. Se não estiver, o app solicita a instalação silenciosa/automática ao Android.
- **Suporte Universal**: Configurei o scanner para reconhecer explicitamente todos os formatos do mercado:
    - **QR Codes**: QR, Data Matrix, Aztec, PDF 417.
    - **Barras Industriais**: Code 39 (muito comum em patrimônio), Code 93, Code 128, ITF, Codabar.
    - **Comerciais**: EAN-8, EAN-13, UPC-A, UPC-E.

### 2. Correção do Flash (Lanterna)
- **Vínculo Direto**: Re-sincronizei o botão da lanterna (Zap) para que ele se comunique diretamente com o scanner ativo. Agora a luz só tentará acender quando o sensor da câmera estiver pronto.

### 3. Gerenciamento de Memória
- **Liberação de Hardware**: Reforcei o encerramento da câmera ao trocar de tela. Isso evita o erro de "Câmera Ocupada" que impedia a reabertura do scanner.

---

## Como aplicar e testar:

1.  No Android Studio, clique no ícone do **Elefante Azul** (Sync) no topo.
2.  Clique no **Play verde** para reinstalar o app com as novas permissões de hardware.
3.  **Teste de Campo**:
    *   Tente ler um código de patrimônio antigo (**Code 39**).
    *   Teste o botão de **Flash** em um local escuro.
    *   Navegue entre as telas de auditoria para verificar se a câmera abre rápido em todas.

O sistema de visão agora está muito mais robusto e compatível com coletores de dados e smartphones modernos.
