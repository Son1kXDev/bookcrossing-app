import {Router} from "express";
import {prisma} from "../db/prisma.js";
import {type AuthedRequest, authGuard} from "../auth/auth-middleware.js";
import {CreateBookDto, UpdateBookDto} from "./books.dto.js";
import {ensureUploadsDir, extFromMime, getParamId, isAllowedMime, toBigInt, upload} from "../core/utilities.js";
import path from "path";
import {promises as fs} from "fs";
import {UPLOADS_DIR} from "../core/uploads.js";

export const booksRouter = Router();

const uploadsDir = UPLOADS_DIR;

booksRouter.get("/", async (_req, res) => {
    const books = await prisma.book.findMany({
        orderBy: {createdAt: "desc"},
        select: {
            id: true,
            title: true,
            author: true,
            description: true,
            coverUrl: true,
            status: true,
            createdAt: true,
            owner: {select: {id: true, displayName: true}},
        },
    });

    return res.json(
        books.map(b => ({
            ...b,
            id: b.id.toString(),
            owner: {...b.owner, id: b.owner.id.toString()},
        }))
    );
});

booksRouter.get("/my", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const books = await prisma.book.findMany({
        where: {ownerId: userId},
        orderBy: {createdAt: "desc"},
        select: {id: true, title: true, author: true, description: true, coverUrl: true, status: true, createdAt: true},
    });

    return res.json(books.map(b => ({...b, id: b.id.toString()})));
});

booksRouter.post("/", authGuard, async (req, res) => {
    const parsed = CreateBookDto.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});
    }

    const userId = (req as AuthedRequest).userId;

    const book = await prisma.book.create({
        data: {
            ownerId: userId,
            title: parsed.data.title,
            author: parsed.data.author,
            description: parsed.data.description,
        },
        select: {id: true, title: true, author: true, description: true, coverUrl: true, status: true, createdAt: true},
    });

    return res.status(201).json({...book, id: book.id.toString()});
});

booksRouter.patch("/:id", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const idStr = getParamId(req, "id");
    if (!idStr) return res.status(400).json({error: "INVALID_BOOK_ID"});

    let bookId: bigint;
    try {
        bookId = toBigInt(idStr);
    } catch {
        return res.status(400).json({error: "INVALID_BOOK_ID"});
    }

    const parsed = UpdateBookDto.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});
    }

    try {
        const out = await prisma.$transaction(async tx => {
            const book = await tx.book.findUnique({
                where: {id: bookId},
                select: {id: true, ownerId: true, status: true},
            });
            if (!book) return {error: "BOOK_NOT_FOUND" as const};
            if (book.ownerId !== userId) return {error: "FORBIDDEN" as const};
            if (book.status === "reserved") return {error: "BOOK_NOT_EDITABLE" as const};

            const data: any = {};
            if (parsed.data.title !== undefined) data.title = parsed.data.title;
            if (parsed.data.author !== undefined) data.author = parsed.data.author;
            if (parsed.data.description !== undefined) data.description = parsed.data.description;

            const updated = await tx.book.update({
                where: {id: bookId},
                data,
                select: {id: true, title: true, author: true, description: true, status: true, createdAt: true},
            });

            return {ok: true as const, updated};
        });

        if (!out.ok) return res.status(409).json({error: out.error});
        return res.json({...out.updated, id: out.updated.id.toString()});
    } catch (e) {
        console.error(e);
        return res.status(500).json({error: "INTERNAL_ERROR"});
    }
});

booksRouter.post("/:id/relist", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const raw = req.params?.id;
    const idStr = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;
    if (!idStr) return res.status(400).json({error: "INVALID_BOOK_ID"});

    let bookId: bigint;
    try {
        if (!/^\d+$/.test(idStr)) throw new Error("INVALID");
        bookId = BigInt(idStr);
    } catch {
        return res.status(400).json({error: "INVALID_BOOK_ID"});
    }

    try {
        const out = await prisma.$transaction(async (tx) => {
            const book = await tx.book.findUnique({
                where: {id: bookId},
                select: {id: true, ownerId: true, status: true},
            });

            if (!book) return {error: "BOOK_NOT_FOUND" as const};
            if (book.ownerId !== userId) return {error: "FORBIDDEN" as const};

            if (book.status !== "exchanged") return {error: "BOOK_NOT_EXCHANGED" as const};

            const activeDeal = await tx.deal.findFirst({
                where: {
                    bookId,
                    status: {in: ["pending", "accepted", "pickup_selected", "shipped"]},
                },
                select: {id: true},
            });
            if (activeDeal) return {error: "BOOK_HAS_ACTIVE_DEAL" as const};

            const updated = await tx.book.update({
                where: {id: bookId},
                data: {status: "available"},
                select: {id: true, title: true, author: true, description: true, status: true, createdAt: true},
            });

            return {ok: true as const, book: updated};
        });

        if (!out.ok) return res.status(409).json({error: out.error});
        return res.json({...out.book, id: out.book.id.toString()});
    } catch (e) {
        console.error(e);
        return res.status(500).json({error: "INTERNAL_ERROR"});
    }
});


booksRouter.delete("/:id", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const idStr = getParamId(req, "id");
    if (!idStr) return res.status(400).json({error: "INVALID_BOOK_ID"});

    let bookId: bigint;
    try {
        bookId = toBigInt(idStr);
    } catch {
        return res.status(400).json({error: "INVALID_BOOK_ID"});
    }

    try {
        const out = await prisma.$transaction(async tx => {
            const book = await tx.book.findUnique({
                where: {id: bookId},
                select: {id: true, ownerId: true, status: true},
            });
            if (!book) return {error: "BOOK_NOT_FOUND" as const};
            if (book.ownerId !== userId) return {error: "FORBIDDEN" as const};
            if (book.status === "reserved") return {error: "BOOK_NOT_DELETABLE" as const};

            const activeDeal = await tx.deal.findFirst({
                where: {
                    bookId,
                    status: {in: ["pending", "accepted", "pickup_selected", "shipped"]},
                },
                select: {id: true},
            });

            if (activeDeal) return {error: "BOOK_HAS_ACTIVE_DEAL" as const};

            await tx.book.delete({where: {id: bookId}});
            return {ok: true as const};
        });

        if (!out.ok) return res.status(409).json({error: out.error});
        return res.json({ok: true});
    } catch (e) {
        console.error(e);
        return res.status(500).json({error: "INTERNAL_ERROR"});
    }
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