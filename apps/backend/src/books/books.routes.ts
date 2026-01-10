import {Router} from "express";
import {prisma} from "../db/prisma.js";
import {type AuthedRequest, authGuard} from "../auth/auth-middleware.js";
import {CreateBookDto} from "./books.dto.js";

export const booksRouter = Router();

booksRouter.get("/", async (_req, res) => {
    const books = await prisma.book.findMany({
        orderBy: {createdAt: "desc"},
        select: {
            id: true,
            title: true,
            author: true,
            description: true,
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
        select: {id: true, title: true, author: true, description: true, status: true, createdAt: true},
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
        select: {id: true, title: true, author: true, description: true, status: true, createdAt: true},
    });

    return res.status(201).json({...book, id: book.id.toString()});
});
