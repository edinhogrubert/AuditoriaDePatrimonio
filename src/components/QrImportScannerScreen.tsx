import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Tag, RefreshCw, Check, Upload, Image as ImageIcon, QrCode, Sparkles, Loader2 } from 'lucide-react';
import { CameraScanner } from './CameraScanner';
import { createBatch, getUniqueCategories, getUniqueDescriptions } from '../services/storage';
import { AppSettings } from '../types';
import { decodeQrCodeFromImageFile } from '../utils/qrDecoder';

interface QrImportScannerScreenProps {
  batchName: string;
  onBack: () => void;
  onImported: (batchId: number) => void;
  onAddExpectedToBatch: (
    batchId: number,
    items: { barcode: string; description?: string; category?: string }[]
  ) => void;
  targetBatchId?: number;
  settings: AppSettings;
  initialContent?: string;
}

export const QrImportScannerScreen: React.FC<QrImportScannerScreenProps> = ({
  batchName,
  onBack,
  onImported,
  onAddExpectedToBatch,
  targetBatchId,
  settings,
  initialContent,
}) => {
  const [scannedContent, setScannedContent] = useState<string | null>(initialContent || null);
  const [selectedDelimiter, setSelectedDelimiter] = useState<'\n' | ';' | ','>('\n');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [globalName, setGlobalName] = useState('');
  const [globalCategory, setGlobalCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingCategories = getUniqueCategories();
  const existingNames = getUniqueDescriptions();

  // Auto-detect delimiter when content is scanned
  useEffect(() => {
    if (scannedContent) {
      if (scannedContent.includes(';')) setSelectedDelimiter(';');
      else if (scannedContent.includes(',')) setSelectedDelimiter(',');
      else setSelectedDelimiter('\n');
    }
  }, [scannedContent]);

  const parseQrLines = (content: string, delimiter: string) => {
    const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed: { barcode: string; description?: string; category?: string }[] = [];
    let invalidCols = false;
    let colCountError = 0;

    for (const line of rawLines) {
      let cols = line.includes(delimiter) && delimiter !== '\n'
        ? line.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim()).filter(Boolean)
        : line.split(/[,;\t]|\s{2,}/).map((c) => c.replace(/^"|"$/g, '').trim()).filter(Boolean);

      if (cols.length === 1 && cols[0].includes(' ')) {
        const parts = cols[0].split(/\s+/);
        if (parts.length > 1) {
          cols = [parts[0], parts.slice(1).join(' ')];
        }
      }

      if (cols.length < 1 || cols.length > 3) {
        invalidCols = true;
        colCountError = cols.length;
        break;
      }
      if (cols[0]) {
        parsed.push({
          barcode: cols[0],
          description: cols[1] || undefined,
          category: cols[2] || undefined,
        });
      }
    }

    return { parsed, invalidCols, colCountError };
  };

  const { parsed: parsedStructItems, invalidCols, colCountError } = scannedContent
    ? parseQrLines(scannedContent, selectedDelimiter)
    : { parsed: [], invalidCols: false, colCountError: 0 };

  const parsedItems = parsedStructItems.map((item) => item.barcode);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingImage(true);

    try {
      const text = await decodeQrCodeFromImageFile(file);
      setScannedContent(text);
    } catch (err: any) {
      setUploadError(err?.message || 'Não foi possível ler o QR Code da imagem.');
    } finally {
      setIsProcessingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!parsedStructItems.length) return;

    if (invalidCols) {
      setUploadError(
        `Importação Negada! O QR Code possui linhas com ${colCountError} colunas. Apenas 1 coluna (Patrimônio), 2 colunas (Patrimônio, Nome) ou 3 colunas (Patrimônio, Nome, Categoria) são aceitas.`
      );
      return;
    }

    let expectedList = parsedStructItems.map((item) => ({
      barcode: item.barcode.trim(),
      description: item.description?.trim() || globalName.trim() || 'Item de Inventário',
      category: item.category?.trim() || globalCategory.trim() || 'Sem Categoria',
    }));

    // Duplicate detection
    const uniqueBarcodes = new Set<string>();
    const duplicates: string[] = [];
    expectedList.forEach(item => {
      const code = item.barcode.toLowerCase();
      if (uniqueBarcodes.has(code)) {
        duplicates.push(item.barcode);
      } else {
        uniqueBarcodes.add(code);
      }
    });

    if (duplicates.length > 0) {
      if (settings.autoRemoveDuplicates) {
        // Remove automatically
        const seen = new Set<string>();
        expectedList = expectedList.filter(item => {
          const code = item.barcode.toLowerCase();
          if (seen.has(code)) return false;
          seen.add(code);
          return true;
        });
        alert(`Removidos ${duplicates.length} patrimônios duplicados automaticamente.`);
      } else {
        // Ask user
        if (confirm(`Encontramos ${duplicates.length} patrimônios duplicados no QR Code. Deseja removê-los?`)) {
          const seen = new Set<string>();
          expectedList = expectedList.filter(item => {
            const code = item.barcode.toLowerCase();
            if (seen.has(code)) return false;
            seen.add(code);
            return true;
          });
        }
      }
    }

    if (targetBatchId) {
      onAddExpectedToBatch(targetBatchId, expectedList);
      onImported(targetBatchId);
    } else {
      const newBatch = createBatch(
        batchName || 'Conferência QR Mestre',
        'Importado via QR Mestre',
        'VERIFICATION',
        expectedList
      );
      onImported(newBatch.id);
    }
  };

  return (
    <div className={`min-h-screen text-[var(--text-primary)] flex flex-col justify-between max-w-md mx-auto select-none relative pb-16 shadow-[var(--card-shadow)] border-x border-[var(--border-color)] transition-colors ${!scannedContent ? 'bg-transparent' : 'bg-[var(--bg-primary)]'}`}>
      
      {/* Hidden File Input for PC upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 h-14 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-[var(--bg-primary)] text-[var(--color-blue)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)]">Escanear QR Mestre</h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium">Importação Rápida de Ativos</p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-[var(--bg-accent)] hover:opacity-80 text-[var(--color-blue)] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-[var(--border-color)]"
        >
          <Upload className="w-3.5 h-3.5" />
          Abrir Imagem
        </button>
      </header>

      {/* Main Container */}
      <main className="p-4 space-y-4 flex-1">
        
        {/* Mode 1: Camera Scanner & File Upload Option */}
        {!scannedContent && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-secondary)]/90 backdrop-blur-sm border border-[var(--border-color)] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[var(--color-blue)]" />
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">Importar por Câmera ou Arquivo</h2>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Aponte a câmera para o QR Code Mestre contendo a lista de patrimônios ou selecione uma foto salva no seu computador.
              </p>

              {/* Action Button: PC File Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[var(--color-blue)] hover:opacity-90 text-white rounded-xl py-3 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
              >
                <ImageIcon className="w-4 h-4" />
                Carregar Imagem com QR Code do Computador (PC)
              </button>
            </div>

            {uploadError && (
              <div className="bg-[var(--color-red)]/10 text-[var(--color-red)] border border-[var(--color-red)]/30 rounded-xl p-3 text-xs font-medium">
                {uploadError}
              </div>
            )}

            {/* Camera Viewport Container */}
            <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-[var(--border-color)] flex flex-col items-center justify-center bg-transparent">
              <CameraScanner onScan={(barcode) => setScannedContent(barcode)} />
              <div className="absolute bottom-3 inset-x-3 z-30 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-center text-[11px] text-white">
                Aponte para o QR Code ou clique em "Abrir Imagem" acima
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Content Review */}
        {scannedContent && (
          <div className="space-y-4">
            <div className="bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded-2xl p-4 space-y-1">
              <h2 className="text-sm font-bold text-[var(--color-emerald)]">QR Code Lido com Sucesso!</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Encontramos <span className="font-bold text-[var(--text-primary)]">{parsedItems.length} patrimônios</span> no código.
              </p>
            </div>

            {/* Delimiter Selection */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2 shadow-sm">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase block">
                SELECIONE O DELIMITADOR
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Quebra de Linha', val: '\n' },
                  { label: 'Ponto-e-vírgula (;)', val: ';' },
                  { label: 'Vírgula (,)', val: ',' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSelectedDelimiter(item.val as any)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      selectedDelimiter === item.val
                        ? 'bg-[var(--color-blue)] text-white border-[var(--color-blue)] shadow-sm'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Global Configuration Panel */}
            <div className="bg-[var(--bg-accent)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 shadow-md">
              <p className="text-[10px] font-extrabold text-[var(--color-emerald)] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> CONFIGURAÇÃO GLOBAL
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block">NOME PADRÃO</label>
                  <input
                    type="text"
                    list="qr-names-list"
                    value={globalName}
                    onChange={(e) => setGlobalName(e.target.value)}
                    placeholder="Ex: Notebook"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-blue)]"
                  />
                  <datalist id="qr-names-list">
                    {existingNames.map(name => <option key={name} value={name} />)}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block">CATEGORIA PADRÃO</label>
                  <input
                    type="text"
                    list="qr-categories-list"
                    value={globalCategory}
                    onChange={(e) => setGlobalCategory(e.target.value)}
                    placeholder="Ex: TI"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-blue)]"
                  />
                  <datalist id="qr-categories-list">
                    {existingCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Preview Items Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2 shadow-sm">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase block">
                PRÉVIA DOS ITENS ({parsedItems.length})
              </label>
              <div className="max-h-56 overflow-y-auto space-y-2 font-mono-code text-xs">
                {parsedItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 py-1.5 border-b border-[var(--border-color)] last:border-0">
                    <Tag className="w-3.5 h-3.5 text-[var(--color-blue)] shrink-0" />
                    <span className="text-[var(--text-primary)] font-bold truncate">{item}</span>
                  </div>
                ))}
                {parsedItems.length > 10 && (
                  <div className="pt-2 text-center text-[10px] text-[var(--text-dim)] font-semibold">
                    ... e mais {parsedItems.length - 10} itens na lista
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setScannedContent(null);
                  setUploadError(null);
                }}
                className="py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--color-blue)] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-[var(--color-blue)]" />
                Repetir / Nova Imagem
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={parsedItems.length === 0}
                className="py-3 bg-[var(--color-blue)] hover:opacity-90 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Confirmar e Abrir
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

