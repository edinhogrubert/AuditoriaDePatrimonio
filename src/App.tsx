import React, { useState, useEffect } from 'react';
import { Screen, Batch, ScanItem, AppSettings } from './types';
import {
  getStoredBatches,
  getStoredScanItems,
  getStoredSettings,
  createBatch,
  deleteBatch,
  processScanItem,
  deleteScanItemAndSync,
  seedDemoData,
  addExpectedItemsToBatch,
} from './services/storage';

import { MainScreen } from './components/MainScreen';
import { ScanScreen } from './components/ScanScreen';
import { SequentialScanScreen } from './components/SequentialScanScreen';
import { BatchListScreen } from './components/BatchListScreen';
import { AssetsListScreen } from './components/AssetsListScreen';
import { NewBatchScreen } from './components/NewBatchScreen';
import { ImportInventoryScreen } from './components/ImportInventoryScreen';
import { BatchScanScreen } from './components/BatchScanScreen';
import { VerificationScanScreen } from './components/VerificationScanScreen';
import { BatchDetailsScreen } from './components/BatchDetailsScreen';
import { AuditResultsScreen } from './components/AuditResultsScreen';
import { ExportBatchesScreen } from './components/ExportBatchesScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { GeneralReportsScreen } from './components/GeneralReportsScreen';

