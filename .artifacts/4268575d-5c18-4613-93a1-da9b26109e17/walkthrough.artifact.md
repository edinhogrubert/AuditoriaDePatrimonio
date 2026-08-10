# Correção de Preview da Câmera (v2.10)

Resolvi o problema da "tela preta" no scanner, garantindo que a imagem da câmera nativa seja exibida corretamente atrás da interface do aplicativo.

## Alterações Realizadas

### 1. Transparência Dinâmica de Hardware
- **`CameraScanner.tsx`**: Removi o fundo preto sólido (`bg-black`) do container da câmera. Agora ele fica transparente quando o scanner nativo está ativo, permitindo "ver através" do app até a lente.
- **`index.css`**: Reforcei as regras globais de transparência para que `html`, `body` e o container principal do React (`#root`) não bloqueiem a imagem de fundo quando o scanner for disparado.

### 2. Layout "Split Screen" para Auditoria
- **Interfaces de Scan**: Ajustei os componentes `VerificationScanScreen.tsx` e `BatchScanScreen.tsx`.
- **Cabeçalho e Rodapé**: Apliquei cores sólidas com leve desfoque (`backdrop-blur`) e transparência parcial no cabeçalho e rodapé. Isso garante que os textos e a barra de progresso continuem legíveis enquanto o centro da tela exibe a câmera.

### 3. Sincronização de Rotas
- **`App.tsx`**: Atualizei a lógica central para garantir que todas as telas que usam câmera (Leitura Rápida, Sequencial, Auditoria e Importação QR) desativem o gradiente de fundo do tema automaticamente ao serem abertas.

---

## Como testar:

1.  No Android Studio, clique no **Play verde**.
2.  **Teste de Visão**:
    *   Abra a **Leitura Rápida**. Você deve ver o cenário da câmera imediatamente.
    *   Abra uma **Auditoria**. O centro da tela deve mostrar a câmera, com os dados de progresso flutuando na parte inferior.
    *   Verifique se ao fechar a câmera, o fundo azul/gradiente do app volta ao normal.

A interface agora trabalha em harmonia com o hardware, permitindo uma experiência de auditoria muito mais intuitiva.
