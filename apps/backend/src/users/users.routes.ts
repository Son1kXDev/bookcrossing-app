import {Router} from "express";
import {prisma} from "../db/prisma.js";
import {AuthedRequest, authGuard} from "../auth/auth-middleware.js";
import {getParamId, toBigInt} from "../core/utilities.js";
import {UpdateMeDto} from "./users.dto.js";
import multer from "multer";
import path from "path";
import {fileURLToPath} from "url";
import {promises as fs} from "fs";

export const usersRouter = Router();

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

usersRouter.get("/:id", async (req, res) => {
    const idStr = getParamId(req, "id");
    if (!idStr) return res.status(400).json({error: "INVALID_USER_ID"});

    let userId: bigint;
    try {
        userId = toBigInt(idStr);
    } catch {
        return res.status(400).json({error: "INVALID_USER_ID"});
    }

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            id: true,
            displayName: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
        },
    });

    if (!user) return res.status(404).json({error: "NOT_FOUND"});

    return res.json({
        id: user.id.toString(),
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
    });
});

usersRouter.patch("/me", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const parsed = UpdateMeDto.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});
    }

    const data: any = {};
    if (parsed.data.displayName !== undefined) data.displayName = parsed.data.displayName;

    const updated = await prisma.user.update({
        where: {id: userId},
        data,
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            wallet: {select: {balance: true, updatedAt: true}},
        },
    });

    return res.json({
        id: updated.id.toString(),
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt,
        wallet: updated.wallet ? {balance: updated.wallet.balance, updatedAt: updated.wallet.updatedAt} : null,
    });
});

usersRouter.post("/me/avatar", authGuard, upload.single("file"), async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const file = req.file;
    if (!file) return res.status(400).json({error: "FILE_REQUIRED"});
    if (!isAllowedMime(file.mimetype)) return res.status(400).json({error: "UNSUPPORTED_FILE_TYPE"});

    const ext = extFromMime(file.mimetype);
    if (!ext) return res.status(400).json({error: "UNSUPPORTED_FILE_TYPE"});

    await ensureUploadsDir();

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, avatarUrl: true},
    });
    if (!user) return res.status(404).json({error: "NOT_FOUND"});

    const filename = `user_${userId.toString()}_${Date.now()}${ext}`;
    const fullPath = path.join(uploadsDir, filename);
    await fs.writeFile(fullPath, file.buffer);

    if (user.avatarUrl?.startsWith("/uploads/")) {
        const oldName = user.avatarUrl.replace("/uploads/", "");
        const oldPath = path.join(uploadsDir, oldName);
        await fs.unlink(oldPath).catch(() => {
        });
    }

    const avatarUrl = `/uploads/${filename}`;

    const updated = await prisma.user.update({
        where: {id: userId},
        data: {avatarUrl},
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            wallet: {select: {balance: true, updatedAt: true}},
        },
    });

    return res.json({
        id: updated.id.toString(),
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt,
        wallet: updated.wallet ? {balance: updated.wallet.balance, updatedAt: updated.wallet.updatedAt} : null,
    });
});

usersRouter.delete("/me/avatar", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {avatarUrl: true},
    });
    if (!user) return res.status(404).json({error: "NOT_FOUND"});

    if (user.avatarUrl?.startsWith("/uploads/")) {
        const name = user.avatarUrl.replace("/uploads/", "");
        const fullPath = path.join(uploadsDir, name);
        await fs.unlink(fullPath).catch(() => {
        });
    }

    await prisma.user.update({where: {id: userId}, data: {avatarUrl: null}});
    return res.json({ok: true});
});
