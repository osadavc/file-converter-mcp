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
      "FFmpeg is required. Install 'ffmpeg' and ensure it is on your PATH."
    );
  }
  const code = await proc.exited;
  if (code !== 0) throw new Error("ffmpeg conversion failed");

  await unlink(sourcePath);
  return outPath;
};
