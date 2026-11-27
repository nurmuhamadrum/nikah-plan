"use client";

export interface ImageCompressionOptions {
  /** Sisi terpanjang maksimum (px) setelah resize */
  maxDimension: number;
  /** Target ukuran ideal (byte); kompresi akan menurunkan kualitas adaptif hingga tercapai */
  targetMaxBytes: number;
  /** Batas keras ukuran hasil kompresi (byte) sesuai limit bucket storage */
  hardMaxBytes: number;
  /** Kualitas awal (0..1) */
  initialQuality?: number;
  /** Kualitas minimum sebelum menurunkan dimensi (0..1) */
  minQuality?: number;
  /** Batas maksimum ukuran file mentah sebelum diproses browser */
  maxInputBytes?: number;
}

export interface CompressedImageResult {
  blob: Blob;
  ext: string;
  contentType: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercent: number;
  width: number;
  height: number;
  wasCompressed: boolean;
}

export const IMAGE_COMPRESSION_PRESETS = {
  INVITATION_COVER: {
    maxDimension: 1600,
    targetMaxBytes: 450 * 1024, // 450 KB
    hardMaxBytes: 2.8 * 1024 * 1024, // aman di bawah batas 3 MB bucket `invitations`
    initialQuality: 0.82,
    minQuality: 0.45,
    maxInputBytes: 25 * 1024 * 1024,
  },
  INVITATION_GALLERY: {
    maxDimension: 1280,
    targetMaxBytes: 300 * 1024, // 300 KB
    hardMaxBytes: 2.8 * 1024 * 1024,
    initialQuality: 0.8,
    minQuality: 0.45,
    maxInputBytes: 25 * 1024 * 1024,
  },
  RECEIPT: {
    maxDimension: 1400,
    targetMaxBytes: 350 * 1024, // 350 KB
    hardMaxBytes: 4.8 * 1024 * 1024, // aman di bawah batas 5 MB bucket `receipts`
    initialQuality: 0.78,
    minQuality: 0.45,
    maxInputBytes: 25 * 1024 * 1024,
  },
} as const satisfies Record<string, ImageCompressionOptions>;

const ALLOWED_KEEP_ORIGINAL_MIMES = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
]);

