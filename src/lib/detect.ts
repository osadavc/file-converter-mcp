import mime from "mime-types";
import { isDocumentMimeType } from "./mime.ts";
import { stat } from "node:fs/promises";

export const detectSourceMime = async (
  sourcePath: string
): Promise<string | undefined> => {
  try {
    const s = await stat(sourcePath);
    if (!s.isFile()) return undefined;
  } catch {
    return undefined;
  }

  const detected = mime.lookup(sourcePath);
  if (!detected) return undefined;
  if (
    detected.startsWith("image/") ||
    detected.startsWith("audio/") ||
    detected.startsWith("video/") ||
    isDocumentMimeType(detected)
  )
    return detected;

  return undefined;
};
