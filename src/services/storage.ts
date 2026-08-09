import { Batch, ScanItem, ExpectedItem, AppSettings, BatchType, AuditLog, AuditLogType } from '../types';

const BATCHES_KEY = 'inventario_batches_v2';
const SCAN_ITEMS_KEY = 'inventario_scan_items_v2';
const EXPECTED_ITEMS_KEY = 'inventario_expected_items_v2';
const SETTINGS_KEY = 'inventario_settings_v2';
const AUDIT_LOGS_KEY = 'inventario_audit_logs_v2';

// --- Audit Logs API ---
export const getStoredAuditLogs = (): AuditLog[] => {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to get audit logs', e);
    return [];
  }
};

export const saveAuditLogs = (logs: AuditLog[]) => {
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save audit logs', e);
  }
};

export const addAuditLog = (batchId: number, type: AuditLogType, barcode?: string, message: string = '') => {
  const logs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    batchId,
    timestamp: Date.now(),
    type,
    barcode,
    message,
  };
  saveAuditLogs([newLog, ...logs]);
};

export const getAuditLogsForBatch = (batchId: number): AuditLog[] => {
  return getStoredAuditLogs().filter(log => log.batchId === batchId);
};

export const exportAuditLogsToCsv = (batch: Batch) => {
  const logs = getAuditLogsForBatch(batch.id);
  let csvContent = 'Data,Hora,Evento,Patrimônio,Mensagem\n';

  logs.forEach(log => {
    const date = formatDateStr(log.timestamp);
    const time = formatTimeStr(log.timestamp);
    const barcode = log.barcode || '-';
    csvContent += `${date},${time},${log.type},"${barcode}","${log.message.replace(/"/g, '""')}"\n`;
  });

  downloadCsv(csvContent, `log_auditoria_${batch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.csv`);
};

