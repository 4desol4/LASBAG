import path from "node:path";
import { AppError } from "../../lib/errors.js";
const ALLOWED: Record<string, { mime: string; magic: number[] }> = {
  ".pdf": { mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  ".png": { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  ".jpg": { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  ".jpeg": { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
};
export const MAX_BYTES = 10 * 1024 * 1024;
export function validateUpload(f: { originalname: string; mimetype: string; buffer: Buffer; size: number }) {
  const name = path.basename(f.originalname).replace(/[^\w.\- ()]/g, "_").slice(0, 120); // no path traversal
  const rule = ALLOWED[path.extname(name).toLowerCase()];
  if (!rule) throw new AppError(415, "Only PDF, PNG and JPG files are accepted.");
  if (f.mimetype !== rule.mime) throw new AppError(415, "The file type does not match its extension.");
  if (f.size > MAX_BYTES) throw new AppError(413, "Files must be 10 MB or smaller.");
  if (!rule.magic.every((b, i) => f.buffer[i] === b)) throw new AppError(415, "The file content is not a valid document.");
  return { name, mime: rule.mime };
}
