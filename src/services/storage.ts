import { Batch, ScanItem, ExpectedItem, AppSettings, BatchType } from '../types';

const BATCHES_KEY = 'inventario_batches_v2';
const SCAN_ITEMS_KEY = 'inventario_scan_items_v2';
const EXPECTED_ITEMS_KEY = 'inventario_expected_items_v2';
const SETTINGS_KEY = 'inventario_settings_v2';

// Add Expected Items to an existing Batch
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
  }
  return newExpected.length;
};

// Clear all expected items for a batch
export const clearExpectedItemsForBatch = (batchId: number) => {
  const allExpected = getStoredExpectedItems();
  saveExpectedItems(allExpected.filter(e => e.batchId !== batchId));
};

// Clear all scanned items for a batch
export const clearScanItemsForBatch = (batchId: number) => {
  const allScans = getStoredScanItems();
  saveScanItems(allScans.filter(s => s.batchId !== batchId));

  // Also reset 'isFound' status for all expected items in this batch
  const allExpected = getStoredExpectedItems();
  const updatedExpected = allExpected.map(exp => {
    if (exp.batchId === batchId) {
      return { ...exp, isFound: false, timestampFound: undefined };
    }
    return exp;
  });
  saveExpectedItems(updatedExpected);
};

// Seed initial demo data for demonstration
const SEED_BATCHES: Batch[] = [
  {
    id: 1,
    name: 'Inventário Geral de TI',
    description: 'Coleta de ativos e periféricos',
    type: 'COLLECTION',
    timestamp: Date.now() - 86400000 * 3,
  },
  {
    id: 2,
    name: 'Conferência Patrimonial - Bloco A',
    description: 'Auditoria de bens do setor administrativo',
    type: 'VERIFICATION',
    timestamp: Date.now() - 86400000 * 1,
  },
];

const SEED_SCAN_ITEMS: ScanItem[] = [
  {
    id: 101,
    batchId: 1,
    barcode: 'PAT-7891000123',
    format: 'CODE 128',
    timestamp: Date.now() - 86400000 * 3 + 3600000,
  },
  {
    id: 102,
    batchId: 1,
    barcode: 'PAT-7891000124',
    format: 'CODE 128',
    timestamp: Date.now() - 86400000 * 3 + 7200000,
  },
  {
    id: 201,
    batchId: 2,
    barcode: 'PAT-1001',
    format: 'CODE 128',
    timestamp: Date.now() - 3600000 * 4,
  },
  {
    id: 202,
    batchId: 2,
    barcode: 'PAT-1002',
    format: 'CODE 128',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 203,
    batchId: 2,
    barcode: 'PAT-9999', // Extra / Sobra
    format: 'CODE 128',
    timestamp: Date.now() - 3600000 * 1,
  },
];

const SEED_EXPECTED_ITEMS: ExpectedItem[] = [
  {
    id: 301,
    batchId: 2,
    barcode: 'PAT-1001',
    description: 'Notebook Dell Latitude 5420',
    category: 'TI',
    isFound: true,
    timestampFound: Date.now() - 3600000 * 4,
  },
  {
    id: 302,
    batchId: 2,
    barcode: 'PAT-1002',
    description: 'Monitor LG 29 UltraWide',
    category: 'TI',
    isFound: true,
    timestampFound: Date.now() - 3600000 * 2,
  },
  {
    id: 303,
    batchId: 2,
    barcode: 'PAT-1003',
    description: 'Cadeira Ergonômica Flexform',
    category: 'Mobiliário',
    isFound: false,
  },
  {
    id: 304,
    batchId: 2,
    barcode: 'PAT-1004',
    description: 'Nobreak SMS 1200VA',
    category: 'TI',
    isFound: false,
  },
  {
    id: 305,
    batchId: 2,
    barcode: 'PAT-1005',
    description: 'Projetor Epson PowerLite',
    category: 'Audiovisual',
    isFound: false,
  },
];

