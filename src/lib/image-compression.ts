"use client";

/**
 * Kompresi gambar bukti bayar di sisi klien sebelum diunggah ke Supabase Storage.
 * - File PDF lolos apa adanya (batas 5 MB sesuai konfigurasi bucket `receipts`).
 * - File gambar diubah ukurannya ke maksimal 1400px dan dikompresi ke WebP/JPEG kualitas 0.8.
 */
export async function compressReceiptFile(
  file: File
): Promise<{ blob: Blob; ext: string; contentType: string }> {
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  if (file.type === "application/pdf") {
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("Ukuran file PDF maksimal 5 MB.");
    }
    return { blob: file, ext: "pdf", contentType: "application/pdf" };
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Format file harus berupa gambar (JPG/PNG/WebP) atau PDF.");
  }

  const imageBitmap = await loadImageFromFile(file);
  const maxDimension = 1400;
  let { width, height } = imageBitmap;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung kompresi gambar Canvas.");
  }
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Coba WebP dulu, fallback ke JPEG jika browser tidak mendukung WebP encoding
  const webpBlob = await canvasToBlob(canvas, "image/webp", 0.8);
  if (webpBlob && webpBlob.type === "image/webp") {
    return { blob: webpBlob, ext: "webp", contentType: "image/webp" };
  }

  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.82);
  if (jpegBlob) {
    return { blob: jpegBlob, ext: "jpg", contentType: "image/jpeg" };
  }

  return { blob: file, ext: "jpg", contentType: file.type || "image/jpeg" };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca file gambar bukti bayar."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}
