import { deriveOutputPath } from "../utils/paths.ts";
import type { VideoTarget } from "../lib/mime.ts";
import { unlink } from "node:fs/promises";

export const convertVideoWithFfmpeg = async (
  sourcePath: string,
  target: VideoTarget
): Promise<string> => {
  const outPath = deriveOutputPath(sourcePath, target.ext);
  const args: string[] = [
    "-y",
    "-i",
    sourcePath,
    ...(target.encoderArgs ?? []),
    outPath,
  ];
  let proc;
  try {
    proc = Bun.spawn(["ffmpeg", ...args], {
      stdin: "ignore",
      stdout: "inherit",
      stderr: "inherit",
    });
  } catch (e) {
    throw new Error(
      "FFmpeg is required. Install 'ffmpeg' and ensure it is on your PATH.\n" +
        "LLM instructions: On macOS: brew install ffmpeg; On Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y ffmpeg; On Windows: choco install ffmpeg or scoop install ffmpeg."
    );
  }
  const code = await proc.exited;
  if (code !== 0)
    throw new Error(
      "ffmpeg conversion failed.\n" +
        "LLM instructions: Verify ffmpeg is installed and available on PATH. On macOS: brew install ffmpeg; On Ubuntu/Debian: sudo apt-get install -y ffmpeg; On Windows: choco install ffmpeg or scoop install ffmpeg."
    );

  await unlink(sourcePath);
  return outPath;
};
