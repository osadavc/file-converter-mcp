import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mimeTypeRegex } from "./lib/mime.ts";
import { detectSourceMime } from "./lib/detect.ts";
import { convertDispatch } from "./services/conversionRegistry.ts";

const server = new McpServer({
  name: "file-converter",
  version: "0.1.0",
});

server.tool(
  "convert_file",
  "Convert a file to a target MIME type. Conversions are within categories (image→image, audio→audio, video→video, documents→documents); cross-category is not supported. You can convert between these types:\n" +
    "- Images: image/jpeg, image/jpg, image/png, image/webp, image/avif, image/tiff\n" +
    "- Audio: audio/mpeg, audio/wav, audio/ogg, audio/webm, audio/flac, audio/aac, audio/mp4\n" +
    "- Video: video/mp4, video/webm, video/ogg, video/x-matroska, video/quicktime\n" +
    "- Documents: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.oasis.opendocument.text, application/rtf, text/plain, text/html, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.openxmlformats-officedocument.presentationml.presentation",
  {
    sourcePath: z
      .string()
      .min(1)
      .describe(
        "Absolute path to the source file to convert (e.g. /Users/alice/Documents/input.docx)"
      ),
    targetMimeType: z
      .string()
      .regex(mimeTypeRegex, {
        message: "Must be a valid MIME type like application/pdf or image/png",
      })
      .describe(
        "Desired output MIME type (same-category only). See tool description for supported targets."
      ),
  },
  async ({ sourcePath, targetMimeType }) => {
    const sourceMime = await detectSourceMime(sourcePath);
    if (!sourceMime) {
      return {
        content: [
          {
            type: "text",
            text: "Could not detect source MIME type.",
          },
        ],
      };
    }

    try {
      const result = await convertDispatch({
        sourcePath,
        sourceMimeType: sourceMime,
        targetMimeType,
      });
      return {
        content: [
          {
            type: "text",
            text: `Converted file written to: ${result.outputPath}`,
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed.";
      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      };
    }
  }
);

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("File Converter MCP Server running on stdio");
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