/**
 * Format ukuran byte menjadi string yang ramah dibaca (contoh: "248 KB", "1,4 MB").
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 1 : 2).replace(".", ",")} MB`;
}

/**
 * Kompresi gambar adaptif di sisi klien sebelum diunggah ke Supabase Storage:
 * - Menghormati orientasi EXIF kamera ponsel via `createImageBitmap` (fallback ke `Image`).
 * - Mengubah ukuran proporsional ke `maxDimension` dengan smoothing kualitas tinggi.
 * - Loop kualitas adaptif WebP (fallback JPEG dengan latar putih) hingga <= `targetMaxBytes`.
 * - Jika masih di atas target, menurunkan dimensi bertahap hingga 2 kali.
 * - No-Bloat Guard: mempertahankan file asli jika sudah ringkas dan lebih kecil dari hasil encode.
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = IMAGE_COMPRESSION_PRESETS.INVITATION_GALLERY
): Promise<CompressedImageResult> {
  const maxInputBytes = options.maxInputBytes ?? 25 * 1024 * 1024;
  if (!file.type.startsWith("image/")) {
    throw new Error("Format file harus berupa gambar (JPG, PNG, atau WebP).");
  }
  if (file.size > maxInputBytes) {
    throw new Error(
      `Ukuran gambar terlalu besar (${formatFileSize(file.size)}). Maksimal ${formatFileSize(maxInputBytes)}.`
    );
  }

  const decoded = await decodeImageWithOrientation(file);
  try {
    const origWidth = decoded.width;
    const origHeight = decoded.height;
    let { width, height } = fitDimensions(
      origWidth,
      origHeight,
      options.maxDimension
    );

    const initialQuality = options.initialQuality ?? 0.8;
    const minQuality = options.minQuality ?? 0.45;
    const supportsWebp = await checkWebpEncodingSupport();
    const targetMime = supportsWebp ? "image/webp" : "image/jpeg";
    const targetExt = supportsWebp ? "webp" : "jpg";

    let bestBlob: Blob | null = null;
    let finalWidth = width;
    let finalHeight = height;

    // Maksimal 3 putaran dimensi (skala 100%, 80%, 64%) bila gambar sangat detail
    for (let dimPass = 0; dimPass < 3; dimPass++) {
      const canvas = renderSourceToCanvas(
        decoded.source,
        width,
        height,
        targetMime === "image/jpeg"
      );

      let quality = initialQuality;
      while (quality >= minQuality - 0.001) {
        const candidate = await canvasToBlob(
          canvas,
          targetMime,
          Math.max(minQuality, Number(quality.toFixed(2)))
        );
        if (candidate && (!bestBlob || candidate.size < bestBlob.size)) {
          bestBlob = candidate;
          finalWidth = width;
          finalHeight = height;
        }
        if (candidate && candidate.size <= options.targetMaxBytes) {
          break;
        }
        quality -= 0.1;
      }

      if (bestBlob && bestBlob.size <= options.targetMaxBytes) {
        break;
      }

      // Turunkan dimensi 20% untuk putaran berikutnya
      width = Math.max(480, Math.round(width * 0.8));
      height = Math.max(480, Math.round(height * 0.8));
    }

    // No-Bloat Guard: jika file asli sudah sesuai dimensi, MIME aman, dan lebih kecil dari hasil kompresi
    const originalFitsBounds =
      origWidth <= options.maxDimension &&
      origHeight <= options.maxDimension &&
      file.size <= options.targetMaxBytes &&
      file.size <= options.hardMaxBytes &&
      ALLOWED_KEEP_ORIGINAL_MIMES.has(file.type);

    if (
      originalFitsBounds &&
      (!bestBlob || file.size <= bestBlob.size)
    ) {
      return {
        blob: file,
        ext: mimeToExt(file.type),
        contentType: file.type,
        originalSize: file.size,
        compressedSize: file.size,
        savedBytes: 0,
        savedPercent: 0,
        width: origWidth,
        height: origHeight,
        wasCompressed: false,
      };
    }

    if (!bestBlob) {
      throw new Error("Gagal mengompresi gambar. Coba pilih foto lain.");
    }

    if (bestBlob.size > options.hardMaxBytes) {
      throw new Error(
        `Ukuran gambar setelah kompresi (${formatFileSize(bestBlob.size)}) masih melebihi batas ${formatFileSize(options.hardMaxBytes)}. Coba foto dengan resolusi lebih kecil.`
      );
    }

    const savedBytes = Math.max(0, file.size - bestBlob.size);
    const savedPercent =
      file.size > 0 ? Math.round((savedBytes / file.size) * 100) : 0;

    return {
      blob: bestBlob,
      ext: targetExt,
      contentType: bestBlob.type || targetMime,
      originalSize: file.size,
      compressedSize: bestBlob.size,
      savedBytes,
      savedPercent,
      width: finalWidth,
      height: finalHeight,
      wasCompressed: true,
    };
  } finally {
    decoded.cleanup();
  }
}

/**
 * Kompresi file bukti bayar (gambar atau PDF) sebelum diunggah ke bucket `receipts`.
 * - File PDF lolos apa adanya (batas 5 MB).
 * - File gambar diproses oleh `compressImage` menggunakan preset `RECEIPT`.
 */
export async function compressReceiptFile(
  file: File
): Promise<CompressedImageResult> {
  const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) {
      throw new Error("Ukuran file PDF maksimal 5 MB.");
    }
    return {
      blob: file,
      ext: "pdf",
      contentType: "application/pdf",
      originalSize: file.size,
      compressedSize: file.size,
      savedBytes: 0,
      savedPercent: 0,
      width: 0,
      height: 0,
      wasCompressed: false,
    };
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Format file harus berupa gambar (JPG/PNG/WebP) atau PDF.");
  }

  return compressImage(file, IMAGE_COMPRESSION_PRESETS.RECEIPT);
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function fitDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.max(1, Math.round((height * maxDimension) / width)),
    };
  }
  return {
    width: Math.max(1, Math.round((width * maxDimension) / height)),
    height: maxDimension,
  };
}

function renderSourceToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  fillWhiteBackground: boolean
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung kompresi gambar Canvas.");
  }
  if (fillWhiteBackground) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

async function decodeImageWithOrientation(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => {
          try {
            bitmap.close();
          } catch {
            // ignore
          }
        },
      };
    } catch {
      // Fallback ke HTMLImageElement jika browser tidak mendukung opsi orientation
    }
  }

  const img = await loadImageFromFile(file);
  return {
    source: img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    cleanup: () => {},
  };
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
      reject(new Error("Gagal membaca file gambar. Pastikan file tidak rusak."));
    };
    img.src = url;
  });
}

let cachedWebpSupport: boolean | null = null;

async function checkWebpEncodingSupport(): Promise<boolean> {
  if (cachedWebpSupport !== null) return cachedWebpSupport;
  try {
    const probe = document.createElement("canvas");
    probe.width = 2;
    probe.height = 2;
    const blob = await canvasToBlob(probe, "image/webp", 0.8);
    cachedWebpSupport = Boolean(blob && blob.type === "image/webp");
  } catch {
    cachedWebpSupport = false;
  }
  return cachedWebpSupport;
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

function mimeToExt(mime: string): string {
  if (mime === "image/webp") return "webp";
  if (mime === "image/png") return "png";
  return "jpg";
}
