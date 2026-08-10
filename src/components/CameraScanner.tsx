import React, { useEffect, useRef, useState } from 'react';
import { BarcodeScanner, LensFacing, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Zap, ZapOff, Camera, Upload, Loader2 } from 'lucide-react';
import { decodeQrCodeFromImageFile } from '../utils/qrDecoder';
import { ensureScannerHardware } from '../utils/cameraFix';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [usingWebcamFallback, setUsingWebcamFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComponentMounted = useRef(true);
  const lastBarcodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    isComponentMounted.current = true;

    const stopAllScanners = async () => {
      document.querySelector('html')?.classList.remove('barcode-scanner-active');
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
      try {
        await BarcodeScanner.stopScan().catch(() => {});
        await BarcodeScanner.removeAllListeners().catch(() => {});
        setIsFlashOn(false);
      } catch {}

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (zxingReaderRef.current) {
        try {
          zxingReaderRef.current.reset();
        } catch {}
      }
    };

    if (!active) {
      stopAllScanners();
      return;
    }

    const startScanner = async () => {
      try {
        setIsLoading(true);
        setCameraError(null);
        setUsingWebcamFallback(false);
        lastBarcodeRef.current = '';
        lastScanTimeRef.current = 0;

        // 1. Ensure Google ML Kit hardware module is available
        await ensureScannerHardware();

        // 2. Check Permissions
        const status = await BarcodeScanner.checkPermissions().catch(() => null);
        if (status && status.camera !== 'granted') {
          const requestStatus = await BarcodeScanner.requestPermissions().catch(() => null);
          if (requestStatus && requestStatus.camera !== 'granted') {
            throw new Error('Permissão de câmera negada.');
          }
        }

        if (!isComponentMounted.current) return;

        // 3. Prepare Web Overlay for Transparency
        document.querySelector('html')?.classList.add('barcode-scanner-active');
        document.querySelector('body')?.classList.add('barcode-scanner-active');

        // 4. Setup Listener
        await BarcodeScanner.removeAllListeners();
        await BarcodeScanner.addListener('barcodeScanned', (event) => {
          if (!isComponentMounted.current) return;

          const now = Date.now();
          const { barcode } = event;

          // Universal anti-duplicate protection (1.5 seconds)
          if (barcode.displayValue === lastBarcodeRef.current && (now - lastScanTimeRef.current < 1500)) {
            return;
          }

          lastBarcodeRef.current = barcode.displayValue;
          lastScanTimeRef.current = now;

          // Format normalization
          let typeStr = 'BARCODE';
          const fmt = (barcode.format || '').toUpperCase();
          if (fmt.includes('QR')) typeStr = 'QR CODE';
          else if (fmt.includes('DATA_MATRIX')) typeStr = 'DATA MATRIX';
          else if (fmt.includes('CODE_128')) typeStr = 'CODE 128';
          else if (fmt.includes('CODE_39')) typeStr = 'CODE 39';
          else if (fmt.includes('EAN_13')) typeStr = 'EAN-13';

          onScan(barcode.displayValue, typeStr);
        });

        // 5. Start Hardware with All Formats Support
        await BarcodeScanner.startScan({
          lensFacing: LensFacing.Back,
          formats: [
            BarcodeFormat.QrCode,
            BarcodeFormat.DataMatrix,
            BarcodeFormat.Aztec,
            BarcodeFormat.Pdf417,
            BarcodeFormat.Code128,
            BarcodeFormat.Code39,
            BarcodeFormat.Code93,
            BarcodeFormat.Itf,
            BarcodeFormat.Ean13,
            BarcodeFormat.Ean8,
            BarcodeFormat.UpcA,
            BarcodeFormat.UpcE,
            BarcodeFormat.Codabar
          ],
        });

        setIsLoading(false);
      } catch (nativeErr: any) {
        console.warn('Native ML Kit not available, fallback to Web Cam:', nativeErr);
        if (!isComponentMounted.current) return;

        // ZXing Fallback
        try {
          setUsingWebcamFallback(true);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
          });
          mediaStreamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }

          const codeReader = new BrowserMultiFormatReader();
          zxingReaderRef.current = codeReader;

          if (videoRef.current) {
            codeReader.decodeFromVideoDevice(null, videoRef.current, (result: any) => {
              if (!isComponentMounted.current) return;
              if (result) {
                const text = result.getText();
                const now = Date.now();
                if (text && (text !== lastBarcodeRef.current || (now - lastScanTimeRef.current > 1500))) {
                  lastBarcodeRef.current = text;
                  lastScanTimeRef.current = now;
                  onScan(text, 'BARCODE');
                }
              }
            }).catch(() => {});
          }
          setIsLoading(false);
        } catch (webErr: any) {
          setCameraError(webErr.message || 'Erro ao carregar câmera.');
          setIsLoading(false);
          document.querySelector('html')?.classList.remove('barcode-scanner-active');
          document.querySelector('body')?.classList.remove('barcode-scanner-active');
        }
      }
    };

    startScanner();

    return () => {
      isComponentMounted.current = false;
      stopAllScanners();
    };
  }, [active, onScan]);

  const toggleFlash = async () => {
    try {
      if (usingWebcamFallback) {
        const track = mediaStreamRef.current?.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities?.() || {};
          if (capabilities.torch) {
            const nextState = !isFlashOn;
            await track.applyConstraints({ advanced: [{ torch: nextState } as any] });
            setIsFlashOn(nextState);
          }
        }
      } else {
        await BarcodeScanner.toggleTorch();
        setIsFlashOn(!isFlashOn);
      }
    } catch (e) {
      console.error('Torch error', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const text = await decodeQrCodeFromImageFile(file);
      onScan(text, 'IMAGE_QR');
    } catch (err: any) {
      alert(err?.message || 'Erro ao identificar código na imagem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none ${usingWebcamFallback ? 'bg-black' : 'bg-transparent'}`}>
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />

      {usingWebcamFallback && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0D14] space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Iniciando Hardware...</p>
        </div>
      )}

      {cameraError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0A0D14] z-40">
          <Camera className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Falha na Câmera</h3>
          <p className="text-xs text-gray-400 mb-6 font-mono break-all">{cameraError}</p>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" /> Usar Galeria / PC
          </button>
        </div>
      )}

      {showOverlay && active && !isLoading && !cameraError && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
          <div className="relative w-64 h-64 rounded-[2.5rem] border-2 border-white/10 flex items-center justify-center">
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl"></div>

            <div className="w-full h-0.5 bg-emerald-400/50 shadow-[0_0_15px_#10b981] absolute top-0 animate-scanner-laser"></div>
          </div>

          <div className="mt-10 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Foque no Código</p>
          </div>
        </div>
      )}

      <div className="absolute top-6 right-6 z-30 flex flex-col gap-3">
        <button onClick={toggleFlash} className={`p-4 rounded-full border backdrop-blur-md transition-all active:scale-90 ${isFlashOn ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-black/60 border-white/10 text-white/60'}`}>
          {isFlashOn ? <Zap className="w-6 h-6 fill-current" /> : <ZapOff className="w-6 h-6" />}
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="p-4 rounded-full bg-black/60 border border-white/10 text-white/60 backdrop-blur-md active:scale-90 transition-all">
          <Upload className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
