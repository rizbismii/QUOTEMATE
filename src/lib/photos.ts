export async function filesToPhotos(files: FileList | File[]): Promise<{ id: string; dataUrl: string; name: string }[]> {
  const list = Array.from(files).slice(0, 8);
  const photos = await Promise.all(list.map((file) => compressImage(file)));
  return photos;
}

async function compressImage(file: File): Promise<{ id: string; dataUrl: string; name: string }> {
  const dataUrl = await readFile(file);
  const compressed = await resizeDataUrl(dataUrl, 1280, 0.72);
  return {
    id: `ph_${Math.random().toString(36).slice(2, 9)}`,
    dataUrl: compressed,
    name: file.name,
  };
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function resizeDataUrl(dataUrl: string, maxEdge: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}
