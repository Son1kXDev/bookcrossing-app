import multer from "multer";
import path from "path";
import {fileURLToPath} from "url";
import {promises as fs} from "fs";
import {prisma} from "../db/prisma.js";
import {booksRouter} from "./books.routes.js";
import {AuthedRequest, authGuard} from "../auth/auth-middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

async function ensureUploadsDir() {
    await fs.mkdir(uploadsDir, {recursive: true});
}

function extFromMime(mime: string) {
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/png") return ".png";
    if (mime === "image/webp") return ".webp";
    return "";
}

function isAllowedMime(mime: string) {
    return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 2 * 1024 * 1024},
});

booksRouter.post("/:id/cover", authGuard, upload.single("file"), async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const idStr = String(req.params.id ?? "");
    if (!/^\d+$/.test(idStr)) return res.status(400).json({error: "INVALID_BOOK_ID"});
    const bookId = BigInt(idStr);

    const file = req.file;
    if (!file) return res.status(400).json({error: "FILE_REQUIRED"});
    if (!isAllowedMime(file.mimetype)) return res.status(400).json({error: "UNSUPPORTED_FILE_TYPE"});

    const ext = extFromMime(file.mimetype);
    if (!ext) return res.status(400).json({error: "UNSUPPORTED_FILE_TYPE"});

    const book = await prisma.book.findUnique({
        where: {id: bookId},
        select: {id: true, ownerId: true, coverUrl: true},
    });
    if (!book) return res.status(404).json({error: "BOOK_NOT_FOUND"});
    if (book.ownerId !== userId) return res.status(403).json({error: "FORBIDDEN"});

    await ensureUploadsDir();

    const filename = `book_${bookId.toString()}_${Date.now()}${ext}`;
    const fullPath = path.join(uploadsDir, filename);

    await fs.writeFile(fullPath, file.buffer);

    if (book.coverUrl?.startsWith("/uploads/")) {
        const oldName = book.coverUrl.replace("/uploads/", "");
        const oldPath = path.join(uploadsDir, oldName);
        await fs.unlink(oldPath).catch(() => {
        });
    }

    const coverUrl = `/uploads/${filename}`;

    const updated = await prisma.book.update({
        where: {id: bookId},
        data: {coverUrl},
        select: {id: true, title: true, author: true, description: true, status: true, createdAt: true, coverUrl: true},
    });

    return res.json({...updated, id: updated.id.toString()});
});

booksRouter.delete("/:id/cover", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const idStr = String(req.params.id ?? "");
    if (!/^\d+$/.test(idStr)) return res.status(400).json({error: "INVALID_BOOK_ID"});
    const bookId = BigInt(idStr);

    const book = await prisma.book.findUnique({
        where: {id: bookId},
        select: {id: true, ownerId: true, coverUrl: true},
    });
    if (!book) return res.status(404).json({error: "BOOK_NOT_FOUND"});
    if (book.ownerId !== userId) return res.status(403).json({error: "FORBIDDEN"});

    if (book.coverUrl?.startsWith("/uploads/")) {
        const name = book.coverUrl.replace("/uploads/", "");
        const fullPath = path.join(uploadsDir, name);
        await fs.unlink(fullPath).catch(() => {
        });
    }

    await prisma.book.update({where: {id: bookId}, data: {coverUrl: null}});
    return res.json({ok: true});
});
