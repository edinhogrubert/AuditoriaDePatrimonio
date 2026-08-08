import React, { useEffect, useRef, useState } from 'react';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Zap, ZapOff, Camera, Upload, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface CameraScannerProps {
  onScan: (barcode: string, format: string) => void;
  active?: boolean;
  showOverlay?: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScan,
  active = true,
  showOverlay = true,
}) => {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComponentMounted = useRef(true);
  const lastBarcodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    isComponentMounted.current = true;

    const startScanner = async () => {
      // Pause scanner if not active
      if (!active) {
        document.querySelector('html')?.classList.remove('barcode-scanner-active');
        document.querySelector('body')?.classList.remove('barcode-scanner-active');
        await BarcodeScanner.stopScan().catch(() => {});
        return;
      }

      // Reset last barcode when starting a new scan session
      lastBarcodeRef.current = '';
      lastScanTimeRef.current = 0;

      try {
        setIsLoading(true);
        setCameraError(null);

        // Minimal delay for hardware stability (reduced from 500ms for speed)
        await new Promise(resolve => setTimeout(resolve, 200));

        const status = await BarcodeScanner.checkPermissions();
        if (status.camera !== 'granted') {
          const requestStatus = await BarcodeScanner.requestPermissions();
          if (requestStatus.camera !== 'granted') {
            throw new Error('Permissão de câmera negada.');
          }
        }

        if (!isComponentMounted.current) return;

        setHasCamera(true);
        document.querySelector('html')?.classList.add('barcode-scanner-active');
        document.querySelector('body')?.classList.add('barcode-scanner-active');

        await BarcodeScanner.removeAllListeners();
        await BarcodeScanner.addListener('barcodeScanned', (event) => {
          if (!isComponentMounted.current) return;

          const now = Date.now();
          const { barcode } = event;

          // Anti-duplicate protection: 1.5 seconds threshold (optimized from 2s)
          if (barcode.displayValue === lastBarcodeRef.current && (now - lastScanTimeRef.current < 1500)) {
            return;
          }

          lastBarcodeRef.current = barcode.displayValue;
          lastScanTimeRef.current = now;

          let typeStr = 'CODE';
          const fmt = barcode.format.toUpperCase();
          if (fmt.includes('QR')) typeStr = 'QR CODE';
          else if (fmt.includes('EAN_13')) typeStr = 'EAN-13';
          else if (fmt.includes('CODE_128')) typeStr = 'CODE 128';
          else if (fmt.includes('CODE_39')) typeStr = 'CODE 39';
          else if (fmt.includes('UPC')) typeStr = 'UPC';

          onScan(barcode.displayValue, typeStr);
        });

        await BarcodeScanner.startScan({
          formats: [], // Empty array = all formats supported by ML Kit for maximum speed and compatibility
          lensFacing: LensFacing.Back,
        });

        setIsLoading(false);
      } catch (err: any) {
        console.error('Native scanner error:', err);
        if (isComponentMounted.current) {
          setHasCamera(false);
          setIsLoading(false);
          setCameraError(err.message || 'Erro ao iniciar scanner nativo.');
          document.querySelector('html')?.classList.remove('barcode-scanner-active');
          document.querySelector('body')?.classList.remove('barcode-scanner-active');
        }
      }
    };

    startScanner();

    return () => {
      isComponentMounted.current = false;
      document.querySelector('html')?.classList.remove('barcode-scanner-active');
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
      BarcodeScanner.removeAllListeners();
      BarcodeScanner.stopScan().catch(() => {});
    };
  }, [active, onScan]);

  const toggleFlash = async () => {
    try {
      await BarcodeScanner.toggleTorch();
      setIsFlashOn(!isFlashOn);
    } catch (e) {
      console.error('Torch error', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = async () => {
          try {
            const codeReader = new BrowserMultiFormatReader();
            const res = await codeReader.decodeFromImageElement(img);
            if (res && res.getText()) {
              onScan(res.getText(), 'QR CODE');
            } else {
              alert('Nenhum código identificado na imagem.');
            }
          } catch (err) {
            alert('Erro ao processar imagem.');
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-transparent overflow-hidden select-none">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />

      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0D14] space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Iniciando Motor Nativo...</p>
        </div>
      )}

      {!active && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0D14] z-10 p-6 text-center">
           <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Camera className="w-10 h-10 text-emerald-500" />
           </div>
           <h3 className="text-lg font-bold text-white mb-2">Scanner Pronto</h3>
           <p className="text-sm text-gray-400 max-w-xs">Clique no botão de leitura para ativar a câmera.</p>
        </div>
      )}

      {hasCamera === false && !isLoading && active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0A0D14] z-40">
          <Camera className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Scanner Não Disponível</h3>
          <p className="text-sm text-gray-400 mb-6 font-mono text-[10px] break-all">{cameraError}</p>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-darkCard border border-gray-700 text-white rounded-xl text-xs font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" /> Upload Imagem
          </button>
        </div>
      )}

      {showOverlay && active && !isLoading && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 z-10">
          <div className="mt-2 bg-[#1A1F26]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-800 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">ML Kit Ativo</span>
          </div>

          <div className="relative w-72 h-72 rounded-3xl border-2 border-white/10 flex items-center justify-center my-auto">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400/60 rounded-tl-xl -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400/60 rounded-tr-xl -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400/60 rounded-bl-xl -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400/60 rounded-br-xl -mb-1 -mr-1"></div>
            <div className="absolute inset-x-0 h-0.5 bg-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-scanner-laser top-0"></div>
          </div>

          <div className="mb-20 bg-[#1A1F26]/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-800 text-center">
            <p className="text-xs text-gray-300 font-medium">Aponte para o código</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {active && (
          <button onClick={toggleFlash} className={`p-3 rounded-full border backdrop-blur-md transition-all ${isFlashOn ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-darkCard/80 text-gray-400 border-gray-800'}`}>
            {isFlashOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-darkCard/80 text-gray-300 border border-gray-800 backdrop-blur-md hover:text-white">
          <Upload className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
