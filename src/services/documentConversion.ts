import { deriveOutputPath } from "../utils/paths.ts";
import type { DocumentTarget } from "../lib/mime.ts";
import { unlink, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";

const convertMarkdownToHtml = async (markdownPath: string): Promise<string> => {
  const { marked } = await import("marked").catch(() => ({
    marked: undefined,
  }));
  if (!marked)
    throw new Error(
      "Missing dependency: marked. LLM instructions: bun add marked"
    );
  const md = await readFile(markdownPath, "utf8");
  return marked.parse(md) as string;
};

const writePlainTextPdf = async (
  text: string,
  outPath: string
): Promise<void> => {
  const pdfkitModule = await import("pdfkit").catch(() => ({
    default: undefined,
  }));
  const PDFDocument = pdfkitModule.default as any;
  if (!PDFDocument)
    throw new Error(
      "Missing dependency: pdfkit. LLM instructions: bun add pdfkit"
    );
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = createWriteStream(outPath);
    doc.pipe(stream);
    doc.fontSize(12).text(text);
    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", (err) => reject(err));
  });
};

const stripHtmlTags = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

const htmlToPdf = async (html: string, outPath: string): Promise<void> => {
  const text = stripHtmlTags(html);
  await writePlainTextPdf(text, outPath);
};

const markdownToPdf = async (
  markdownPath: string,
  outPath: string
): Promise<void> => {
  const html = await convertMarkdownToHtml(markdownPath);
  await htmlToPdf(html, outPath);
};

const docxToHtml = async (docxPath: string): Promise<string> => {
  const mammothModule = await import("mammoth").catch(() => undefined);
  if (!mammothModule)
    throw new Error(
      "Missing dependency: mammoth. LLM instructions: bun add mammoth"
    );
  const buffer = await readFile(docxPath);
  const res = await mammothModule.default.convertToHtml({ buffer });
  return res.value;
};

const htmlToMarkdown = async (html: string): Promise<string> => {
  const TurndownServiceModule = await import("turndown").catch(() => undefined);
  if (!TurndownServiceModule)
    throw new Error(
      "Missing dependency: turndown. LLM instructions: bun add turndown"
    );
  const TurndownService = (TurndownServiceModule as any).default;
  const service = new TurndownService();
  return service.turndown(html);
};

export const convertDocumentWithLibs = async (
  sourcePath: string,
  target: DocumentTarget
): Promise<string> => {
  const outPath = deriveOutputPath(sourcePath, target.ext);

  // Determine pipeline by target.kind
  if (target.kind === "html") {
    if (sourcePath.endsWith(".md")) {
      const html = await convertMarkdownToHtml(sourcePath);
      await writeFile(outPath, html, "utf8");
    } else if (sourcePath.endsWith(".docx")) {
      const html = await docxToHtml(sourcePath);
      await writeFile(outPath, html, "utf8");
    } else if (sourcePath.endsWith(".txt")) {
      const txt = await readFile(sourcePath, "utf8");
      await writeFile(outPath, `<pre>${escapeHtml(txt)}</pre>`, "utf8");
    } else {
      throw new Error("Unsupported source for HTML target");
    }
  } else if (target.kind === "markdown") {
    if (sourcePath.endsWith(".html")) {
      const html = await readFile(sourcePath, "utf8");
      const md = await htmlToMarkdown(html);
      await writeFile(outPath, md, "utf8");
    } else if (sourcePath.endsWith(".txt")) {
      const txt = await readFile(sourcePath, "utf8");
      await writeFile(outPath, txt, "utf8");
    } else {
      throw new Error("Unsupported source for Markdown target");
    }
  } else if (target.kind === "pdf") {
    if (sourcePath.endsWith(".md")) {
      await markdownToPdf(sourcePath, outPath);
    } else if (sourcePath.endsWith(".html")) {
      const html = await readFile(sourcePath, "utf8");
      await htmlToPdf(html, outPath);
    } else if (sourcePath.endsWith(".docx")) {
      const html = await docxToHtml(sourcePath);
      await htmlToPdf(html, outPath);
    } else if (sourcePath.endsWith(".txt")) {
      const txt = await readFile(sourcePath, "utf8");
      await htmlToPdf(`<pre>${escapeHtml(txt)}</pre>`, outPath);
    } else {
      throw new Error("Unsupported source for PDF target");
    }
  } else if (target.kind === "docx") {
    throw new Error(
      "Conversion to DOCX not supported without LibreOffice. Choose pdf/html/markdown instead."
    );
  } else if (target.kind === "text") {
    if (sourcePath.endsWith(".md") || sourcePath.endsWith(".html")) {
      const content = await readFile(sourcePath, "utf8");
      await writeFile(outPath, content, "utf8");
    } else {
      const content = await readFile(sourcePath);
      await writeFile(outPath, content);
    }
  } else {
    throw new Error("Unsupported document target");
  }

  await unlink(sourcePath);
  return outPath;
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
