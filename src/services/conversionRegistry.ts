import {
  resolveImageTarget,
  isImageMimeType,
  resolveAudioTarget,
  isAudioMimeType,
  resolveVideoTarget,
  isVideoMimeType,
  resolveDocumentTarget,
  isDocumentMimeType,
} from "../lib/mime.ts";
import { convertImageWithSharp } from "./imageConversion.ts";
import { convertAudioWithFfmpeg } from "./audioConversion.ts";
import { convertVideoWithFfmpeg } from "./videoConversion.ts";
import { convertDocumentWithSoffice } from "./documentConversion.ts";

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

  if (isAudioMimeType(sourceMimeType) && targetMimeType.startsWith("audio/")) {
    const target = resolveAudioTarget(targetMimeType);
    if (!target) throw new Error("Unsupported target audio MIME type");

    const outputPath = await convertAudioWithFfmpeg(sourcePath, target);
    return { outputPath };
  }

  if (isVideoMimeType(sourceMimeType) && targetMimeType.startsWith("video/")) {
    const target = resolveVideoTarget(targetMimeType);
    if (!target) throw new Error("Unsupported target video MIME type");

    const outputPath = await convertVideoWithFfmpeg(sourcePath, target);
    return { outputPath };
  }

  if (isDocumentMimeType(sourceMimeType)) {
    const target = resolveDocumentTarget(targetMimeType);
    if (!target) throw new Error("Unsupported target document MIME type");

    const outputPath = await convertDocumentWithSoffice(sourcePath, target);
    return { outputPath };
  }

  throw new Error("Not implemented yet for these MIME types");
};
