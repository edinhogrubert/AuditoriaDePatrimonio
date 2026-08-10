import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

/**
 * Utility to ensure the Google Barcode Scanner module is installed on the device.
 * Essential for some Android devices where the ML Kit model isn't pre-installed.
 */
export async function ensureScannerHardware() {
  try {
    const isAvailable = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!isAvailable.available) {
      await BarcodeScanner.installGoogleBarcodeScanner();
    }
    return true;
  } catch (e) {
    console.warn('Scanner hardware check failed', e);
    return false;
  }
}