// --- Batches API ---
export const getStoredBatches = (): Batch[] => {
  try {
    const data = localStorage.getItem(BATCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to get batches', e);
    return [];
  }
};

export const saveBatches = (batches: Batch[]) => {
  try {
    localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  } catch (e) {
    console.error('Failed to save batches', e);
  }
};

export const createBatch = (
  name: string,
  description: string = '',
  type: BatchType = 'COLLECTION',
  expectedList: { barcode: string; description?: string; category?: string }[] = []
): Batch => {
  const batches = getStoredBatches();
  const newBatch: Batch = {
    id: Date.now(),
    name: name.trim(),
    description: description.trim(),
    type,
    timestamp: Date.now(),
  };
  saveBatches([newBatch, ...batches]);

  if (type === 'VERIFICATION' && expectedList.length > 0) {
    const allExpected = getStoredExpectedItems();
    const newExpected: ExpectedItem[] = expectedList.map((item, index) => ({
      id: Date.now() + index + Math.floor(Math.random() * 1000),
      batchId: newBatch.id,
      barcode: item.barcode.trim(),
      description: item.description?.trim() || '',
      category: item.category?.trim() || '',
      isFound: false,
    }));
    saveExpectedItems([...allExpected, ...newExpected]);
    addAuditLog(newBatch.id, 'IMPORT_START', undefined, `Lote criado com ${newExpected.length} itens importados.`);
  }

  return newBatch;
};

export const deleteBatch = (batchId: number) => {
  saveBatches(getStoredBatches().filter((b) => b.id !== batchId));
  saveScanItems(getStoredScanItems().filter((i) => i.batchId !== batchId));
  saveExpectedItems(getStoredExpectedItems().filter((e) => e.batchId !== batchId));
  // Clean logs too
  saveAuditLogs(getStoredAuditLogs().filter(l => l.batchId !== batchId));
};

export const closeBatch = (batchId: number, reason?: string) => {
  const batches = getStoredBatches();
  const updated = batches.map((b) => {
    if (b.id === batchId) {
      addAuditLog(batchId, 'BATCH_CLOSED', undefined, `Lote encerrado. Motivo: ${reason || 'Não informado'}`);
      return {
        ...b,
        isClosed: true,
        closedReason: reason?.trim() || 'Concluído manualmente',
        closedAt: Date.now(),
      };
    }
    return b;
  });
  saveBatches(updated);
};

export const reopenBatch = (batchId: number) => {
  const batches = getStoredBatches();
  const updated = batches.map((b) => {
    if (b.id === batchId) {
      addAuditLog(batchId, 'BATCH_OPENED', undefined, 'Lote reaberto para novas edições.');
      return {
        ...b,
        isClosed: false,
        closedReason: undefined,
        closedAt: undefined,
      };
    }
    return b;
  });
  saveBatches(updated);
};

// --- Expected Items API ---
export const getStoredExpectedItems = (): ExpectedItem[] => {
  try {
    const data = localStorage.getItem(EXPECTED_ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to get expected items', e);
    return [];
  }
};

export const saveExpectedItems = (items: ExpectedItem[]) => {
  try {
    localStorage.setItem(EXPECTED_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save expected items', e);
  }
};

export const addExpectedItemsToBatch = (
  batchId: number,
  items: { barcode: string; description?: string; category?: string }[]
) => {
  const allExpected = getStoredExpectedItems();
  const existingForBatch = allExpected.filter(e => e.batchId === batchId);
  const existingBarcodes = new Set(existingForBatch.map(e => e.barcode.toLowerCase()));

  const newExpected: ExpectedItem[] = [];
  items.forEach((item, index) => {
    if (!existingBarcodes.has(item.barcode.toLowerCase().trim())) {
      newExpected.push({
        id: Date.now() + index + Math.floor(Math.random() * 10000),
        batchId: batchId,
        barcode: item.barcode.trim(),
        description: item.description?.trim() || 'Item de Inventário',
        category: item.category?.trim() || 'Sem Categoria',
        isFound: false,
      });
      existingBarcodes.add(item.barcode.toLowerCase().trim());
    }
  });

  if (newExpected.length > 0) {
    saveExpectedItems([...allExpected, ...newExpected]);
    addAuditLog(batchId, 'IMPORT_START', undefined, `Importação realizada: ${newExpected.length} novos itens adicionados.`);
  }
  return newExpected.length;
};

export const clearExpectedItemsForBatch = (batchId: number) => {
  const allExpected = getStoredExpectedItems();
  saveExpectedItems(allExpected.filter(e => e.batchId !== batchId));
  addAuditLog(batchId, 'ITEM_REMOVED', undefined, 'Lista mestre limpa completamente.');
};

// --- Scan Items API ---
export const getStoredScanItems = (): ScanItem[] => {
  try {
    const data = localStorage.getItem(SCAN_ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to get scan items', e);
    return [];
  }
};

export const saveScanItems = (items: ScanItem[]) => {
  try {
    localStorage.setItem(SCAN_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save scan items', e);
  }
};

export interface VerificationScanResult {
  status: 'FOUND' | 'DUPLICATE' | 'EXTRA' | 'ADDED';
  message: string;
  item: ScanItem;
  expectedItem?: ExpectedItem;
}

export const processScanItem = (
  batchId: number,
  barcode: string,
  format: string
): VerificationScanResult => {
  const code = barcode.trim();
  const batches = getStoredBatches();
  const batch = batches.find((b) => b.id === batchId);

  const scanItems = getStoredScanItems();
  const alreadyScanned = scanItems.some(
    (i) => i.batchId === batchId && i.barcode.toLowerCase() === code.toLowerCase()
  );

  const newScanItem: ScanItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    batchId,
    barcode: code,
    format: format.toUpperCase(),
    timestamp: Date.now(),
  };

  // If simple collection batch
  if (!batch || batch.type === 'COLLECTION') {
    if (alreadyScanned) {
      addAuditLog(batchId, 'DUPLICATE_BLOCK', code, 'Tentativa de leitura duplicada bloqueada (Coleta).');
      return {
        status: 'DUPLICATE',
        message: 'Atenção: Este item já foi lido/coletado neste lote!',
        item: newScanItem,
      };
    }
    saveScanItems([newScanItem, ...scanItems]);
    return {
      status: 'ADDED',
      message: 'Item adicionado ao lote',
      item: newScanItem,
    };
  }

  // If Verification / Audit batch
  const expectedItems = getStoredExpectedItems();
  const matchedExpected = expectedItems.find(
    (exp) => exp.batchId === batchId && exp.barcode.toLowerCase() === code.toLowerCase()
  );

  if (matchedExpected) {
    if (matchedExpected.isFound || alreadyScanned) {
      addAuditLog(batchId, 'DUPLICATE_BLOCK', code, 'Tentativa de leitura duplicada bloqueada (Conferência).');
      return {
        status: 'DUPLICATE',
        message: 'Atenção: Item já havia sido verificado anteriormente!',
        item: newScanItem,
        expectedItem: matchedExpected,
      };
    } else {
      const updatedExpected = expectedItems.map((exp) =>
        exp.id === matchedExpected.id
          ? { ...exp, isFound: true, timestampFound: Date.now() }
          : exp
      );
      saveExpectedItems(updatedExpected);
      saveScanItems([newScanItem, ...scanItems]);
      return {
        status: 'FOUND',
        message: 'Sucesso: Patrimônio localizado na lista de auditoria!',
        item: newScanItem,
        expectedItem: { ...matchedExpected, isFound: true, timestampFound: Date.now() },
      };
    }
  } else {
    if (alreadyScanned) {
      addAuditLog(batchId, 'DUPLICATE_BLOCK', code, 'Tentativa de leitura duplicada bloqueada (Sobra).');
      return {
        status: 'DUPLICATE',
        message: 'Atenção: Esta sobra de estoque já foi lida anteriormente!',
        item: newScanItem,
      };
    }
    saveScanItems([newScanItem, ...scanItems]);
    return {
      status: 'EXTRA',
      message: 'Aviso: Código escaneado não consta na lista esperada (Sobra)',
      item: newScanItem,
    };
  }
};

export const deleteScanItemAndSync = (itemId: number) => {
  const scanItems = getStoredScanItems();
  const itemToDelete = scanItems.find((i) => i.id === itemId);
  if (!itemToDelete) return;

  const updatedScanItems = scanItems.filter((i) => i.id !== itemId);
  saveScanItems(updatedScanItems);
  addAuditLog(itemToDelete.batchId, 'ITEM_REMOVED', itemToDelete.barcode, 'Leitura removida manualmente pelo usuário.');

  const remainingSameBarcodeScans = updatedScanItems.filter(
    (i) => i.batchId === itemToDelete.batchId && i.barcode === itemToDelete.barcode
  );

  if (remainingSameBarcodeScans.length === 0) {
    const expectedItems = getStoredExpectedItems();
    const updatedExpected = expectedItems.map((exp) => {
      if (exp.batchId === itemToDelete.batchId && exp.barcode.toLowerCase() === itemToDelete.barcode.toLowerCase()) {
        return { ...exp, isFound: false, timestampFound: undefined };
      }
      return exp;
    });
    saveExpectedItems(updatedExpected);
  }
};

export const clearScanItemsForBatch = (batchId: number) => {
  const allScans = getStoredScanItems();
  saveScanItems(allScans.filter(s => s.batchId !== batchId));

  const allExpected = getStoredExpectedItems();
  const updatedExpected = allExpected.map(exp => {
    if (exp.batchId === batchId) {
      return { ...exp, isFound: false, timestampFound: undefined };
    }
    return exp;
  });
  saveExpectedItems(updatedExpected);
  addAuditLog(batchId, 'ITEM_REMOVED', undefined, 'Todo o histórico de leituras foi limpo.');
};

export const deleteItemFromBatch = (
  batchId: number,
  barcode: string,
  scanId?: number,
  expectedItemId?: number
) => {
  const scanItems = getStoredScanItems();
  const updatedScans = scanItems.filter((s) => {
    if (scanId) return s.id !== scanId;
    return !(s.batchId === batchId && s.barcode.toLowerCase() === barcode.toLowerCase());
  });
  saveScanItems(updatedScans);

  const expectedItems = getStoredExpectedItems();
  const updatedExpected = expectedItems.filter((e) => {
    if (expectedItemId) return e.id !== expectedItemId;
    return !(e.batchId === batchId && e.barcode.toLowerCase() === barcode.toLowerCase());
  });
  saveExpectedItems(updatedExpected);
  addAuditLog(batchId, 'ITEM_REMOVED', barcode, 'Patrimônio removido do lote.');
};

// --- Helpers & Statistics ---
export const getScanItemsForBatch = (batchId: number): ScanItem[] => {
  return getStoredScanItems().filter((item) => item.batchId === batchId);
};

export const getScanCountForBatch = (batchId: number): number => {
  return getScanItemsForBatch(batchId).length;
};

export const getExpectedItemsForBatch = (batchId: number): ExpectedItem[] => {
  return getStoredExpectedItems().filter((item) => item.batchId === batchId);
};

export interface AuditStats {
  totalExpected: number;
  foundCount: number;
  missingCount: number;
  extraCount: number;
  progressPercent: number;
}

export const reconcileBatchAudit = (batchId: number): AuditStats => {
  const expectedItems = getStoredExpectedItems();
  const scanItems = getScanItemsForBatch(batchId);
  const scannedBarcodesMap = new Map<string, number>();

  scanItems.forEach((scan) => {
    const key = scan.barcode.trim().toLowerCase();
    if (!scannedBarcodesMap.has(key) || scan.timestamp < scannedBarcodesMap.get(key)!) {
      scannedBarcodesMap.set(key, scan.timestamp);
    }
  });

  let hasExpectedForBatch = false;
  const updatedExpected = expectedItems.map((exp) => {
    if (exp.batchId === batchId) {
      hasExpectedForBatch = true;
      const key = exp.barcode.trim().toLowerCase();
      const matchTimestamp = scannedBarcodesMap.get(key);
      if (matchTimestamp !== undefined) {
        return { ...exp, isFound: true, timestampFound: matchTimestamp };
      } else {
        return { ...exp, isFound: false, timestampFound: undefined };
      }
    }
    return exp;
  });

  saveExpectedItems(updatedExpected);

  // If batch has expected items, ensure batch type is 'VERIFICATION'
  if (hasExpectedForBatch) {
    const batches = getStoredBatches();
    const updatedBatches = batches.map((b) =>
      b.id === batchId && b.type !== 'VERIFICATION' ? { ...b, type: 'VERIFICATION' as const } : b
    );
    saveBatches(updatedBatches);
  }

  addAuditLog(
    batchId,
    'AUDIT_RECONCILED',
    '',
    'Recálculo e conciliação completa da lógica do negócio (TODOS, OK, FALTANTE, EXTRA)'
  );

  return getAuditStatsForBatch(batchId);
};

export const getAuditStatsForBatch = (batchId: number): AuditStats => {
  const expected = getExpectedItemsForBatch(batchId);
  const scans = getScanItemsForBatch(batchId);

  const totalExpected = expected.length;
  const foundCount = expected.filter((e) => e.isFound).length;
  const missingCount = totalExpected - foundCount;

  const expectedBarcodes = new Set(expected.map((e) => e.barcode.toLowerCase()));
  const extraScans = scans.filter((s) => !expectedBarcodes.has(s.barcode.toLowerCase()));
  const extraCount = new Set(extraScans.map((s) => s.barcode.toLowerCase())).size;

  const progressPercent = totalExpected > 0 ? Math.round((foundCount / totalExpected) * 100) : 0;

  return { totalExpected, foundCount, missingCount, extraCount, progressPercent };
};

export const getUniqueCategories = (): string[] => {
  const items = getStoredExpectedItems();
  const cats = items.map(i => i.category).filter((c): c is string => !!c && c.trim().length > 0);
  return Array.from(new Set(cats)).sort();
};

export const getUniqueDescriptions = (): string[] => {
  const items = getStoredExpectedItems();
  const descs = items.map(i => i.description).filter((d): d is string => !!d && d.trim().length > 0);
  return Array.from(new Set(descs)).sort();
};

export interface AssetRecord {
  id: string;
  barcode: string;
  description: string;
  category: string;
  batchId: number;
  batchName: string;
  batchType: BatchType;
  status: 'ENCONTRADO' | 'PENDENTE' | 'SOBRA' | 'COLETADO';
  timestamp?: number;
}

export const getAllAssetRecords = (): AssetRecord[] => {
  const batches = getStoredBatches();
  const batchMap = new Map(batches.map(b => [b.id, b]));
  const expectedItems = getStoredExpectedItems();
  const scanItems = getStoredScanItems();
  const records: AssetRecord[] = [];

  expectedItems.forEach(exp => {
    const batch = batchMap.get(exp.batchId);
    records.push({
      id: `exp-${exp.id}`,
      barcode: exp.barcode,
      description: exp.description || 'Patrimônio de Auditoria',
      category: exp.category || 'Geral',
      batchId: exp.batchId,
      batchName: batch ? batch.name : `Lote #${exp.batchId}`,
      batchType: 'VERIFICATION',
      status: exp.isFound ? 'ENCONTRADO' : 'PENDENTE',
      timestamp: exp.timestampFound,
    });
  });

  scanItems.forEach(scan => {
    const batch = batchMap.get(scan.batchId);
    const batchType = batch ? batch.type : 'COLLECTION';
    if (batchType === 'COLLECTION') {
      records.push({
        id: `scan-${scan.id}`,
        barcode: scan.barcode,
        description: 'Item Coletado',
        category: 'Coleta Direta',
        batchId: scan.batchId,
        batchName: batch ? batch.name : `Lote #${scan.batchId}`,
        batchType: 'COLLECTION',
        status: 'COLETADO',
        timestamp: scan.timestamp,
      });
    } else {
      const matchedExpected = expectedItems.find(
        e => e.batchId === scan.batchId && e.barcode.toLowerCase() === scan.barcode.toLowerCase()
      );
      if (!matchedExpected) {
        records.push({
          id: `extra-${scan.id}`,
          barcode: scan.barcode,
          description: 'Sobra de Estoque / Não cadastrado',
          category: 'Extra',
          batchId: scan.batchId,
          batchName: batch ? batch.name : `Lote #${scan.batchId}`,
          batchType: 'VERIFICATION',
          status: 'SOBRA',
          timestamp: scan.timestamp,
        });
      }
    }
  });
  return records;
};

// --- CSV Export Helpers ---
export const formatDateStr = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const formatTimeStr = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

const downloadCsv = (csvContent: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportSingleBatchToCsv = (batch: Batch, items: ScanItem[]) => {
  let csvContent = 'Index,Tipo,Conteúdo,Data,Hora\n';
  items.forEach((item, index) => {
    csvContent += `${index + 1},${item.format},"${item.barcode}",${formatDateStr(item.timestamp)},${formatTimeStr(item.timestamp)}\n`;
  });
  downloadCsv(csvContent, `inventario_${batch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
};

export const exportAuditReportCsv = (batch: Batch, filteredExpected?: ExpectedItem[], filteredExtras?: ScanItem[]) => {
  const expected = filteredExpected || getExpectedItemsForBatch(batch.id);
  const scans = getScanItemsForBatch(batch.id);
  let csvContent = 'Status,Código/Patrimônio,Descrição,Categoria,Hora de Localização\n';

  expected.forEach((item) => {
    const time = item.timestampFound ? `${formatDateStr(item.timestampFound)} ${formatTimeStr(item.timestampFound)}` : '-';
    csvContent += `${item.isFound ? 'ENCONTRADO' : 'FALTANTE'},"${item.barcode}","${(item.description || '').replace(/"/g, '""')}","${(item.category || '').replace(/"/g, '""')}",${time}\n`;
  });

  const finalExtras = filteredExtras || (filteredExpected ? [] : scans.filter(s => {
      const expectedBarcodes = new Set(getExpectedItemsForBatch(batch.id).map(e => e.barcode.toLowerCase()));
      return !expectedBarcodes.has(s.barcode.toLowerCase());
  }));

  finalExtras.forEach((scan) => {
    csvContent += `SOBRA DE ESTOQUE,"${scan.barcode}","Item não esperado","Extra",${formatDateStr(scan.timestamp)} ${formatTimeStr(scan.timestamp)}\n`;
  });

  downloadCsv(csvContent, `relatorio_auditoria_${batch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
};

export const exportMultipleBatchesToCsv = (selectedBatches: Batch[], allItems: ScanItem[]) => {
  let csvContent = 'Lote,Tipo,Index,Formato,Conteúdo,Data,Hora\n';
  selectedBatches.forEach((batch) => {
    const batchItems = allItems.filter((item) => item.batchId === batch.id);
    batchItems.forEach((item, index) => {
      csvContent += `"${batch.name}",${batch.type},${index + 1},${item.format},"${item.barcode}",${formatDateStr(item.timestamp)},${formatTimeStr(item.timestamp)}\n`;
    });
  });
  downloadCsv(csvContent, `export_consolidado_${Date.now()}.csv`);
};

// --- Settings & Maintenance ---
export const seedDemoData = () => {
  const now = Date.now();
  const day = 86400000;

  // 1. Clear everything
  localStorage.setItem(BATCHES_KEY, '[]');
  localStorage.setItem(SCAN_ITEMS_KEY, '[]');
  localStorage.setItem(EXPECTED_ITEMS_KEY, '[]');
  localStorage.setItem(AUDIT_LOGS_KEY, '[]');

  // 2. Create Batches
  const demoBatches: Batch[] = [
    {
      id: 1001,
      name: 'Auditoria de TI - Setor 01',
      description: 'Conferência trimestral de ativos de informática',
      type: 'VERIFICATION',
      timestamp: now - day,
    },
    {
      id: 1002,
      name: 'Coleta Almoxarifado central',
      description: 'Inventário rotativo de insumos',
      type: 'COLLECTION',
      timestamp: now,
    }
  ];

  // 3. Create Expected Items for Batch 1001
  const demoExpected: ExpectedItem[] = [
    { id: 2001, batchId: 1001, barcode: 'PAT-101', description: 'Notebook Dell Latitude', category: 'TI', isFound: true, timestampFound: now - day + 3600000 },
    { id: 2002, batchId: 1001, barcode: 'PAT-102', description: 'Monitor LG 24"', category: 'TI', isFound: true, timestampFound: now - day + 7200000 },
    { id: 2003, batchId: 1001, barcode: 'PAT-103', description: 'Teclado Mecânico Logitech', category: 'Periféricos', isFound: false },
    { id: 2004, batchId: 1001, barcode: 'PAT-104', description: 'Mouse Sem Fio Razer', category: 'Periféricos', isFound: false },
    { id: 2005, batchId: 1001, barcode: 'PAT-105', description: 'Cadeira Ergonômica', category: 'Móveis', isFound: true, timestampFound: now - day + 10000000 },
  ];

  // 4. Create Scanned Items
  const demoScans: ScanItem[] = [
    // Scans for Audit (Found items)
    { id: 3001, batchId: 1001, barcode: 'PAT-101', format: 'CODE_128', timestamp: now - day + 3600000 },
    { id: 3002, batchId: 1001, barcode: 'PAT-102', format: 'CODE_128', timestamp: now - day + 7200000 },
    { id: 3003, batchId: 1001, barcode: 'PAT-105', format: 'CODE_128', timestamp: now - day + 10000000 },
    // One EXTRA item (Sobra)
    { id: 3004, batchId: 1001, barcode: 'PAT-999', format: 'CODE_128', timestamp: now - day + 12000000 },

    // Scans for Collection
    { id: 3005, batchId: 1002, barcode: 'ITEM-001', format: 'QR_CODE', timestamp: now - 1800000 },
    { id: 3006, batchId: 1002, barcode: 'ITEM-002', format: 'QR_CODE', timestamp: now - 1200000 },
    { id: 3007, batchId: 1002, barcode: 'ITEM-003', format: 'QR_CODE', timestamp: now - 600000 },
  ];

  // 5. Create Audit Logs
  const demoLogs: AuditLog[] = [
    { id: 4001, batchId: 1001, timestamp: now - day, type: 'IMPORT_START', message: 'Importação inicial de 5 ativos realizada.' },
    { id: 4002, batchId: 1001, timestamp: now - day + 5000000, type: 'DUPLICATE_BLOCK', barcode: 'PAT-101', message: 'Tentativa de leitura duplicada bloqueada pelo sistema.' },
    { id: 4003, batchId: 1001, timestamp: now - day + 15000000, type: 'ITEM_REMOVED', barcode: 'PAT-000', message: 'Removido teste de cadastro manual.' },
  ];

  localStorage.setItem(BATCHES_KEY, JSON.stringify(demoBatches));
  localStorage.setItem(SCAN_ITEMS_KEY, JSON.stringify(demoScans));
  localStorage.setItem(EXPECTED_ITEMS_KEY, JSON.stringify(demoExpected));
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(demoLogs));
};

export const getStoredSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    const parsed = data ? JSON.parse(data) : {};
    return {
      soundEnabled: true, vibrationEnabled: true, continuousScan: true, scanBeep: true,
      cameraResolution: '1080p', autoRemoveDuplicates: true, theme: 'dark', deletePermission: 'LOCKED',
      ...parsed
    };
  } catch (e) {
    return { soundEnabled: true, vibrationEnabled: true, continuousScan: true, scanBeep: true, cameraResolution: '1080p', autoRemoveDuplicates: true, theme: 'dark', deletePermission: 'LOCKED' };
  }
};

export const saveSettings = (settings: AppSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

export const consumeDeletePermissionOnce = () => {
  const settings = getStoredSettings();
  if (settings.deletePermission === 'ONCE') {
    saveSettings({ ...settings, deletePermission: 'LOCKED' });
    return true;
  }
  return settings.deletePermission === 'ALWAYS';
};
