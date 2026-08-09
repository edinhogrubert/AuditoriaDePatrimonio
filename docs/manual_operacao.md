# 📑 Manual de Operação e Guia Técnico
## Sistema de Inventário & Auditoria Patrimonial (v2.8 Enterprise)

> [!IMPORTANT]
> Este manual detalha o funcionamento, as telas e os fluxos de lógica do aplicativo para usuários, gestores e desenvolvedores. Todas as telas são mapeadas diretamente aos componentes React (`.tsx`) do projeto.

---

## 📱 Sumário
1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura de Telas & Componentes (`.tsx`)](#2-arquitetura-de-telas--componentes-tsx)
3. [Manual de Telas (Passo a Passo)](#3-manual-de-telas-passo-a-passo)
   - [Dashboard Principal (`MainScreen.tsx`)](#dashboard-principal-mainscreentsx)
   - [Criação de Novo Lote (`NewBatchScreen.tsx`)](#criação-de-novo-lote-newbatchscreentsx)
   - [Leitura de Campo / Scanner (`VerificationScanScreen.tsx`)](#leitura-de-campo--scanner-verificationscanscreentsx)
   - [Detalhes do Lote & Indicadores (`BatchDetailsScreen.tsx`)](#detalhes-do-lote--indicadores-batchdetailsscreentsx)
   - [Central de Importação (`ImportInventoryScreen.tsx`)](#central-de-importação-importinventoryscreentsx)
   - [Relatórios & Dossiê Executivo (`GeneralReportsScreen.tsx`)](#relatórios--dossiê-executivo-generalreportsscreentsx)
   - [Histórico de Operações & Rastreabilidade (`AuditLogScreen.tsx`)](#histórico-de-operações--rastreabilidade-auditlogscreentsx)
4. [Lógicas Especiais de Integração & Dados (Offline-First)](#4-lógicas-especiais-de-integração--dados-offline-first)
   - [Fatiamento e Transferência via QR Code (`qrChunker.ts`)](#fatiamento-e-transferência-via-qr-code-qrchunkerts)
   - [Central de Backup Inteligente: REPLACE vs. MERGE](#central-de-backup-inteligente-replace-vs-merge)
5. [Fluxos do Dia a Dia (Guia Prático)](#5-fluxos-do-dia-a-dia-guia-prático)

---

## 1. Visão Geral do Sistema

O aplicativo **Inventário & Auditoria Patrimonial** foi projetado para operar de forma totalmente **offline**, garantindo que equipes em armazéns, escritórios ou locais remotos sem internet consigam realizar auditorias de ativos físicos sem interrupções.

### Objetivos do Sistema:
* **Eliminar erros manuais** de digitação de códigos.
* **Controlar duplicidades** em tempo real no campo.
* **Garantir conciliação instantânea**: estatísticas imediatas de Ok, Faltante e Excedente.
* **Transferência sem fio**: sincronizar dados entre aparelhos 100% offline via QR Codes Multi-Chunk.

---

## 2. Arquitetura de Telas & Componentes (`.tsx`)

A estrutura do projeto segue o padrão de modularidade React, mapeando cada tela principal para seu respectivo arquivo `.tsx` em `src/components/`:

| Componente | Função Principal |
| :--- | :--- |
| `MainScreen.tsx` | Dashboard central com KPIs e atalhos rápidos |
| `BatchDetailsScreen.tsx` | Central de gestão do lote, barra de progresso e ações de controle |
| `GeneralReportsScreen.tsx` | Painel executivo global, análise de risco e gerador de Dossiê |
| `AuditResultsScreen.tsx` | Análise técnica de divergências e filtros por status do lote |
| `CameraScanner.tsx` | Motor de visão computacional (ML Kit) com feedback visual |
| `qrChunker.ts` | Lógica de fatiamento e fusão de dados JSON para transferência QR |
| `storage.ts` | Engine de persistência LocalStorage e regras de negócio de auditoria |

---

## 3. Manual de Telas (Passo a Passo)

### Dashboard Principal (`MainScreen.tsx`)
A primeira tela exibida. Atua como a torre de controle do operador.
* **KPIs Executivos**: Mostra o total de patrimônios, lotes pendentes e completas.
* **Atalhos Rápidos**: Botão "Nova Auditoria" e acessos à leitura sequencial e relatórios.
* **Auditorias Recentes**: Lista os últimos 3 lotes ativos para acesso imediato.

### Criação de Novo Lote (`NewBatchScreen.tsx`)
Organiza as leituras cronológica e geograficamente.
* **Auditoria / Verificação**: Exige Lista Mestra (ativos esperados). Calcula divergências.
* **Inventário Simples**: Contagem geral sem lista prévia.

### Leitura de Campo / Scanner (`VerificationScanScreen.tsx`)
A tela de campo mais utilizada. Ativa a câmera para bipe de patrimônios.
* **Bloqueio de Duplicidade**: Alerta sonoro/visual se o operador ler o mesmo ativo duas vezes.
* **Feedback Visual**: 🟢 **Verde** (Encontrado), 🔴 **Vermelho** (Faltante na lista), 🟠 **Laranja** (Sobra física).
* **Bulk Scan**: Suporte para ler um único QR Code contendo múltiplos números (separados por espaço ou vírgula).

### Detalhes do Lote & Indicadores (`BatchDetailsScreen.tsx`)
Visão analítica de cada lote individual.
* **Resumo da Auditoria**: Card unificado com barra segmentada tricolor e legenda profissional.
* **Recalcular Lógica**: Botão azul que força a re-sincronização total entre leituras e lista mestre.
* **Diagnóstico Dinâmico**: Algoritmo que imprime orientações de campo baseadas na acurácia atual.

---

## 4. Lógicas Especiais de Integração & Dados (Offline-First)

### A) Fatiamento e Transferência via QR Code (`qrChunker.ts`)
Para contornar o limite de caracteres de um QR Code comum, o sistema implementa o **Multi-Chunking**:
1. Dados JSON são fatiados em pedaços de ~350 caracteres.
2. O modal `QrCodeExportModal.tsx` exibe um carrossel de partes.
3. O receptor (`QrImportScannerScreen.tsx`) acumula as partes em qualquer ordem.
4. **Barra de Progresso Vivo**: O receptor vê em tempo real o percentual de recebimento (ex: 1/3, 2/3...).

### B) Central de Backup Inteligente (`SettingsScreen.tsx`)
Ao restaurar um arquivo `.json`, o usuário escolhe a estratégia de processamento no `BackupModal.tsx`:
* **Mesclar (MERGE)**: Adiciona os lotes e itens do backup aos dados atuais, renomeando lotes duplicados com o sufixo `(Importado)`. **Recomendado para consolidar dados de várias equipes.**
* **Substituir (REPLACE)**: Zera a base de dados local e carrega o backup limpo. Ideal para migrações de aparelho.

### C) Dossiê de Estudo & Diagnóstico (`GeneralReportsScreen.tsx`)
Um recurso Enterprise que gera um relatório formatado em texto contendo:
* **Nível de Risco Contábil**: Calculado automaticamente pela acurácia (Baixo, Médio, Elevado).
* **Diagnóstico por Prefixo**: Detecta perdas específicas em categorias de ativos (ex: PAT-, EQP-).
* **Checklist Pós-Auditoria**: Orientações automáticas para encerramento do processo.

---

## 5. Fluxos do Dia a Dia (Guia Prático)

### Consolidando dados de campo
1. Cada auditor exporta seu lote como **QR Code Mestre**.
2. O supervisor usa o **Importador de QR** para ler as partes de cada celular.
3. No final, o supervisor terá todos os lotes unificados em seu aparelho.
4. O supervisor gera o **Dossiê Executivo** e compartilha via WhatsApp ou E-mail com a gerência.

---
> [!TIP]
> **Manutenção**: Para limpar o aparelho após um projeto, utilize a opção "Zerar Aplicação" em Ajustes. Certifique-se de ter feito o backup JSON antes desta ação.
