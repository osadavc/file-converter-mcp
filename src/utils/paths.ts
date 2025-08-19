import { basename, dirname, extname, join } from "node:path";

export const deriveOutputPath = (
  sourcePath: string,
  desiredExtension: string
): string => {
  const dir = dirname(sourcePath);
  const base = basename(sourcePath, extname(sourcePath));
  let outPath = join(dir, `${base}.${desiredExtension}`);
  if (outPath === sourcePath) {
    outPath = join(dir, `${base}-converted.${desiredExtension}`);
  }
  return outPath;
};
