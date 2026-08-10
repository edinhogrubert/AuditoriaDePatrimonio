import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

/**
 * Shares a string content as a file.
 * Automatically handles the difference between Web and Native (Android/iOS).
 */
export async function shareFile(content: string, fileName: string, mimeType: string = 'text/csv') {
  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Write the file to the cache directory
      const result = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Cache,
        encoding: 'utf8' as any, // Cast to any to avoid strict encoding types if needed
      });

      // 2. Share the written file
      await Share.share({
        title: fileName,
        text: `Exportação: ${fileName}`,
        url: result.uri,
        dialogTitle: 'Compartilhar arquivo',
      });
    } catch (error) {
      console.error('Erro ao compartilhar arquivo nativo:', error);
      alert('Erro ao gerar arquivo para compartilhamento.');
    }
  } else {
    // Web Fallback: Standard browser download
    const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Shares simple text using the system share sheet.
 */
export async function shareText(text: string, title: string = 'Compartilhar') {
  if (Capacitor.isNativePlatform()) {
    await Share.share({
      title,
      text,
    });
  } else {
    if (navigator.share) {
      navigator.share({ title, text }).catch(() => {});
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(text);
      alert('Texto copiado para a área de transferência.');
    }
  }
}