import { QrImportScannerScreen } from './components/QrImportScannerScreen';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);
  const [qrImportBatchName, setQrImportBatchName] = useState<string>('Conferência QR');
  const [targetBatchId, setTargetBatchId] = useState<number | null>(null);
  const [batchListFilter, setBatchListFilter] = useState<'ALL' | 'COLLECTION' | 'VERIFICATION' | 'PENDING' | 'COMPLETED'>('ALL');

  const [batches, setBatches] = useState<Batch[]>([]);
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());

  const refreshData = () => {
    setBatches(getStoredBatches());
    setScanItems(getStoredScanItems());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [settings.theme]);

  const handleCreateCollectionBatch = (name: string, description: string) => {
    const newB = createBatch(name, description, 'COLLECTION');
    refreshData();
    setActiveBatchId(newB.id);
    setCurrentScreen('batch_scan');
  };

  const handleCreateVerificationBatch = (
    name: string,
    description: string,
    expectedItems: { barcode: string; description?: string; category?: string }[]
  ) => {
    const newB = createBatch(name, description, 'VERIFICATION', expectedItems);
    refreshData();
    setActiveBatchId(newB.id);
    setCurrentScreen('batch_details');
  };

  const handleAddExpectedToBatch = (
    batchId: number,
    items: { barcode: string; description?: string; category?: string }[]
  ) => {
    addExpectedItemsToBatch(batchId, items);
    refreshData();
    setActiveBatchId(batchId);
    setCurrentScreen('batch_details');
  };

  const handleDeleteBatch = (id: number) => {
    deleteBatch(id);
    refreshData();
    if (activeBatchId === id) {
      setActiveBatchId(null);
    }
  };

  const handleAddScanItem = (barcode: string, format: string) => {
    if (!activeBatchId) return;
    processScanItem(activeBatchId, barcode, format);
    refreshData();
  };

  const handleDeleteScanItem = (itemId: number) => {
    deleteScanItemAndSync(itemId);
    refreshData();
  };

  const handleResetData = () => {
    localStorage.setItem('inventario_batches_v2', '[]');
    localStorage.setItem('inventario_scan_items_v2', '[]');
    localStorage.setItem('inventario_expected_items_v2', '[]');
    refreshData();
    setCurrentScreen('menu');
  };

  const handleLoadDemo = () => {
    seedDemoData();
    refreshData();
    setCurrentScreen('menu');
    alert('Dados de demonstração carregados com sucesso.');
  };

  const handleOpenBatch = (batch: Batch) => {
    setActiveBatchId(batch.id);
    setCurrentScreen('batch_details');
  };

  const activeBatch = batches.find((b) => b.id === activeBatchId);
  const activeBatchItems = activeBatchId
    ? scanItems.filter((item) => item.batchId === activeBatchId)
    : [];

  return (
    <div className={`min-h-screen font-['Inter',sans-serif] transition-colors ${currentScreen === 'sequential_scan' || currentScreen === 'scan' || currentScreen === 'verification_scan' || (currentScreen === 'qr_import' && !activeBatchId) ? 'bg-transparent' : 'bg-[var(--bg-gradient)]'}`}>
      {currentScreen === 'menu' && (
        <MainScreen
          onNavigate={(screen, filter) => {
             if (filter) {
               setBatchListFilter(filter as any);
             } else {
               setBatchListFilter('ALL');
             }
             setCurrentScreen(screen as Screen);
          }}
          onOpenBatchDetails={(batchId) => {
            setActiveBatchId(batchId);
            setCurrentScreen('batch_details');
          }}
        />
      )}

      {currentScreen === 'scan' && (
        <ScanScreen onBack={() => setCurrentScreen('menu')} />
      )}

      {currentScreen === 'sequential_scan' && (
        <SequentialScanScreen onBack={() => setCurrentScreen('menu')} />
      )}

      {currentScreen === 'batch_list' && (
        <BatchListScreen
          batches={batches}
          initialFilter={batchListFilter}
          onBack={() => setCurrentScreen('menu')}
          onNewBatchClick={() => setCurrentScreen('new_batch')}
          onImportInventoryClick={() => {
            setTargetBatchId(null);
            setCurrentScreen('import_inventory');
          }}
          onBatchClick={handleOpenBatch}
          onDeleteBatch={handleDeleteBatch}
          onExportClick={() => setCurrentScreen('export_batches')}
        />
      )}

      {currentScreen === 'general_reports' && (
        <GeneralReportsScreen
          batches={batches}
          onBack={() => setCurrentScreen('menu')}
          onOpenBatchDetails={(batchId) => {
            setActiveBatchId(batchId);
            setCurrentScreen('batch_details');
          }}
          onNavigateBatchList={() => setCurrentScreen('batch_list')}
        />
      )}

      {currentScreen === 'assets_list' && (
        <AssetsListScreen
          onBack={() => setCurrentScreen('menu')}
          onOpenBatchDetails={(batchId) => {
            setActiveBatchId(batchId);
            setCurrentScreen('batch_details');
          }}
        />
      )}

      {currentScreen === 'new_batch' && (
        <NewBatchScreen
          onBack={() => setCurrentScreen('batch_list')}
          onCreateBatch={handleCreateCollectionBatch}
        />
      )}

      {currentScreen === 'import_inventory' && (
        <ImportInventoryScreen
          onBack={() => {
            if (targetBatchId) setCurrentScreen('batch_details');
            else setCurrentScreen('batch_list');
          }}
          onCreateVerificationBatch={handleCreateVerificationBatch}
          onAddExpectedToBatch={handleAddExpectedToBatch}
          onNavigateQrImport={(batchName, targetId) => {
            setQrImportBatchName(batchName);
            setTargetBatchId(targetId || null);
            setCurrentScreen('qr_import');
          }}
          onNavigate={(screen) => setCurrentScreen(screen as Screen)}
          onOpenBatchDetails={(batchId) => {
            setActiveBatchId(batchId);
            setCurrentScreen('audit_results');
          }}
          targetBatchId={targetBatchId}
          settings={settings}
        />
      )}

      {currentScreen === 'qr_import' && (
        <QrImportScannerScreen
          batchName={qrImportBatchName}
          onBack={() => setCurrentScreen('import_inventory')}
          onImported={(batchId) => {
            refreshData();
            setActiveBatchId(batchId);
            setCurrentScreen('batch_details');
          }}
          onAddExpectedToBatch={handleAddExpectedToBatch}
          targetBatchId={targetBatchId || undefined}
          settings={settings}
        />
      )}

      {currentScreen === 'batch_scan' && activeBatch && (
        <BatchScanScreen
          batch={activeBatch}
          scanItems={activeBatchItems}
          onBack={() => setCurrentScreen('batch_list')}
          onAddScanItem={handleAddScanItem}
          onViewDetails={() => setCurrentScreen('batch_details')}
        />
      )}

      {currentScreen === 'verification_scan' && activeBatch && (
        <VerificationScanScreen
          batch={activeBatch}
          onBack={() => setCurrentScreen('batch_list')}
          onViewAuditResults={() => setCurrentScreen('audit_results')}
        />
      )}

      {currentScreen === 'batch_details' && activeBatch && (
        <BatchDetailsScreen
          batch={activeBatch}
          scanItems={activeBatchItems}
          onBack={() => setCurrentScreen('batch_list')}
          onDone={() => setCurrentScreen('batch_list')}
          onContinueScanning={() => {
            if (activeBatch.type === 'VERIFICATION') {
               setCurrentScreen('verification_scan');
            } else {
               setCurrentScreen('batch_scan');
            }
          }}
          onImportMore={() => {
            setTargetBatchId(activeBatch.id);
            setCurrentScreen('import_inventory');
          }}
          onViewResults={() => setCurrentScreen('audit_results')}
          onRefresh={refreshData}
          onDeleteItem={handleDeleteScanItem}
        />
      )}

      {currentScreen === 'audit_results' && activeBatch && (
        <AuditResultsScreen
          batch={activeBatch}
          onBack={() => setCurrentScreen('batch_details')}
          onContinueScanning={() => setCurrentScreen('verification_scan')}
          onNavigate={(screen) => setCurrentScreen(screen as Screen)}
        />
      )}

      {currentScreen === 'export_batches' && (
        <ExportBatchesScreen
          batches={batches}
          allItems={scanItems}
          onBack={() => setCurrentScreen('batch_list')}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onUpdateSettings={(s) => setSettings(s)}
          onBack={() => setCurrentScreen('menu')}
          onResetData={handleResetData}
          onLoadDemo={handleLoadDemo}
        />
      )}
    </div>
  );
}

export default App;
