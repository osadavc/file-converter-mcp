import { deriveOutputPath } from "../utils/paths.ts";
import type { SharpTarget } from "../lib/mime.ts";
import { unlink } from "node:fs/promises";

export const convertImageWithSharp = async (
  sourcePath: string,
  target: SharpTarget
): Promise<string> => {
  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;

  await sharp(sourcePath).metadata();

  const outPath = deriveOutputPath(sourcePath, target.ext);

  let transformer = sharp(sourcePath);
  if (target.format === "jpeg") transformer = transformer.jpeg();
  if (target.format === "png") transformer = transformer.png();
  if (target.format === "webp") transformer = transformer.webp();
  if (target.format === "avif") transformer = transformer.avif();
  if (target.format === "tiff") transformer = transformer.tiff();

  await transformer.toFile(outPath);
  await unlink(sourcePath);
  return outPath;
};
