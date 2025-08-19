export type SharpTarget = {
  format: "jpeg" | "png" | "webp" | "avif" | "tiff";
  ext: string;
};

export const mimeTypeRegex =
  /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+\-]{0,126}\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+\-]{0,126}$/;

export const resolveImageTarget = (mime: string): SharpTarget | undefined => {
  const map: Record<string, SharpTarget> = {
    "image/jpeg": { format: "jpeg", ext: "jpg" },
    "image/jpg": { format: "jpeg", ext: "jpg" },
    "image/png": { format: "png", ext: "png" },
    "image/webp": { format: "webp", ext: "webp" },
    "image/avif": { format: "avif", ext: "avif" },
    "image/tiff": { format: "tiff", ext: "tiff" },
  };
  return map[mime];
};

export const isImageMimeType = (mime: string): boolean =>
  mime.startsWith("image/");
