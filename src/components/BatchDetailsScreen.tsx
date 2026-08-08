import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Package,
  Calendar,
  Clock,
  QrCode,
  Download,
  Trash2,
  BarChart3,
  FilePlus2,
  ScanLine,
  Keyboard,
  X,
} from 'lucide-react';
import { Batch, ScanItem, ExpectedItem } from '../types';
import {
  formatDateStr,
  formatTimeStr,
  exportSingleBatchToCsv,
  getExpectedItemsForBatch,
  clearExpectedItemsForBatch,
  clearScanItemsForBatch,
  processScanItem,
  addExpectedItemsToBatch,
} from '../services/storage';

interface BatchDetailsScreenProps {
  batch: Batch;
  scanItems: ScanItem[];
  onBack: () => void;
  onDone: () => void;
  onContinueScanning: () => void;
  onImportMore: () => void;
  onViewResults: () => void;
  onRefresh: () => void;
  onDeleteItem?: (itemId: number) => void;
}

export const BatchDetailsScreen: React.FC<BatchDetailsScreenProps> = ({
  batch,
  scanItems,
  onBack,
  onDone,
  onContinueScanning,
  onImportMore,
  onViewResults,
  onRefresh,
  onDeleteItem,
}) => {
  const [manualMasterOpen, setManualMasterOpen] = useState(false);
  const [manualScanOpen, setManualScanOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const expectedItems = getExpectedItemsForBatch(batch.id);
  const totalCount = batch.type === 'VERIFICATION' ? expectedItems.length : scanItems.length;

  const handleExport = () => {
    exportSingleBatchToCsv(batch, scanItems);
  };

  const handleClearMaster = () => {
    if (confirm('ATENÇÃO: Deseja apagar TODOS os itens da lista mestre (o que deve ser procurado)?')) {
      clearExpectedItemsForBatch(batch.id);
      onRefresh();
    }
  };

  const handleClearScans = () => {
    if (confirm('ATENÇÃO: Deseja apagar TODO o histórico de leituras realizadas?')) {
      clearScanItemsForBatch(batch.id);
      onRefresh();
    }
  };

  const handleManualMasterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      addExpectedItemsToBatch(batch.id, [{ barcode: manualCode.trim() }]);
      setManualCode('');
      setManualMasterOpen(false);
      onRefresh();
    }
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processScanItem(batch.id, manualCode.trim(), 'MANUAL');
      setManualCode('');
      setManualScanOpen(false);
      onRefresh();
    }
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col max-w-md mx-auto p-5 select-none relative pb-12 border-x border-[var(--border-color)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-[var(--text-primary)] truncate max-w-[200px] uppercase tracking-tight">
            {batch.name}
          </h1>
        </div>
        <button
          onClick={handleExport}
          className="p-2.5 rounded-full bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border border-[var(--color-emerald)]/20 hover:bg-[var(--color-emerald)]/20 active:scale-95 transition-all shadow-sm"
          title="Exportar"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="py-7 space-y-7 flex-1 overflow-hidden flex flex-col">
        {/* Detail Header Cards + VIEW Button */}
        <div className="flex gap-3 items-stretch shrink-0">
          <div className="grid grid-cols-3 gap-2.5 flex-1">
            <div className="card-elevated p-3.5 flex flex-col justify-between shadow-md">
              <Package className="w-4 h-4 text-[var(--color-emerald)] mb-1" />
              <div>
                <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.1em] block">Ativos</span>
                <span className="text-base font-black text-[var(--text-primary)] leading-tight">{totalCount}</span>
              </div>
            </div>
            <div className="card-elevated p-3.5 flex flex-col justify-between shadow-md">
              <Calendar className="w-4 h-4 text-[var(--color-blue)] mb-1" />
              <div>
                <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.1em] block">Data</span>
                <span className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-tight block">{formatDateStr(batch.timestamp)}</span>
              </div>
            </div>
            <div className="card-elevated p-3.5 flex flex-col justify-between shadow-md">
              <Clock className="w-4 h-4 text-purple-400 mb-1" />
              <div>
                <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.1em] block">Hora</span>
                <span className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-tight block">{formatTimeStr(batch.timestamp).slice(0, 5)}</span>
              </div>
            </div>
          </div>
          <button onClick={onViewResults} className="w-20 button-gradient-primary text-white rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-blue-900/10 transition-all active:scale-95 border border-blue-400/20">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-widest">Ver</span>
          </button>
        </div>

        {/* Action Matrix */}
        <div className="space-y-4 shrink-0">
          {/* Row 1: Master List Actions */}
          <div className="flex gap-2.5 h-16">
            <button
              onClick={onImportMore}
              className="flex-[3.5] bg-[var(--color-emerald)]/10 hover:bg-[var(--color-emerald)]/20 text-[var(--color-emerald)] border border-[var(--color-emerald)]/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 px-5 transition-all active:scale-95 shadow-sm"
            >
              <FilePlus2 className="w-4.5 h-4.5 shrink-0" />
              <span className="leading-tight text-left">Importar Patrimônios</span>
            </button>
            <button
              onClick={() => setManualMasterOpen(true)}
              className="flex-1 card-elevated hover:bg-[var(--bg-secondary)]/90 text-[var(--color-emerald)] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md border-[var(--color-emerald)]/10"
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Manual</span>
            </button>
            <button
              onClick={handleClearMaster}
              className="w-16 bg-[var(--color-red)]/10 hover:bg-[var(--color-red)]/20 text-[var(--color-red)] border border-[var(--color-red)]/20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md"
            >
              <Trash2 className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Limpar</span>
            </button>
          </div>

          {/* Row 2: Scanning Actions */}
          <div className="flex gap-2.5 h-16">
            <button
              onClick={onContinueScanning}
              className="flex-[3.5] bg-[var(--color-emerald)] text-[var(--bg-primary)] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 px-5 transition-all active:scale-95 shadow-lg shadow-emerald-900/10 button-gradient-success border border-emerald-400/20"
            >
              <ScanLine className="w-5 h-5 shrink-0" />
              <span className="leading-tight text-left">Ler Códigos (Câmera)</span>
            </button>
            <button
              onClick={() => setManualScanOpen(true)}
              className="flex-1 card-elevated hover:bg-[var(--bg-secondary)]/90 text-[var(--color-emerald)] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md border-[var(--color-emerald)]/10"
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Manual</span>
            </button>
            <button
              onClick={handleClearScans}
              className="w-16 bg-[var(--color-red)]/10 hover:bg-[var(--color-red)]/20 text-[var(--color-red)] border border-[var(--color-red)]/20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md"
            >
              <Trash2 className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Limpar</span>
            </button>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-3 pt-2 shrink-0">
           <button onClick={handleExport} className="flex-1 h-12 card-elevated hover:bg-[var(--bg-secondary)]/90 text-[var(--color-blue)] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md border-[var(--color-blue)]/10">
            <Download className="w-4 h-4" />
            Relatório CSV
          </button>
          <button onClick={onDone} className="flex-1 h-12 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm">
            Concluir
          </button>
        </div>

        {/* Content List */}
        <div className="space-y-4 pt-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
            <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Conteúdo ({totalCount} registros)</h2>
            <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase bg-[var(--bg-secondary)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">Log Ativo</span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {(batch.type === 'VERIFICATION' ? expectedItems : scanItems.slice().reverse()).map((item: any) => {
              const isFound = batch.type === 'VERIFICATION' ? item.isFound : true;
              return (
                <div key={item.id} className="card-elevated p-4 flex items-center gap-4 transition-all hover:border-[var(--text-dim)] shadow-sm">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${isFound ? 'bg-[var(--color-emerald)]/10 border-[var(--color-emerald)]/20 text-[var(--color-emerald)]' : 'bg-[var(--color-red)]/10 border-[var(--color-red)]/20 text-[var(--color-red)] shadow-inner'}`}>
                    <Package className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xs font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{item.description || 'Patrimônio Registrado'}</h3>
                      <span className="text-[8px] font-black text-[var(--color-blue)]/70 bg-[var(--color-blue)]/5 px-1.5 py-0.5 rounded border border-[var(--color-blue)]/10 uppercase tracking-tighter">Ativo</span>
                    </div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] font-mono-code tracking-wider">ID: {item.barcode}</p>
                  </div>
                  <div className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${isFound ? 'bg-[var(--color-emerald)]/10 border-[var(--color-emerald)]/20 text-[var(--color-emerald)] shadow-sm' : 'bg-[var(--color-red)]/10 border-[var(--color-red)]/20 text-[var(--color-red)] shadow-sm'}`}>
                    {isFound ? 'Encontrado' : 'Faltante'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manual Input Modals */}
      {(manualMasterOpen || manualScanOpen) && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <form
            onSubmit={manualMasterOpen ? handleManualMasterSubmit : handleManualScanSubmit}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-9 w-full max-w-sm space-y-7 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.8)] scale-105"
          >
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">
                 {manualMasterOpen ? 'Adicionar Item' : 'Validar Item'}
               </h3>
               <button type="button" onClick={() => { setManualMasterOpen(false); setManualScanOpen(false); setManualCode(''); }} className="p-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] block ml-1">Código de Patrimônio</label>
                <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: 2250110"
                autoFocus
                className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-2xl px-6 py-4 text-xl text-[var(--text-primary)] font-mono-code focus:outline-none focus:border-[var(--color-blue)] transition-all shadow-inner"
                />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-20 ${manualMasterOpen ? 'bg-[var(--color-blue)] text-white shadow-blue-900/20' : 'bg-[var(--color-emerald)] text-[var(--bg-primary)] shadow-emerald-900/20'}`}
            >
              {manualMasterOpen ? 'Cadastrar Item' : 'Confirmar Presença'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
