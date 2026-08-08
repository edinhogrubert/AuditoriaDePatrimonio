import React, { useEffect, useRef, useState } from 'react';
import { BarcodeScanner, LensFacing, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Zap, ZapOff, Camera, Upload, Loader2 } from 'lucide-react';
import { decodeQrCodeFromImageFile } from '../utils/qrDecoder';

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

    lastBarcodeRef.current = '';
    lastScanTimeRef.current = 0;

    const startScanner = async () => {
      try {
        setIsLoading(true);
        setCameraError(null);
        setUsingWebcamFallback(false);

        // Minimal delay for hardware stability
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Try Capacitor ML Kit scanner first
        const status = await BarcodeScanner.checkPermissions().catch(() => null);
        if (status && status.camera !== 'granted') {
          const requestStatus = await BarcodeScanner.requestPermissions().catch(() => null);
          if (requestStatus && requestStatus.camera !== 'granted') {
            throw new Error('Permissão de câmera negada.');
          }
        }

        if (!isComponentMounted.current) return;

        document.querySelector('html')?.classList.add('barcode-scanner-active');
        document.querySelector('body')?.classList.add('barcode-scanner-active');

        await BarcodeScanner.removeAllListeners();
        await BarcodeScanner.addListener('barcodeScanned', (event) => {
          if (!isComponentMounted.current) return;

          const now = Date.now();
          const { barcode } = event;

          // Component-level anti-duplicate: 1.5 seconds threshold
          if (barcode.displayValue === lastBarcodeRef.current && (now - lastScanTimeRef.current < 1500)) {
            return;
          }

          lastBarcodeRef.current = barcode.displayValue;
          lastScanTimeRef.current = now;

          let typeStr = 'CODE';
          const fmt = (barcode.format || '').toUpperCase();
          if (fmt.includes('QR')) typeStr = 'QR CODE';
          else if (fmt.includes('EAN_13')) typeStr = 'EAN-13';
          else if (fmt.includes('CODE_128')) typeStr = 'CODE 128';
          else if (fmt.includes('CODE_39')) typeStr = 'CODE 39';
          else if (fmt.includes('UPC')) typeStr = 'UPC';

          onScan(barcode.displayValue, typeStr);
        });

        await BarcodeScanner.startScan({
          formats: [], // Empty array = all formats supported by ML Kit for maximum speed
          lensFacing: LensFacing.Back,
        });

        setIsLoading(false);
      } catch (nativeErr: any) {
        console.warn('Native scanner not available, falling back to browser webcam:', nativeErr);
        if (!isComponentMounted.current) return;

        // Fallback to Web Camera via ZXing
        try {
          setUsingWebcamFallback(true);
          const constraints = {
            video: { facingMode: { ideal: 'environment' } },
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }

          const codeReader = new BrowserMultiFormatReader();
          zxingReaderRef.current = codeReader;

          if (videoRef.current) {
            codeReader.decodeFromVideoDevice(null, videoRef.current, (result: any, err: any) => {
              if (!isComponentMounted.current) return;
              if (result) {
                const text = result.getText();
                if (text) {
                  const now = Date.now();
                  if (text === lastBarcodeRef.current && (now - lastScanTimeRef.current < 1500)) {
                    return;
                  }
                  lastBarcodeRef.current = text;
                  lastScanTimeRef.current = now;
                  onScan(text, 'BARCODE');
                }
              }
            }).catch((e) => {
              if (!(e instanceof NotFoundException)) {
                console.debug('ZXing scan error:', e);
              }
            });
          }

          setIsLoading(false);
        } catch (webErr: any) {
          console.error('Webcam fallback error:', webErr);
          if (isComponentMounted.current) {
            setIsLoading(false);
            setCameraError(webErr.message || 'Erro ao acessar câmera.');
            document.querySelector('html')?.classList.remove('barcode-scanner-active');
            document.querySelector('body')?.classList.remove('barcode-scanner-active');
          }
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
        if (track && typeof track.applyConstraints === 'function') {
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
      onScan(text, 'QR CODE');
    } catch (err: any) {
      alert(err?.message || 'Nenhum código identificado.');
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
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
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Iniciando Câmera...</p>
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

      {cameraError && !isLoading && active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0A0D14] z-40">
          <Camera className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Câmera Não Disponível</h3>
          <p className="text-sm text-gray-400 mb-6 font-mono text-[10px] break-all">{cameraError}</p>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" /> Fazer Upload de Imagem/QR
          </button>
        </div>
      )}

      {showOverlay && active && !isLoading && !cameraError && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 z-10">
          <div className="mt-2 bg-[#1A1F26]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-800 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {usingWebcamFallback ? 'Webcam Scanner Ativo' : 'ML Kit Ativo'}
            </span>
          </div>

          <div className="relative w-72 h-72 rounded-3xl border-2 border-white/10 flex items-center justify-center my-auto">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400/60 rounded-tl-xl -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400/60 rounded-tr-xl -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400/60 rounded-bl-xl -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400/60 rounded-br-xl -mb-1 -mr-1"></div>
            <div className="absolute inset-x-0 h-0.5 bg-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-scanner-laser top-0"></div>
          </div>

          <div className="mb-20 bg-[#1A1F26]/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-800 text-center">
            <p className="text-xs text-gray-300 font-medium">Aponte para o código de barras ou QR code</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {active && (
          <button onClick={toggleFlash} className={`p-3 rounded-full border backdrop-blur-md transition-all ${isFlashOn ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-zinc-900/80 text-gray-400 border-zinc-800'}`}>
            {isFlashOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-zinc-900/80 text-gray-300 border border-zinc-800 backdrop-blur-md hover:text-white" title="Upload de Imagem/QR">
          <Upload className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
