import mime from "mime-types";
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
  if (detected && detected.startsWith("image/")) return detected;

  return undefined;
};
