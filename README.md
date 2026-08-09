# AuditInventário - Auditoria & Gestão Patrimonial (v2.8 Enterprise)

O **AuditInventário** é uma solução híbrida (React + Capacitor) de alto desempenho para auditoria de ativos e gestão de inventário. Evoluiu para um sistema completo de **Conferência Patrimonial**, oferecendo inteligência de dados, rastreabilidade total (Logs), transferência de dados sem fio (QR Multi-Chunk) e relatórios executivos.

---

## 📑 Índice
- [Principais Recursos](#-principais-recursos)
- [Novidades da Versão 2.8](#-novidades-da-versão-28)
- [Funcionalidades Enterprise](#-funcionalidades-enterprise)
- [Tecnologias](#-tecnologias)
- [Instalação e Execução](#-instalação-e-execução)
- [Arquitetura](#-arquitetura)
- [Licença](#-licença)

---

## ✨ Principais Recursos

- **Dashboard Executivo**: Acompanhamento em tempo real de acurácia, lotes pendentes e totais de patrimônios com design profissional.
- **Scanner Profissional (Google ML Kit)**: Leitura ultrarrápida de QR Codes e Códigos de Barras com bloqueio inteligente de duplicidade e estabilidade de hardware.
- **Importação Multimodal**:
  - **CSV/TXT**: Carga de listas mestre com 1 ou 3 colunas.
  - **QR Code Mestre**: Importação de listas inteiras via scan de um único código.
  - **Importação por Imagem**: Carregamento de QR Codes a partir da galeria de fotos.
- **Gestão de Lotes**: Criação de lotes para Coleta Simples (contagem rápida) ou Conferência (Auditoria vs. Lista Mestre).
- **Temas Dinâmicos**: Modo Claro (vibrante com gradientes) e Modo Escuro (executivo de alto contraste).

---

## 🚀 Novidades da Versão 2.8

A versão 2.8 traz inovações focadas em escalabilidade e facilidade de uso em campo:

### 1. Sistema de Transferência via QR Code (Multi-Chunk)
Permite transferir lotes inteiros de um dispositivo para outro sem necessidade de cabos ou internet. 
- **Chunking Inteligente**: Dados grandes são divididos automaticamente em múltiplos QR Codes.
- **Progressiva**: O dispositivo receptor exibe uma barra de progresso conforme cada parte é lida.
- **Reconstrução**: O sistema valida e reconstrói o banco de dados original instantaneamente.

### 2. Backup e Restauração Inteligente
- **Smart Merge**: Adicione dados de um backup aos seus dados atuais sem duplicar registros.
- **Full Replace**: Substituição total da base de dados para migrações rápidas.

### 3. Leitura em Lote (Bulk Scan)
- Agora o scanner de câmera entende múltiplos códigos em uma única leitura. Ao bipar um QR Code contendo uma lista (separada por espaços, vírgulas ou `;`), o sistema processa todos os itens individualmente de uma só vez.

---

## 🏢 Funcionalidades Enterprise

- **Logs de Auditoria (Black Box)**: Rastreabilidade total de duplicidades bloqueadas, exclusões e importações.
- **Relatórios & Insights**: Análise de risco contábil, estudo de divergências e análise de prefixos de patrimônio.
- **Dossiê Executivo**: Gerador de relatório em texto formatado para atas oficiais.
- **Controle de Segurança**: Permissões granulares para exclusão de registros (Bloqueado, Liberar 1x, Sempre Liberado).

---

## 🧪 Tecnologias

- **React 18** + **TypeScript**
- **Capacitor 6**
- **Google ML Kit**
- **Tailwind CSS**
- **qrcode.react** (Geração de códigos on-the-fly)

---

## 🚀 Instalação e Execução

1. **Dependências**: `npm install`
2. **Build**: `npm run build`
3. **Sincronização**: `npx cap sync`
4. **Android Studio**: Abrir a pasta `android` e clicar no **Play verde**.

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** — MIT © 2026 Edinho Grubert.
