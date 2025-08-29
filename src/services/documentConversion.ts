import { deriveOutputPath } from "../utils/paths.ts";
import type { DocumentTarget } from "../lib/mime.ts";
import { dirname, basename, extname, join } from "node:path";
import { rename, unlink } from "node:fs/promises";

export const convertDocumentWithSoffice = async (
  sourcePath: string,
  target: DocumentTarget
): Promise<string> => {
  const outDir = dirname(sourcePath);
  const base = basename(sourcePath, extname(sourcePath));
  const expectedOut = join(outDir, `${base}.${target.ext}`);
  const desiredOut = deriveOutputPath(sourcePath, target.ext);

  const args: string[] = [
    "--headless",
    "--convert-to",
    target.convertTo,
    "--outdir",
    outDir,
    sourcePath,
  ];

  let proc;
  try {
    proc = Bun.spawn(["soffice", ...args], {
      stdin: "ignore",
      stdout: "inherit",
      stderr: "inherit",
    });
  } catch (e) {
    throw new Error(
      "LibreOffice is required. Install 'soffice' (LibreOffice) and ensure it is on your PATH.\n" +
        "LLM instructions: On macOS: brew install --cask libreoffice; On Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y libreoffice; On Windows: choco install libreoffice or winget install 'The Document Foundation.LibreOffice'."
    );
  }

  const code = await proc.exited;
  if (code !== 0)
    throw new Error(
      "document conversion failed.\n" +
        "LLM instructions: Verify LibreOffice 'soffice' CLI is installed and on PATH. On macOS: brew install --cask libreoffice; On Ubuntu/Debian: sudo apt-get install -y libreoffice; On Windows: choco install libreoffice or winget install 'The Document Foundation.LibreOffice'."
    );

  if (expectedOut !== desiredOut) {
    try {
      await rename(expectedOut, desiredOut);
    } catch {
      // If rename fails, fall back to expectedOut
    }
  }

  await unlink(sourcePath);
  return expectedOut === desiredOut ? expectedOut : desiredOut;
};
