# 📑 Manual de Operação e Guia Técnico
## Sistema de Inventário & Auditoria Patrimonial (v2.8 Enterprise)

> **Este manual detalha o funcionamento, as telas e os fluxos de lógica do aplicativo para usuários, gestores e desenvolvedores.**
> Todas as telas são mapeadas diretamente aos componentes React (`.tsx`) do projeto.

---

## 📱 Sumário
1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura de Telas & Componentes (`.tsx`)](#2-arquitetura-de-telas--componentes-tsx)
3. [Manual de Telas (Passo a Passo)](#3-manual-de-telas-passo-a-passo)
   - [Dashboard Principal (`MainScreen.tsx`)](#dashboard-principal-mainscreentsx)
   - [Criação de Novo Lote (`NewBatchScreen.tsx`)](#criação-de-novo-lote-newbatchscreentsx)
   - [Leitura de Campo / Scanner (`VerificationScanScreen.tsx` / `CameraScanner.tsx`)](#leitura-de-campo--scanner-verificationscanscreentsx)
   - [Detalhes do Lote & Indicadores (`BatchDetailsScreen.tsx`)](#detalhes-do-lote--indicadores-batchdetailsscreentsx)
   - [Central de Importação (`ImportInventoryScreen.tsx`)](#central-de-importação-importinventoryscreentsx)
   - [Relatórios & Dossiê de Divergências (`AuditResultsScreen.tsx`)](#relatórios--dossiê-de-divergências-auditresultsscreentsx)
   - [Histórico de Operações & Rastreabilidade (`AuditLogScreen.tsx`)](#histórico-de-operações--rastreabilidade-auditlogscreentsx)
4. [Lógicas Especiais de Integração & Dados (Offline-First)](#4-lógicas-especiais-de-integração--dados-offline-first)
   - [Fatiamento e Transferência via QR Code (`qrChunker.ts`)](#fatiamento-e-transferência-via-qr-code-qrchunkerts)
   - [Importador de QR Code Multi-partes (`QrImportScannerScreen.tsx`)](#importador-de-qr-code-multi-partes-qrimportscannerscreentsx)
   - [Central de Backup Inteligente: REPLACE vs. MERGE (`SettingsScreen.tsx`)](#central-de-backup-inteligente-replace-vs-merge-settingsscreentsx)
5. [Fluxos do Dia a Dia (Guia Prático)](#5-fluxos-do-dia-a-dia-guia-prático)

---

## 1. Visão Geral do Sistema

O aplicativo **Inventário & Auditoria Patrimonial** foi projetado para operar de forma totalmente **offline** em dispositivos móveis e coletores de dados, garantindo que equipes em armazéns, escritórios ou locais remotos sem internet consigam realizar auditorias e conferências de ativos físicos sem interrupções.

### Objetivos do Sistema:
* **Eliminar erros manuais** de digitação de códigos de barras ou patrimônios.
* **Controlar duplicidades** em tempo real no campo (evitar contar o mesmo ativo duas vezes).
* **Garantir conciliação instantânea**: saber na hora o que foi encontrado, o que está faltando e o que é excedente.
* **Agilizar o fluxo de dados**: transferir lotes de dados entre aparelhos de forma 100% offline utilizando QR Codes dinâmicos de alta capacidade.

---

## 2. Arquitetura de Telas & Componentes (`.tsx`)

A estrutura do projeto segue as melhores práticas de modularidade no React, mapeando cada tela principal para seu respectivo arquivo `.tsx` na pasta `src/components/`:

```
src/
├── components/
│   ├── MainScreen.tsx             # Dashboard geral com KPIs e atalhos rápidos
│   ├── NewBatchScreen.tsx          # Tela de abertura de novos lotes de auditoria
│   ├── BatchListScreen.tsx         # Listagem de todos os lotes cadastrados no aparelho
│   ├── CameraScanner.tsx           # Componente de câmera integrado com feedback visual
│   ├── VerificationScanScreen.tsx  # Scanner de auditoria contra lista mestra esperada
│   ├── BatchScanScreen.tsx         # Scanner simples para contagem geral (sem lista mestre)
│   ├── SequentialScanScreen.tsx    # Leitor contínuo ultrarrápido com memória temporária
│   ├── BatchDetailsScreen.tsx      # Central de gestão do lote, barra de progresso e ações
│   ├── AuditResultsScreen.tsx      # Dossiê de divergências detalhado e filtros de auditoria
│   ├── ImportInventoryScreen.tsx   # Central para carregar arquivos de ativos esperados
│   ├── ExportBatchesScreen.tsx     # Exportação de lotes consolidados (CSV, JSON, QR Code)
│   ├── SettingsScreen.tsx          # Configurações do sistema, políticas e exportação de backups
│   ├── BackupModal.tsx             # Modal interativo de recuperação e mesclagem de backup
│   ├── QrCodeExportModal.tsx       # Modal de fatiamento e exibição de QR Code inteligente
│   └── QrImportScannerScreen.tsx   # Scanner receptor de transferência de lote via QR Code
├── services/
│   └── storage.ts                  # Engine de persistência em LocalStorage e gerador de CSV
├── utils/
│   ├── qrChunker.ts                # Lógica de fatiamento (chunking) e fusão de dados JSON
│   └── qrDecoder.ts                # Leitor de imagem estática de QR Code via upload de arquivos
└── types.ts                        # Definição dos tipos TypeScript do projeto
```

---

## 3. Manual de Telas (Passo a Passo)

### Dashboard Principal (`MainScreen.tsx`)
A primeira tela exibida ao abrir o sistema. Ela atua como a torre de controle do operador de campo.

* **Indicadores Executivos (KPIs)**:
  * **Total de Ativos**: Soma de todas as leituras válidas feitas no aparelho.
  * **Lotes Pendentes**: Quantidade de inventários em andamento.
  * **Lotes Concluídos**: Quantidade de inventários fechados e prontos para envio.
* **Atalhos de Acesso Rápido**:
  * **Abertura de Lotes**: Direciona para criação de novo inventário.
  * **Leitura Contínua**: Acesso ao leitor rápido sem lote associado.
  * **Importador Geral**: Área para carregar dados externos.
  * **Configurações**: Ajuste de permissões e backups.
* **Feed de Atividades Recentes**: Mostra os últimos registros de leitura com carimbo de data, hora e lote correspondente para rápida orientação.

---

### Criação de Novo Lote (`NewBatchScreen.tsx`)
Para iniciar qualquer coleta de dados, é obrigatório criar um lote de trabalho, o que organiza as leituras cronológica e geograficamente.

* **Tipos de Inventários Disponíveis**:
  1. **Auditoria / Verificação**: Exige a importação prévia de uma Lista Mestra (ativos esperados). O sistema irá calcular divergências (OK, Faltantes, Extras).
  2. **Inventário Simples (Contagem Geral)**: Não exige lista prévia. O operador simplesmente sai lendo os códigos do setor para listar o que existe ali.
* **Campos de Cadastro**:
  * **Nome do Lote / Setor**: Identificador amigável (Ex: *Almoxarifado Central*, *Escritório TI - Bloco B*).
  * **Responsável**: Nome do auditor que está conduzindo a contagem.
  * **Observações**: Campo livre para detalhamento de restrições ou notas de campo.

---

### Leitura de Campo / Scanner (`VerificationScanScreen.tsx` / `CameraScanner.tsx`)
A tela de campo mais utilizada. Ativa a câmera do aparelho para bipe de patrimônios.

* **Indicador de Progresso Superior**: Exibe em tempo real o percentual de ativos auditados do lote atual.
* **Câmera com Retículo Central**: Auxilia a mira correta no código de barras ou QR Code.
* **Bloqueio Automático de Duplicidade**: Se o operador ler o mesmo ativo mais de uma vez no mesmo lote, o sistema exibe um alerta sonoro/visual de duplicidade e ignora a leitura repetida para não inflar os dados.
* **Classificação de Cores do Feedback**:
  * 🟢 **Verde (OK)**: O patrimônio lido consta na Lista Mestra original e foi validado.
  * 🔴 **Vermelho (Pendente)**: Itens que ainda precisam ser localizados no setor (exibidos no resumo abaixo).
  * 🟠 **Laranja (Extra / Sobra)**: O patrimônio foi lido no setor, mas não consta na Lista Mestra enviada pelo sistema. É uma sobra física (ativo fora de lugar ou não cadastrado).
* **Bulk Scan**: Suporta a leitura de múltiplos códigos em um único QR Code (separados por espaço ou vírgula).

---

### Detalhes do Lote & Indicadores (`BatchDetailsScreen.tsx`)
Visão analítica de cada lote individual. Permite controlar o andamento das leituras e exportar os relatórios específicos daquele lote.

* **Barra Segmentada Multicor**: Representa visualmente a integridade física do lote:
  * **Azul**: Total esperado.
  * **Verde**: Total encontrado (OK).
  * **Vermelho**: Total não localizado (Faltas).
  * **Laranja**: Total de sobras encontradas (Extras).
* **Botão Recalcular Lógica**: Permite sincronizar em tempo real as leituras feitas com a lista mestre para corrigir discrepâncias.
* **Funções de Ação**:
  * **Importar Lista Mestra**: Permite carregar ou atualizar os ativos esperados para este lote específico.
  * **Exportar (Ícone Share)**: Abre o seletor de exportação (CSV, JSON ou QR Code Mestre).
  * **Fechar Lote**: Bloqueia novas leituras no lote, alterando seu status para Concluído.

---

### Central de Importação (`ImportInventoryScreen.tsx`)
Permite ao operador carregar as listas de patrimônios esperados que foram geradas pelo ERP corporativo (SAP, Totvs, Senior, etc.).

* **Upload de CSV**: Suporta arquivos separados por vírgula ou ponto e vírgula com colunas de código de barras, descrição e categoria.
* **Leitura de QR Code Mestre**: O celular do auditor pode escanear o QR Code de outro dispositivo (ou de uma folha impressa) para carregar instantaneamente a lista mestra sem cabo ou internet.

---

### Relatórios & Dossiê de Divergências (`AuditResultsScreen.tsx`)
Tela focada na tomada de decisões por parte da coordenação ou auditoria final.

* **Métrica de Acurácia**: Exibida em destaque no topo (Fórmula: `(Itens OK / Total Esperado) * 100`).
* **Filtros Rápidos Estilizados**:
  * **TODOS**: Mostra todos os dados do lote.
  * **OK**: Mostra apenas ativos encontrados corretamente.
  * **PENDENTES (Faltas)**: Lista estrita de itens sumidos para auditoria física.
  * **SOBRAS (Extras)**: Lista de itens que estão fisicamente no setor mas pertencem a outro local ou não possuem cadastro.
* **Gestão de Segurança para Exclusões**: Controle configurável em Ajustes (Bloqueado, Uma Vez ou Liberado).

---

### Histórico de Operações & Rastreabilidade (`AuditLogScreen.tsx`)
Para conformidade regulatória e auditoria interna, cada ação crítica é gravada no banco local de rastreabilidade (Black Box).

---

## 4. Lógicas Especiais de Integração & Dados (Offline-First)

### A) Fatiamento e Transferência via QR Code (`qrChunker.ts`)
O sistema implementa a lógica de **QR Code Chunker (Fatiamento Sequencial)** para superar o limite físico de caracteres:
1. Converte dados JSON em string e reparte em pedaços (chunks) de ~350 caracteres.
2. O modal exibe um carrossel onde o usuário avança as partes conforme a leitura progride.

---

### B) Importador de QR Code Multi-partes (`QrImportScannerScreen.tsx`)
1. Detecta o prefixo `CHUNK:` e armazena as fatias em qualquer ordem.
2. Exibe barra de progresso vivo de recebimento.
3. Reconstrói o JSON completo automaticamente ao ler a última parte.

---

### C) Central de Backup Inteligente: REPLACE vs. MERGE (`SettingsScreen.tsx`)
#### 1. Zerar Base e Substituir Tudo (REPLACE)
Ideal para migração definitiva de aparelho ou reposição de hardware.

#### 2. Mesclar com Dados Locais (MERGE)
Ideal para consolidar auditorias de vários aparelhos em um celular supervisor, tratando conflitos de IDs e duplicidade de bipes.

---

## 5. Fluxos do Dia a Dia (Guia Prático)

### Cenário: Consolidação de Equipes
1. Cada auditor de campo exporta seu trabalho via **QR Code Mestre**.
2. O supervisor escaneia os celulares usando o **Importador QR** e escolhe a opção **Mesclar (MERGE)**.
3. O supervisor gera o **Dossiê Executivo** consolidado para envio oficial.
