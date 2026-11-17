import type { LogoImage } from './core';

export class LogoReadError extends Error {
  constructor() {
    super('file is not a readable image');
    this.name = 'LogoReadError';
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new LogoReadError());
    reader.onerror = () => reject(new LogoReadError());
    reader.readAsDataURL(file);
  });
}

function measure(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 1;
      const height = img.naturalHeight || 1;
      resolve({ width, height });
    };
    img.onerror = () => reject(new LogoReadError());
    img.src = dataUrl;
  });
}

/** Reads a dropped or picked image into the form core expects. Nothing leaves the device. */
export async function readLogo(file: File): Promise<LogoImage> {
  if (!file.type.startsWith('image/')) throw new LogoReadError();
  const dataUrl = await readAsDataUrl(file);
  if (!dataUrl.startsWith('data:image/')) throw new LogoReadError();
  const { width, height } = await measure(dataUrl);
  return { dataUrl, width, height };
}
