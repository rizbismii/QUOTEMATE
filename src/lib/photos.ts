export async function filesToPhotos(files: FileList | File[]): Promise<{ id: string; dataUrl: string; name: string }[]> {
  const list = Array.from(files).slice(0, 8);
  const photos = await Promise.all(list.map((file) => compressImage(file)));
  return photos;
}

async function compressImage(file: File): Promise<{ id: string; dataUrl: string; name: string }> {
  const dataUrl = await readFile(file);
  const compressed = await resizeDataUrl(dataUrl, 1280, 0.72, "image/jpeg");
  return {
    id: `ph_${Math.random().toString(36).slice(2, 9)}`,
    dataUrl: compressed,
    name: file.name,
  };
}

export async function fileToLogo(file: File): Promise<string> {
  const dataUrl = await readFile(file);
  if (file.type === "image/svg+xml") return dataUrl;
  const mime = file.type === "image/png" || file.type === "image/webp" ? "image/png" : "image/jpeg";
  return resizeDataUrl(dataUrl, 640, 0.86, mime);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function resizeDataUrl(dataUrl: string, maxEdge: number, quality: number, mime = "image/jpeg"): Promise<string> {
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
      if (mime === "image/png") {
        ctx.clearRect(0, 0, width, height);
      }
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL(mime, quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}
