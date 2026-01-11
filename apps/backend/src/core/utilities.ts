import {promises as fs} from "node:fs";
import multer from "multer";
import {UPLOADS_DIR} from "./uploads.js";

const uploadsDir = UPLOADS_DIR;

export function toBigInt(v: string | number): bigint {
    if (typeof v === "number") return BigInt(v);
    if (!/^\d+$/.test(v)) throw new Error("INVALID_ID");
    return BigInt(v);
}

export function getParamId(req: any, key: string): string | null {
    const raw = req.params?.[key];
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return raw[0] ?? null;
    return null;
}

export async function ensureUploadsDir() {
    await fs.mkdir(uploadsDir, {recursive: true});
}

export function extFromMime(mime: string) {
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/png") return ".png";
    if (mime === "image/webp") return ".webp";
    return "";
}

export function isAllowedMime(mime: string) {
    return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 2 * 1024 * 1024},
});