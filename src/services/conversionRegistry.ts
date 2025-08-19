import { resolveImageTarget, isImageMimeType } from "../lib/mime.ts";
import { convertImageWithSharp } from "./imageConversion.ts";

export type ConversionResult = {
  outputPath: string;
};

export type Converter = (params: {
  sourcePath: string;
  sourceMimeType: string;
  targetMimeType: string;
}) => Promise<ConversionResult>;

export const convertDispatch: Converter = async ({
  sourcePath,
  sourceMimeType,
  targetMimeType,
}) => {
  if (isImageMimeType(sourceMimeType) && targetMimeType.startsWith("image/")) {
    const target = resolveImageTarget(targetMimeType);
    if (!target) throw new Error("Unsupported target image MIME type");

    const outputPath = await convertImageWithSharp(sourcePath, target);
    return { outputPath };
  }

  throw new Error("Not implemented yet for these MIME types");
};