// Batches API
export const seedDemoData = () => {
  localStorage.setItem(BATCHES_KEY, JSON.stringify(SEED_BATCHES));
  localStorage.setItem(SCAN_ITEMS_KEY, JSON.stringify(SEED_SCAN_ITEMS));
  localStorage.setItem(EXPECTED_ITEMS_KEY, JSON.stringify(SEED_EXPECTED_ITEMS));
};

export const getStoredBatches = (): Batch[] => {
  try {
    const data = localStorage.getItem(BATCHES_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
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

// Scan Items API
export const getStoredScanItems = (): ScanItem[] => {
  try {
    const data = localStorage.getItem(SCAN_ITEMS_KEY);
    if (!data) return [];
    return JSON.parse(data);
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

// Expected Items API (Conferência / Auditoria)
export const getStoredExpectedItems = (): ExpectedItem[] => {
  try {
    const data = localStorage.getItem(EXPECTED_ITEMS_KEY);
    if (!data) return [];
    return JSON.parse(data);
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

// Create Batch
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
  }

  return newBatch;
};

// Delete Batch
export const deleteBatch = (batchId: number) => {
  saveBatches(getStoredBatches().filter((b) => b.id !== batchId));
  saveScanItems(getStoredScanItems().filter((i) => i.batchId !== batchId));
  saveExpectedItems(getStoredExpectedItems().filter((e) => e.batchId !== batchId));
};

// Process Scan Item for Verification or Collection Batch
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
  const newScanItem: ScanItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    batchId,
    barcode: code,
    format: format.toUpperCase(),
    timestamp: Date.now(),
  };

  // If simple collection batch
  if (!batch || batch.type === 'COLLECTION') {
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
    if (matchedExpected.isFound) {
      // Already found previously
      saveScanItems([newScanItem, ...scanItems]);
      return {
        status: 'DUPLICATE',
        message: 'Atenção: Item já havia sido verificado anteriormente!',
        item: newScanItem,
        expectedItem: matchedExpected,
      };
    } else {
      // First time found!
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
    // Extra item / Sobra de estoque
    saveScanItems([newScanItem, ...scanItems]);
    return {
      status: 'EXTRA',
      message: 'Aviso: Código escaneado não consta na lista esperada (Sobra)',
      item: newScanItem,
    };
  }
};

// Delete Scan Item & Sync Audit status
export const deleteScanItemAndSync = (itemId: number) => {
  const scanItems = getStoredScanItems();
  const itemToDelete = scanItems.find((i) => i.id === itemId);
  if (!itemToDelete) return;

  const updatedScanItems = scanItems.filter((i) => i.id !== itemId);
  saveScanItems(updatedScanItems);

  // Check if there are other scans for this same barcode in the same batch
  const remainingSameBarcodeScans = updatedScanItems.filter(
    (i) => i.batchId === itemToDelete.batchId && i.barcode === itemToDelete.barcode
  );

  // If no remaining scans for this code, mark expected item back to unfound
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

// Helpers & Statistics
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

export const getAuditStatsForBatch = (batchId: number): AuditStats => {
  const expected = getExpectedItemsForBatch(batchId);
  const scans = getScanItemsForBatch(batchId);

  const totalExpected = expected.length;
  const foundCount = expected.filter((e) => e.isFound).length;
  const missingCount = totalExpected - foundCount;

  // Extra items are scans that don't match any expected barcode
  const expectedBarcodes = new Set(expected.map((e) => e.barcode.toLowerCase()));
  const extraScans = scans.filter((s) => !expectedBarcodes.has(s.barcode.toLowerCase()));
  // Unique extra barcodes
  const extraCount = new Set(extraScans.map((s) => s.barcode.toLowerCase())).size;

  const progressPercent = totalExpected > 0 ? Math.round((foundCount / totalExpected) * 100) : 0;

  return {
    totalExpected,
    foundCount,
    missingCount,
    extraCount,
    progressPercent,
  };
};

// Data retrieval for suggestions
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

// CSV Export Helpers
export const formatDateStr = (timestamp: number): string => {
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatTimeStr = (timestamp: number): string => {
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const exportSingleBatchToCsv = (batch: Batch, items: ScanItem[]) => {
  let csvContent = 'Index,Tipo,Conteúdo,Data,Hora\n';
  items.forEach((item, index) => {
    const date = formatDateStr(item.timestamp);
    const time = formatTimeStr(item.timestamp);
    const escapedBarcode = item.barcode.includes(',') ? `"${item.barcode}"` : item.barcode;
    csvContent += `${index + 1},${item.format},${escapedBarcode},${date},${time}\n`;
  });

  downloadCsv(csvContent, `inventario_${batch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.csv`);
};

export const exportAuditReportCsv = (batch: Batch, filteredExpected?: ExpectedItem[], filteredExtras?: ScanItem[]) => {
  const expected = filteredExpected || getExpectedItemsForBatch(batch.id);
  const scans = getScanItemsForBatch(batch.id);

  let csvContent = 'Status,Código/Patrimônio,Descrição,Categoria,Hora de Localização\n';

  // Expected items
  expected.forEach((item) => {
    const status = item.isFound ? 'ENCONTRADO' : 'FALTANTE';
    const time = item.timestampFound ? `${formatDateStr(item.timestampFound)} ${formatTimeStr(item.timestampFound)}` : '-';
    const desc = item.description ? `"${item.description.replace(/"/g, '""')}"` : 'N/A';
    const cat = item.category ? `"${item.category.replace(/"/g, '""')}"` : 'N/A';
    csvContent += `${status},"${item.barcode}",${desc},${cat},${time}\n`;
  });

  // Extra items (Sobras)
  const finalExtras = filteredExtras || (filteredExpected ? [] : scans.filter(s => {
      const expectedBarcodes = new Set(getExpectedItemsForBatch(batch.id).map(e => e.barcode.toLowerCase()));
      return !expectedBarcodes.has(s.barcode.toLowerCase());
  }));

  if (finalExtras.length > 0) {
      const uniqueExtras = Array.from(new Set(finalExtras.map((s) => s.barcode)));
      uniqueExtras.forEach((code) => {
        const scan = finalExtras.find((s) => s.barcode === code);
        const time = scan ? `${formatDateStr(scan.timestamp)} ${formatTimeStr(scan.timestamp)}` : '-';
        csvContent += `SOBRA DE ESTOQUE,"${code}","Item não constava na lista esperada",${time}\n`;
      });
  }

  downloadCsv(csvContent, `relatorio_conference_${batch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.csv`);
};

export const exportMultipleBatchesToCsv = (selectedBatches: Batch[], allItems: ScanItem[]) => {
  let csvContent = 'Lote,Tipo,Index,Formato,Conteúdo,Data,Hora\n';
  selectedBatches.forEach((batch) => {
    const batchItems = allItems.filter((item) => item.batchId === batch.id);
    batchItems.forEach((item, index) => {
      const date = formatDateStr(item.timestamp);
      const time = formatTimeStr(item.timestamp);
      const escapedBarcode = item.barcode.includes(',') ? `"${item.barcode}"` : item.barcode;
      const escapedBatchName = batch.name.includes(',') ? `"${batch.name}"` : batch.name;
      csvContent += `${escapedBatchName},${batch.type},${index + 1},${item.format},${escapedBarcode},${date},${time}\n`;
    });
  });

  downloadCsv(csvContent, `inventario_multiplo_${Date.now()}.csv`);
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

// Settings API
export const getStoredSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to get settings', e);
  }
  return {
    soundEnabled: true,
    vibrationEnabled: true,
    continuousScan: true,
    scanBeep: true,
    cameraResolution: '1080p',
    autoRemoveDuplicates: true,
    theme: 'dark',
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
